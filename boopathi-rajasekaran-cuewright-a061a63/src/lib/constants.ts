import type { IntExt, LineType } from "@/lib/types";

export const LINE_TYPES: LineType[] = [
  "action",
  "character",
  "parenthetical",
  "dialogue",
  "transition",
  "shot",
];

export const LINE_LABEL: Record<LineType, string> = {
  action: "Action",
  character: "Character",
  parenthetical: "Parenthetical",
  dialogue: "Dialogue",
  transition: "Transition",
  shot: "Shot",
};

export const LINE_PLACEHOLDER: Record<LineType, string> = {
  action: "What do we see and hear?",
  character: "CHARACTER NAME",
  parenthetical: "quietly",
  dialogue: "What they say",
  transition: "CUT TO:",
  shot: "CLOSE ON THE DOOR",
};

export const INT_EXT: IntExt[] = ["INT.", "EXT.", "INT./EXT.", "I/E."];

export const TIMES_OF_DAY = [
  "DAY",
  "NIGHT",
  "DAWN",
  "DUSK",
  "MORNING",
  "EVENING",
  "CONTINUOUS",
  "LATER",
  "MOMENTS LATER",
  "MAGIC HOUR",
];

export const ROLES = ["Lead", "Supporting", "Featured", "Extra", "Voice"];

export const HAIR_STYLES = [
  "Buzz cut",
  "Pixie",
  "Bob",
  "Lob",
  "Loose waves",
  "Tight curls",
  "Braids",
  "Cornrows",
  "Locs",
  "Bun",
  "Top knot",
  "Ponytail",
  "Slicked back",
  "Undercut",
  "Curtain bangs",
  "Afro",
  "Mullet",
  "Shoulder-length",
  "Shaved side",
  "Wet look",
];

export const DRESS_COLORS = [
  { hex: "#1a1a1a", name: "Black" },
  { hex: "#f4efe4", name: "Ivory" },
  { hex: "#8b1e3f", name: "Burgundy" },
  { hex: "#c45c26", name: "Rust" },
  { hex: "#1f4d3a", name: "Forest" },
  { hex: "#243e6b", name: "Navy" },
  { hex: "#c9962e", name: "Gold" },
  { hex: "#7a5436", name: "Brown" },
  { hex: "#d7d2c8", name: "Stone" },
  { hex: "#8e9aa6", name: "Slate" },
  { hex: "#6b2d5b", name: "Plum" },
  { hex: "#e7c3b4", name: "Blush" },
  { hex: "#3e4f2f", name: "Olive" },
  { hex: "#d4572a", name: "Marigold" },
  { hex: "#f2f2f2", name: "White" },
  { hex: "#5c6b73", name: "Charcoal" },
];

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
