import type { MediaAsset, Project } from "@/lib/types";

export type ExportContext = {
  project: Project;
  media: MediaAsset[];
};

export type ExportPlugin = {
  id: string;
  label: string;
  hint: string;
  extension: string;
  run: (context: ExportContext) => Promise<Blob>;
};
