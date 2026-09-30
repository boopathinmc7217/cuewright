import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import { createSample, SAMPLE_ID } from "@/lib/sample";
import type { MediaAsset, Project } from "@/lib/types";

type Meta = { seeded: boolean };

interface CueDB extends DBSchema {
  projects: { key: string; value: Project };
  media: { key: string; value: MediaAsset; indexes: { "by-project": string } };
  meta: { key: string; value: Meta };
}

let databasePromise: Promise<IDBPDatabase<CueDB>> | null = null;

function database() {
  if (!databasePromise) {
    databasePromise = openDB<CueDB>("cuewright", 1, {
      upgrade(db) {
        db.createObjectStore("projects", { keyPath: "id" });
        const media = db.createObjectStore("media", { keyPath: "id" });
        media.createIndex("by-project", "projectId");
        db.createObjectStore("meta");
      },
    });
  }
  return databasePromise;
}

export async function ensureSeed() {
  const db = await database();
  const flag = await db.get("meta", "seed");
  if (flag?.seeded) return;
  const existing = await db.get("projects", SAMPLE_ID);
  if (!existing) await db.put("projects", createSample());
  await db.put("meta", { seeded: true }, "seed");
}

export async function listProjects() {
  const db = await database();
  const projects = await db.getAll("projects");
  return projects.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getProject(id: string) {
  const db = await database();
  return (await db.get("projects", id)) ?? null;
}

export async function saveProject(project: Project) {
  const db = await database();
  await db.put("projects", { ...project, updatedAt: Date.now() });
}

export async function deleteProject(id: string) {
  const db = await database();
  const tx = db.transaction(["projects", "media"], "readwrite");
  await tx.objectStore("projects").delete(id);
  const index = tx.objectStore("media").index("by-project");
  let cursor = await index.openCursor(id);
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.done;
}

export async function listMedia(projectId: string) {
  const db = await database();
  return db.getAllFromIndex("media", "by-project", projectId);
}

export async function saveMedia(asset: MediaAsset) {
  const db = await database();
  await db.put("media", asset);
}

export async function deleteMedia(id: string) {
  const db = await database();
  await db.delete("media", id);
}

export async function restoreSample() {
  const db = await database();
  const existing = await db.get("projects", SAMPLE_ID);
  if (existing) return existing;
  const sample = createSample();
  await db.put("projects", sample);
  return sample;
}
