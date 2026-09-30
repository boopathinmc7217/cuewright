import type {
  Character,
  LineType,
  Project,
  ResolvedLook,
  Scene,
  SceneCast,
  ScriptLine,
} from "@/lib/types";

const LINE_ORDER: LineType[] = [
  "action",
  "character",
  "parenthetical",
  "dialogue",
  "transition",
  "shot",
];

export function blankLine(type: LineType = "action"): ScriptLine {
  return { id: crypto.randomUUID(), type, text: "" };
}

export function blankCast(characterId: string): SceneCast {
  return {
    characterId,
    override: false,
    hairStyle: "",
    hairColor: "",
    dressColors: [],
    wardrobeNotes: "",
  };
}

export function blankCharacter(name: string): Character {
  return {
    id: crypto.randomUUID(),
    name,
    role: "Supporting",
    age: "",
    pronouns: "",
    hairStyle: "",
    hairColor: "",
    dressColors: [],
    wardrobeNotes: "",
  };
}

export function blankScene(): Scene {
  return {
    id: crypto.randomUUID(),
    synopsis: "",
    continuity: "",
    intExt: "INT.",
    place: "",
    time: "DAY",
    lines: [blankLine("action")],
    cast: [],
    location: { name: "", address: "", mapsUrl: "", notes: "", photoIds: [] },
    mediaIds: [],
    links: [],
  };
}

export function blankProject(title: string, author: string): Project {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title: title.trim() || "Untitled screenplay",
    author: author.trim(),
    contact: "",
    logline: "",
    draft: "First draft",
    createdAt: now,
    updatedAt: now,
    characters: [],
    scenes: [blankScene()],
  };
}

export function slugline(scene: Scene) {
  const place = scene.place.trim() || "UNTITLED";
  const time = scene.time.trim() || "DAY";
  return `${scene.intExt} ${place} - ${time}`.toUpperCase();
}

export function nextLineType(type: LineType): LineType {
  if (type === "character" || type === "parenthetical") return "dialogue";
  return "action";
}

export function cycleLineType(type: LineType, reverse = false): LineType {
  const index = LINE_ORDER.indexOf(type);
  const step = reverse ? -1 : 1;
  return LINE_ORDER[(index + step + LINE_ORDER.length) % LINE_ORDER.length];
}

export function formatParenthetical(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return "";
  const inner = trimmed.replace(/^\(+/, "").replace(/\)+$/, "").trim();
  return inner ? `(${inner})` : "";
}

export function displayLine(line: ScriptLine) {
  const text = line.text.trim();
  if (!text) return "";
  if (line.type === "character" || line.type === "transition" || line.type === "shot") {
    return text.toUpperCase();
  }
  if (line.type === "parenthetical") return formatParenthetical(text);
  return text;
}

export function resolveLook(character: Character, cast?: SceneCast): ResolvedLook {
  const custom = Boolean(cast?.override);
  return {
    hairStyle: custom && cast?.hairStyle.trim() ? cast.hairStyle.trim() : character.hairStyle.trim(),
    hairColor: custom && cast?.hairColor.trim() ? cast.hairColor.trim() : character.hairColor.trim(),
    dressColors:
      custom && cast && cast.dressColors.length > 0 ? cast.dressColors : character.dressColors,
    wardrobeNotes:
      custom && cast?.wardrobeNotes.trim()
        ? cast.wardrobeNotes.trim()
        : character.wardrobeNotes.trim(),
    custom,
  };
}

const WRAP: Record<LineType, number> = {
  action: 58,
  shot: 58,
  dialogue: 35,
  parenthetical: 26,
  character: 30,
  transition: 30,
};

function wrappedRows(type: LineType, text: string) {
  const width = WRAP[type];
  const chunks = text.split("\n");
  return chunks.reduce((sum, chunk) => sum + Math.max(1, Math.ceil(chunk.length / width)), 0);
}

export function estimatePages(project: Project) {
  let rows = 0;
  for (const scene of project.scenes) {
    rows += 2;
    for (const line of scene.lines) {
      const text = displayLine(line);
      if (!text) continue;
      rows += wrappedRows(line.type, text) + 1;
    }
  }
  return Math.max(1, Math.ceil(rows / 54));
}

export function renderScreenplayText(project: Project) {
  const lines: string[] = [];
  lines.push(`Title: ${project.title.trim() || "Untitled"}`);
  lines.push("Credit: Written by");
  if (project.author.trim()) lines.push(`Author: ${project.author.trim()}`);
  if (project.draft.trim()) lines.push(`Draft date: ${project.draft.trim()}`);
  if (project.contact.trim()) lines.push(`Contact: ${project.contact.trim()}`);
  if (project.logline.trim()) lines.push(`Notes: ${project.logline.trim()}`);
  lines.push("");

  project.scenes.forEach((scene, index) => {
    if (index > 0) lines.push("");
    lines.push(slugline(scene));
    lines.push("");
    let pendingCue = false;
    for (const line of scene.lines) {
      const text = displayLine(line);
      if (!text) continue;
      if (line.type === "character") {
        if (!pendingCue) lines.push("");
        lines.push(text);
        pendingCue = true;
        continue;
      }
      if (line.type === "parenthetical" && pendingCue) {
        lines.push(text);
        continue;
      }
      if (line.type === "dialogue" && pendingCue) {
        lines.push(text);
        lines.push("");
        pendingCue = false;
        continue;
      }
      if (pendingCue) {
        lines.push("");
        pendingCue = false;
      }
      lines.push(text);
      lines.push("");
    }
  });

  lines.push("");
  lines.push("/*");
  lines.push("CUEWRIGHT SCENE KIT");
  lines.push("Hair, wardrobe, location, and reference media for each scene.");
  lines.push("This note block is for departments. Fountain importers ignore it.");
  lines.push("");

  if (project.characters.length === 0) {
    lines.push("Cast bible: none yet.");
  } else {
    lines.push("CAST BIBLE");
    for (const character of project.characters) {
      lines.push(characterBlock(character.name, character.role, character.age, resolveLook(character)));
    }
  }

  lines.push("");
  project.scenes.forEach((scene, index) => {
    lines.push(`SCENE ${index + 1}`);
    lines.push(slugline(scene));
    if (scene.synopsis.trim()) lines.push(`Synopsis: ${scene.synopsis.trim()}`);
    if (scene.continuity.trim()) lines.push(`Continuity: ${scene.continuity.trim()}`);
    const location = scene.location;
    if (location.name.trim()) lines.push(`Shooting location: ${location.name.trim()}`);
    if (location.address.trim()) lines.push(`Address: ${location.address.trim()}`);
    if (location.mapsUrl.trim()) lines.push(`Map: ${location.mapsUrl.trim()}`);
    if (location.notes.trim()) lines.push(`Location notes: ${location.notes.trim()}`);
    if (location.photoIds.length) {
      lines.push(`Location stills: ${location.photoIds.length} attached in the studio`);
    }
    if (scene.mediaIds.length) {
      lines.push(`Scene media: ${scene.mediaIds.length} file(s) attached in the studio`);
    }
    for (const link of scene.links) {
      lines.push(`Link (${link.kind}): ${link.label || link.url} — ${link.url}`);
    }
    if (scene.cast.length === 0) {
      lines.push("Characters in scene: none assigned.");
    }
    for (const cast of scene.cast) {
      const character = project.characters.find((item) => item.id === cast.characterId);
      if (!character) continue;
      const look = resolveLook(character, cast);
      lines.push(
        characterBlock(
          character.name,
          character.role,
          character.age,
          look,
          look.custom ? "scene look" : "bible look",
        ),
      );
    }
    lines.push("");
  });
  lines.push("*/");
  lines.push("");
  return lines.join("\n").replace(/\n{4,}/g, "\n\n\n");
}

function characterBlock(
  name: string,
  role: string,
  age: string,
  look: ResolvedLook,
  tag?: string,
) {
  const bits = [
    name.toUpperCase(),
    [role, age].filter(Boolean).join(", "),
    tag,
  ].filter(Boolean);
  const hair = [look.hairStyle, look.hairColor].filter(Boolean).join(", ") || "not set";
  const colors = look.dressColors.length ? look.dressColors.join(", ") : "not set";
  const wardrobe = look.wardrobeNotes || "not set";
  return [
    bits.join(" — "),
    `  Hair: ${hair}`,
    `  Dress colors: ${colors}`,
    `  Wardrobe: ${wardrobe}`,
  ].join("\n");
}
