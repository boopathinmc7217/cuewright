import { writeFileSync } from "node:fs";
import { exportPlugins } from "../src/lib/exporters";
import { createSample } from "../src/lib/sample";

async function main() {
  const project = createSample();
  for (const plugin of exportPlugins) {
    const blob = await plugin.run({ project, media: [] });
    const bytes = Buffer.from(await blob.arrayBuffer());
    if (bytes.length < 100) throw new Error(`${plugin.id} export is too small`);
    writeFileSync(`/tmp/cue-${plugin.id}.${plugin.extension}`, bytes);
    console.log(plugin.id, bytes.length);
  }
}

main();
