import { jsPDF } from "jspdf";
import { kitScenes, lookSummary, mediaMap, rasterKind } from "@/lib/kit";
import { displayLine, slugline } from "@/lib/screenplay";
import type { ExportPlugin } from "@/lib/exporters/types";
import type { LineType } from "@/lib/types";

const PAGE_W = 612;
const LEFT = 108;
const RIGHT = 540;
const TOP = 72;
const BOTTOM = 720;
const LEAD = 14;

const LAYOUT: Record<LineType, { x: number; width: number; align: "left" | "right"; bold: boolean }> = {
  action: { x: LEFT, width: RIGHT - LEFT, align: "left", bold: false },
  shot: { x: LEFT, width: RIGHT - LEFT, align: "left", bold: true },
  character: { x: 266, width: 180, align: "left", bold: false },
  parenthetical: { x: 223, width: 180, align: "left", bold: false },
  dialogue: { x: 180, width: 252, align: "left", bold: false },
  transition: { x: LEFT, width: RIGHT - LEFT, align: "right", bold: false },
};

export const pdfPlugin: ExportPlugin = {
  id: "pdf",
  label: "PDF",
  hint: ".pdf · paged screenplay",
  extension: "pdf",
  async run({ project, media }) {
    const doc = new jsPDF({ unit: "pt", format: "letter" });
    let y = 280;
    const center = (text: string, size: number, bold = false) => {
      doc.setFont("courier", bold ? "bold" : "normal");
      doc.setFontSize(size);
      const lines = doc.splitTextToSize(text, 420) as string[];
      for (const line of lines) {
        doc.text(line, PAGE_W / 2, y, { align: "center" });
        y += size + 6;
      }
    };
    center(project.title.trim() || "Untitled", 16, true);
    y += 18;
    center("Written by", 12);
    y += 6;
    center(project.author.trim() || " ", 12);
    y += 28;
    if (project.contact.trim()) center(project.contact.trim(), 11);
    if (project.draft.trim()) center(project.draft.trim(), 11);
    if (project.logline.trim()) {
      y += 18;
      center(project.logline.trim(), 11);
    }

    let page = 0;
    const newPage = () => {
      doc.addPage();
      page += 1;
      y = TOP;
      doc.setFont("courier", "normal");
      doc.setFontSize(12);
      doc.text(String(page), RIGHT, 48, { align: "right" });
    };
    const ensure = (height: number) => {
      if (y + height > BOTTOM) newPage();
    };
    const writeWrapped = (
      text: string,
      x: number,
      width: number,
      align: "left" | "right",
      bold = false,
    ) => {
      doc.setFont("courier", bold ? "bold" : "normal");
      doc.setFontSize(12);
      const parts = doc.splitTextToSize(text, width) as string[];
      for (const part of parts) {
        ensure(LEAD);
        if (align === "right") doc.text(part, RIGHT, y, { align: "right" });
        else doc.text(part, x, y);
        y += LEAD;
      }
    };

    newPage();
    project.scenes.forEach((scene, index) => {
      if (index > 0) y += LEAD;
      writeWrapped(slugline(scene), LEFT, RIGHT - LEFT, "left", true);
      y += 4;
      for (const line of scene.lines) {
        const text = displayLine(line);
        if (!text) continue;
        const layout = LAYOUT[line.type];
        writeWrapped(text, layout.x, layout.width, layout.align, layout.bold);
        y += 6;
      }
    });

    y += LEAD;
    writeWrapped("SCENE KIT", LEFT, RIGHT - LEFT, "left", true);
    writeWrapped(
      "Hair, dress color, wardrobe, location, and reference media.",
      LEFT,
      RIGHT - LEFT,
      "left",
    );
    y += 8;

    const assets = mediaMap(media);
    if (project.characters.length) {
      writeWrapped("CAST BIBLE", LEFT, RIGHT - LEFT, "left", true);
      for (const character of project.characters) {
        const look = lookSummary({
          hairStyle: character.hairStyle,
          hairColor: character.hairColor,
          dressColors: character.dressColors,
          wardrobeNotes: character.wardrobeNotes,
          custom: false,
        });
        writeWrapped(
          `${character.name.toUpperCase()}  ${[character.role, character.age].filter(Boolean).join(", ")}`,
          LEFT,
          RIGHT - LEFT,
          "left",
          true,
        );
        writeWrapped(`Hair: ${look.hair}`, LEFT, RIGHT - LEFT, "left");
        writeWrapped(`Dress colors: ${look.colors}`, LEFT, RIGHT - LEFT, "left");
        writeWrapped(`Wardrobe: ${look.wardrobe}`, LEFT, RIGHT - LEFT, "left");
        y += 6;
      }
    }

    for (const scene of kitScenes(project)) {
      y += 8;
      writeWrapped(`${scene.number}. ${scene.slug}`, LEFT, RIGHT - LEFT, "left", true);
      if (scene.synopsis) writeWrapped(`Synopsis: ${scene.synopsis}`, LEFT, RIGHT - LEFT, "left");
      if (scene.continuity) writeWrapped(`Continuity: ${scene.continuity}`, LEFT, RIGHT - LEFT, "left");
      if (scene.locationName) writeWrapped(`Shooting location: ${scene.locationName}`, LEFT, RIGHT - LEFT, "left");
      if (scene.address) writeWrapped(`Address: ${scene.address}`, LEFT, RIGHT - LEFT, "left");
      if (scene.mapsUrl) writeWrapped(`Map: ${scene.mapsUrl}`, LEFT, RIGHT - LEFT, "left");
      if (scene.locationNotes) writeWrapped(scene.locationNotes, LEFT, RIGHT - LEFT, "left");
      for (const link of scene.links) {
        writeWrapped(`${link.kind}: ${link.label}  ${link.url}`, LEFT, RIGHT - LEFT, "left");
      }
      for (const look of scene.looks) {
        const summary = lookSummary(look.look);
        writeWrapped(
          `${look.name.toUpperCase()} (${look.look.custom ? "this scene" : "bible"})`,
          LEFT,
          RIGHT - LEFT,
          "left",
          true,
        );
        writeWrapped(`Hair: ${summary.hair}`, LEFT, RIGHT - LEFT, "left");
        writeWrapped(`Dress colors: ${summary.colors}`, LEFT, RIGHT - LEFT, "left");
        writeWrapped(`Wardrobe: ${summary.wardrobe}`, LEFT, RIGHT - LEFT, "left");
      }

      const imageIds = [...scene.photoIds, ...scene.mediaIds, ...scene.looks.map((look) => look.portraitId)];
      const seen = new Set<string>();
      for (const id of imageIds) {
        if (!id || seen.has(id)) continue;
        seen.add(id);
        const asset = assets.get(id);
        if (!asset || !asset.mime.startsWith("image/")) {
          if (asset?.mime.startsWith("video/")) {
            writeWrapped(`Video attached: ${asset.name}`, LEFT, RIGHT - LEFT, "left");
          }
          continue;
        }
        const kind = rasterKind(asset.mime);
        if ((kind !== "jpg" && kind !== "png") || asset.blob.size > 4 * 1024 * 1024) {
          writeWrapped(`Still attached (not embedded): ${asset.name}`, LEFT, RIGHT - LEFT, "left");
          continue;
        }
        try {
          const bitmap = await createImageBitmap(asset.blob);
          const maxW = 360;
          const maxH = 200;
          const scale = Math.min(maxW / bitmap.width, maxH / bitmap.height, 1);
          const w = bitmap.width * scale;
          const h = bitmap.height * scale;
          bitmap.close();
          ensure(h + 28);
          const url = await blobToPdf(asset.blob);
          const format = kind === "jpg" ? "JPEG" : "PNG";
          doc.addImage(url, format, LEFT, y, w, h);
          y += h + 4;
          writeWrapped(asset.name, LEFT, RIGHT - LEFT, "left");
          y += 6;
        } catch {
          writeWrapped(`Still attached (could not embed): ${asset.name}`, LEFT, RIGHT - LEFT, "left");
        }
      }
    }

    return doc.output("blob");
  },
};

function blobToPdf(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
