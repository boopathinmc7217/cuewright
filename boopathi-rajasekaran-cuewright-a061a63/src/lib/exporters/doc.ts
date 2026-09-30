import {
  AlignmentType,
  Document,
  Header,
  ImageRun,
  Packer,
  PageNumber,
  Paragraph,
  TextRun,
} from "docx";
import { blobToDataUrl, kitScenes, lookSummary, mediaMap, rasterKind } from "@/lib/kit";
import { displayLine, slugline } from "@/lib/screenplay";
import type { ExportPlugin } from "@/lib/exporters/types";
import type { LineType, Project } from "@/lib/types";

const COURIER = "Courier New";

function run(text: string, bold = false) {
  return new TextRun({ text, font: COURIER, size: 24, bold });
}

function para(
  text: string,
  options: { left?: number; right?: number; align?: (typeof AlignmentType)[keyof typeof AlignmentType]; bold?: boolean; before?: number; after?: number } = {},
) {
  return new Paragraph({
    spacing: { before: options.before ?? 0, after: options.after ?? 120 },
    indent: { left: options.left, right: options.right },
    alignment: options.align,
    children: [run(text, options.bold)],
  });
}

const LINE_INDENT: Record<
  LineType,
  {
    left?: number;
    right?: number;
    align?: (typeof AlignmentType)[keyof typeof AlignmentType];
    bold?: boolean;
  }
> = {
  action: {},
  shot: { bold: true },
  character: { left: 3168 },
  parenthetical: { left: 2304 },
  dialogue: { left: 1440, right: 1440 },
  transition: { align: AlignmentType.RIGHT },
};

export const docxPlugin: ExportPlugin = {
  id: "docx",
  label: "Word",
  hint: ".docx",
  extension: "docx",
  async run({ project, media }) {
    const script: Paragraph[] = [];
    project.scenes.forEach((scene, index) => {
      script.push(para(slugline(scene), { bold: true, before: index === 0 ? 0 : 240, after: 200 }));
      for (const line of scene.lines) {
        const text = displayLine(line);
        if (!text) continue;
        const indent = LINE_INDENT[line.type];
        script.push(
          para(text, {
            left: indent.left,
            right: indent.right,
            align: indent.align,
            bold: indent.bold,
            before: line.type === "character" ? 200 : 0,
          }),
        );
      }
    });

    script.push(para("SCENE KIT", { bold: true, before: 400 }));
    script.push(
      para("Hair, dress color, wardrobe, location, and reference media for every scene."),
    );

    for (const character of project.characters) {
      const look = lookSummary({
        hairStyle: character.hairStyle,
        hairColor: character.hairColor,
        dressColors: character.dressColors,
        wardrobeNotes: character.wardrobeNotes,
        custom: false,
      });
      script.push(para(`${character.name.toUpperCase()} — ${[character.role, character.age].filter(Boolean).join(", ")}`, { bold: true, before: 200 }));
      script.push(para(`Hair: ${look.hair}`));
      script.push(para(`Dress colors: ${look.colors}`));
      script.push(para(`Wardrobe: ${look.wardrobe}`));
    }

    const assets = mediaMap(media);
    for (const scene of kitScenes(project)) {
      script.push(para(`${scene.number}. ${scene.slug}`, { bold: true, before: 280 }));
      if (scene.synopsis) script.push(para(`Synopsis: ${scene.synopsis}`));
      if (scene.continuity) script.push(para(`Continuity: ${scene.continuity}`));
      if (scene.locationName) script.push(para(`Shooting location: ${scene.locationName}`));
      if (scene.address) script.push(para(`Address: ${scene.address}`));
      if (scene.mapsUrl) script.push(para(`Map: ${scene.mapsUrl}`));
      if (scene.locationNotes) script.push(para(scene.locationNotes));
      for (const link of scene.links) script.push(para(`${link.kind}: ${link.label} — ${link.url}`));
      for (const look of scene.looks) {
        const summary = lookSummary(look.look);
        script.push(
          para(`${look.name.toUpperCase()} (${look.look.custom ? "this scene" : "bible"})`, { bold: true, before: 160 }),
        );
        script.push(para(`Hair: ${summary.hair}`));
        script.push(para(`Dress colors: ${summary.colors}`));
        script.push(para(`Wardrobe: ${summary.wardrobe}`));
      }
      const ids = [...scene.photoIds, ...scene.mediaIds];
      for (const id of ids) {
        const asset = assets.get(id);
        if (!asset) continue;
        const image = await imageParagraph(asset.blob, asset.mime, asset.name);
        script.push(image ?? para(`Attached: ${asset.name}`));
      }
    }

    const titleChildren = [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 2800, after: 400 },
        children: [new TextRun({ text: project.title.trim() || "Untitled", font: COURIER, size: 32, bold: true })],
      }),
      para("Written by", { align: AlignmentType.CENTER, after: 200 }),
      para(project.author.trim() || " ", { align: AlignmentType.CENTER, after: 400 }),
    ];
    if (project.contact.trim()) titleChildren.push(para(project.contact.trim(), { align: AlignmentType.CENTER }));
    if (project.draft.trim()) titleChildren.push(para(project.draft.trim(), { align: AlignmentType.CENTER }));
    if (project.logline.trim()) titleChildren.push(para(project.logline.trim(), { align: AlignmentType.CENTER, before: 300 }));

    const doc = new Document({
      title: project.title,
      creator: project.author || "Cuewright",
      sections: [
        {
          properties: {
            page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } },
          },
          children: titleChildren,
        },
        {
          properties: {
            page: { margin: { top: 1440, bottom: 1440, left: 2160, right: 1440 } },
          },
          headers: {
            default: new Header({
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new TextRun({
                      children: [PageNumber.CURRENT],
                      font: COURIER,
                      size: 24,
                    }),
                  ],
                }),
              ],
            }),
          },
          children: script,
        },
      ],
    });

    return Packer.toBlob(doc);
  },
};

async function imageParagraph(blob: Blob, mime: string, name: string) {
  if (mime.startsWith("video/")) return para(`Video attached: ${name}`);
  const kind = rasterKind(mime);
  if (!kind || blob.size > 4 * 1024 * 1024) return para(`Still attached: ${name}`);
  try {
    const bitmap = await createImageBitmap(blob);
    const scale = Math.min(420 / bitmap.width, 240 / bitmap.height, 1);
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    bitmap.close();
    const data = new Uint8Array(await blob.arrayBuffer());
    return new Paragraph({
      spacing: { before: 120, after: 80 },
      children: [
        new ImageRun({
          type: kind,
          data,
          transformation: { width, height },
          altText: { name, title: name, description: name },
        }),
      ],
    });
  } catch {
    return para(`Still attached: ${name}`);
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function htmlParagraph(text: string, className: string) {
  return `<p class="${className}">${escapeHtml(text).replace(/\n/g, "<br>")}</p>`;
}

export const docPlugin: ExportPlugin = {
  id: "doc",
  label: "Word 97-2003",
  hint: ".doc",
  extension: "doc",
  async run({ project, media }) {
    const html = await renderDocHtml(project, media);
    return new Blob([html], { type: "application/msword" });
  },
};

async function renderDocHtml(project: Project, media: Parameters<ExportPlugin["run"]>[0]["media"]) {
  const assets = mediaMap(media);
  const body: string[] = [];
  body.push(`<h1 class="title">${escapeHtml(project.title.trim() || "Untitled")}</h1>`);
  body.push(`<p class="credit">Written by<br>${escapeHtml(project.author.trim() || "")}</p>`);
  if (project.contact.trim()) body.push(`<p class="credit">${escapeHtml(project.contact.trim())}</p>`);
  if (project.draft.trim()) body.push(`<p class="credit">${escapeHtml(project.draft.trim())}</p>`);
  if (project.logline.trim()) body.push(`<p class="credit">${escapeHtml(project.logline.trim())}</p>`);
  body.push(`<br style="page-break-before: always">`);

  for (const scene of project.scenes) {
    body.push(htmlParagraph(slugline(scene), "slug"));
    for (const line of scene.lines) {
      const text = displayLine(line);
      if (!text) continue;
      body.push(htmlParagraph(text, line.type));
    }
  }

  body.push(`<h2>Scene kit</h2>`);
  body.push(`<p class="action">Hair, dress color, wardrobe, location, and reference media.</p>`);
  for (const scene of kitScenes(project)) {
    body.push(`<h3>${escapeHtml(`${scene.number}. ${scene.slug}`)}</h3>`);
    if (scene.synopsis) body.push(htmlParagraph(`Synopsis: ${scene.synopsis}`, "action"));
    if (scene.continuity) body.push(htmlParagraph(`Continuity: ${scene.continuity}`, "action"));
    if (scene.locationName) body.push(htmlParagraph(`Shooting location: ${scene.locationName}`, "action"));
    if (scene.address) body.push(htmlParagraph(`Address: ${scene.address}`, "action"));
    if (scene.mapsUrl) body.push(htmlParagraph(`Map: ${scene.mapsUrl}`, "action"));
    if (scene.locationNotes) body.push(htmlParagraph(scene.locationNotes, "action"));
    for (const link of scene.links) {
      body.push(htmlParagraph(`${link.kind}: ${link.label} — ${link.url}`, "action"));
    }
    for (const look of scene.looks) {
      const summary = lookSummary(look.look);
      body.push(htmlParagraph(`${look.name} (${look.look.custom ? "this scene" : "bible"})`, "character"));
      body.push(htmlParagraph(`Hair: ${summary.hair}`, "action"));
      body.push(htmlParagraph(`Dress colors: ${summary.colors}`, "action"));
      body.push(htmlParagraph(`Wardrobe: ${summary.wardrobe}`, "action"));
    }
    for (const id of [...scene.photoIds, ...scene.mediaIds]) {
      const asset = assets.get(id);
      if (!asset) continue;
      if (asset.mime.startsWith("image/") && rasterKind(asset.mime) && asset.blob.size <= 1_500_000) {
        const src = await blobToDataUrl(asset.blob);
        body.push(`<p><img src="${src}" alt="${escapeHtml(asset.name)}" width="420"><br>${escapeHtml(asset.name)}</p>`);
      } else {
        body.push(htmlParagraph(`Attached: ${asset.name}`, "action"));
      }
    }
  }

  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head>
<meta charset="utf-8">
<title>${escapeHtml(project.title || "Screenplay")}</title>
<style>
@page { size: 8.5in 11in; margin: 1in 1in 1in 1.5in; }
body { font-family: "Courier New", Courier, monospace; font-size: 12pt; color: #111; }
h1.title, .credit { text-align: center; font-weight: normal; }
h1.title { margin-top: 2.4in; font-size: 16pt; }
h2, h3 { font-family: "Courier New", Courier, monospace; }
.slug { font-weight: bold; margin-top: 12pt; }
.action, .shot { margin: 0 0 12pt 0; }
.shot { font-weight: bold; }
.character { margin: 12pt 0 0 2.2in; }
.parenthetical { margin: 0 2in 0 1.6in; }
.dialogue { margin: 0 1.5in 12pt 1in; }
.transition { text-align: right; margin: 12pt 0; }
img { margin-top: 8pt; }
</style>
</head>
<body>
${body.join("\n")}
</body>
</html>`;
}
