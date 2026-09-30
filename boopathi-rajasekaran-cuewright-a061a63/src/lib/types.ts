export type LineType =
  | "action"
  | "character"
  | "parenthetical"
  | "dialogue"
  | "transition"
  | "shot";

export type IntExt = "INT." | "EXT." | "INT./EXT." | "I/E.";

export type ScriptLine = {
  id: string;
  type: LineType;
  text: string;
};

export type ReferenceKind = "video" | "image" | "article" | "other";

export type ReferenceLink = {
  id: string;
  url: string;
  label: string;
  kind: ReferenceKind;
};

export type LocationRef = {
  name: string;
  address: string;
  mapsUrl: string;
  notes: string;
  photoIds: string[];
};

export type Character = {
  id: string;
  name: string;
  role: string;
  age: string;
  pronouns: string;
  hairStyle: string;
  hairColor: string;
  dressColors: string[];
  wardrobeNotes: string;
  portraitId?: string;
};

export type SceneCast = {
  characterId: string;
  override: boolean;
  hairStyle: string;
  hairColor: string;
  dressColors: string[];
  wardrobeNotes: string;
};

export type Scene = {
  id: string;
  synopsis: string;
  continuity: string;
  intExt: IntExt;
  place: string;
  time: string;
  lines: ScriptLine[];
  cast: SceneCast[];
  location: LocationRef;
  mediaIds: string[];
  links: ReferenceLink[];
};

export type Project = {
  id: string;
  title: string;
  author: string;
  contact: string;
  logline: string;
  draft: string;
  createdAt: number;
  updatedAt: number;
  characters: Character[];
  scenes: Scene[];
};

export type MediaAsset = {
  id: string;
  projectId: string;
  name: string;
  mime: string;
  blob: Blob;
  createdAt: number;
};

export type ResolvedLook = {
  hairStyle: string;
  hairColor: string;
  dressColors: string[];
  wardrobeNotes: string;
  custom: boolean;
};
