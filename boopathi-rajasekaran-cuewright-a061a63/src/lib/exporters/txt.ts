import { renderScreenplayText } from "@/lib/screenplay";
import type { ExportPlugin } from "@/lib/exporters/types";

export const txtPlugin: ExportPlugin = {
  id: "txt",
  label: "Plain text",
  hint: ".txt · Fountain",
  extension: "txt",
  async run({ project }) {
    return new Blob([renderScreenplayText(project)], {
      type: "text/plain;charset=utf-8",
    });
  },
};
