import { resolveLook, slugline } from "@/lib/screenplay";
import type { MediaAsset, Project, ResolvedLook } from "@/lib/types";

export type KitLook = {
  name: string;
  role: string;
  age: string;
  portraitId?: string;
  look: ResolvedLook;
};

export type KitScene = {
  number: number;
  slug: string;
  synopsis: string;
  continuity: string;
  locationName: string;
  address: string;
  mapsUrl: string;
  locationNotes: string;
  photoIds: string[];
  mediaIds: string[];
  links: { kind: string; label: string; url: string }[];
  looks: KitLook[];
};

export function mediaMap(media: MediaAsset[]) {
  return new Map(media.map((asset) => [asset.id, asset]));
}

export function kitScenes(project: Project): KitScene[] {
  return project.scenes.map((scene, index) => ({
    number: index + 1,
    slug: slugline(scene),
    synopsis: scene.synopsis.trim(),
    continuity: scene.continuity.trim(),
    locationName: scene.location.name.trim(),
    address: scene.location.address.trim(),
    mapsUrl: scene.location.mapsUrl.trim(),
    locationNotes: scene.location.notes.trim(),
    photoIds: scene.location.photoIds,
    mediaIds: scene.mediaIds,
    links: scene.links.map((link) => ({
      kind: link.kind,
      label: link.label.trim() || link.url,
      url: link.url.trim(),
    })),
    looks: scene.cast.flatMap((cast) => {
      const character = project.characters.find((item) => item.id === cast.characterId);
      if (!character) return [];
      return [
        {
          name: character.name,
          role: character.role,
          age: character.age,
          portraitId: character.portraitId,
          look: resolveLook(character, cast),
        },
      ];
    }),
  }));
}

export function lookSummary(look: ResolvedLook) {
  const hair = [look.hairStyle, look.hairColor].filter(Boolean).join(", ") || "Not set";
  const colors = look.dressColors.length ? look.dressColors.join("  ") : "Not set";
  const wardrobe = look.wardrobeNotes || "Not set";
  return { hair, colors, wardrobe };
}

export async function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export function rasterKind(mime: string): "jpg" | "png" | "gif" | "bmp" | null {
  if (mime.includes("png")) return "png";
  if (mime.includes("gif")) return "gif";
  if (mime.includes("bmp")) return "bmp";
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  return null;
}
