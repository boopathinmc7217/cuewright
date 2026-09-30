import { docPlugin, docxPlugin } from "@/lib/exporters/doc";
import { pdfPlugin } from "@/lib/exporters/pdf";
import { txtPlugin } from "@/lib/exporters/txt";
import type { ExportPlugin } from "@/lib/exporters/types";

export const exportPlugins: ExportPlugin[] = [txtPlugin, pdfPlugin, docxPlugin, docPlugin];

export type { ExportContext, ExportPlugin } from "@/lib/exporters/types";
