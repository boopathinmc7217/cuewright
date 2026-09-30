"use client";

import { useId, useState } from "react";
import { ColorDots } from "@/components/color-dots";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { HAIR_STYLES, MAX_UPLOAD_BYTES } from "@/lib/constants";
import { safeUrl } from "@/lib/download";
import { blankCast } from "@/lib/screenplay";
import type { Character, MediaAsset, ReferenceKind, Scene, SceneCast } from "@/lib/types";

export function Inspector({
  scene,
  characters,
  media,
  urls,
  onChange,
  onCreateCharacter,
  onUpload,
  onRemoveMedia,
  notice,
}: {
  scene: Scene;
  characters: Character[];
  media: MediaAsset[];
  urls: Record<string, string>;
  onChange: (scene: Scene) => void;
  onCreateCharacter: (name: string) => Character;
  onUpload: (files: File[], target: "scene" | "location") => void;
  onRemoveMedia: (id: string) => void;
  notice: string;
}) {
  const [name, setName] = useState("");
  const available = characters.filter(
    (character) => !scene.cast.some((cast) => cast.characterId === character.id),
  );

  function addExisting(id: string) {
    if (!id) return;
    onChange({ ...scene, cast: [...scene.cast, blankCast(id)] });
  }

  function addNamed() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const existing = characters.find((character) => character.name.toLowerCase() === trimmed.toLowerCase());
    const character = existing ?? onCreateCharacter(trimmed);
    if (!scene.cast.some((cast) => cast.characterId === character.id)) {
      onChange({ ...scene, cast: [...scene.cast, blankCast(character.id)] });
    }
    setName("");
  }

  function updateCast(characterId: string, patch: Partial<SceneCast>) {
    onChange({
      ...scene,
      cast: scene.cast.map((cast) => (cast.characterId === characterId ? { ...cast, ...patch } : cast)),
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="space-y-3 px-3 py-3">
        <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">Scene kit</p>
        <label className="grid gap-1 text-xs text-muted-foreground">
          Synopsis
          <Textarea
            value={scene.synopsis}
            onChange={(event) => onChange({ ...scene, synopsis: event.target.value })}
            placeholder="What changes in this scene?"
            rows={2}
          />
        </label>
        <label className="grid gap-1 text-xs text-muted-foreground">
          Continuity
          <Textarea
            value={scene.continuity}
            onChange={(event) => onChange({ ...scene, continuity: event.target.value })}
            placeholder="Wet coat, hair pinned, prop still in hand."
            rows={2}
          />
        </label>
        {notice ? <p className="text-xs text-destructive">{notice}</p> : null}
      </div>
      <Tabs defaultValue="look" className="min-h-0 flex-1 gap-0">
        <TabsList className="mx-3 w-[calc(100%-1.5rem)]">
          <TabsTrigger value="look">Look</TabsTrigger>
          <TabsTrigger value="place">Place</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
        </TabsList>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          <TabsContent value="look" className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Add a character"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addNamed();
                  }
                }}
              />
              <Button type="button" variant="secondary" onClick={addNamed}>
                Add
              </Button>
            </div>
            {available.length > 0 ? (
              <label className="grid gap-1 text-xs text-muted-foreground">
                Already in the cast bible
                <select
                  className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm text-foreground"
                  value=""
                  onChange={(event) => addExisting(event.target.value)}
                >
                  <option value="">Choose…</option>
                  {available.map((character) => (
                    <option key={character.id} value={character.id}>
                      {character.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            {scene.cast.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
                Nobody is assigned to this scene yet. Add each person who appears so their hair and clothes can change from scene to scene.
              </p>
            ) : null}
            {scene.cast.map((cast) => {
              const character = characters.find((item) => item.id === cast.characterId);
              if (!character) return null;
              return (
                <LookCard
                  key={cast.characterId}
                  character={character}
                  cast={cast}
                  portraitUrl={character.portraitId ? urls[character.portraitId] : undefined}
                  onChange={(patch) => updateCast(character.id, patch)}
                  onRemove={() =>
                    onChange({ ...scene, cast: scene.cast.filter((item) => item.characterId !== character.id) })
                  }
                />
              );
            })}
          </TabsContent>
          <TabsContent value="place" className="space-y-3">
            <p className="text-sm text-muted-foreground">
              The slug is the story location. This is the real place you would send a crew.
            </p>
            <Field label="Shooting location">
              <Input
                value={scene.location.name}
                onChange={(event) => onChange({ ...scene, location: { ...scene.location, name: event.target.value } })}
                placeholder="Name of the practical location"
              />
            </Field>
            <Field label="Address">
              <Input
                value={scene.location.address}
                onChange={(event) =>
                  onChange({ ...scene, location: { ...scene.location, address: event.target.value } })
                }
                placeholder="Street, city, access notes"
              />
            </Field>
            <Field label="Map link">
              <Input
                value={scene.location.mapsUrl}
                onChange={(event) =>
                  onChange({ ...scene, location: { ...scene.location, mapsUrl: event.target.value } })
                }
                placeholder="https://maps.google.com/..."
              />
            </Field>
            {scene.location.mapsUrl.trim() ? (
              <a
                className="text-sm text-primary underline-offset-4 hover:underline"
                href={safeUrl(scene.location.mapsUrl)}
                target="_blank"
                rel="noreferrer"
              >
                Open map
              </a>
            ) : null}
            <Field label="Scout notes">
              <Textarea
                value={scene.location.notes}
                onChange={(event) =>
                  onChange({ ...scene, location: { ...scene.location, notes: event.target.value } })
                }
                placeholder="Light, sound, power, what the camera should feel."
                rows={4}
              />
            </Field>
            <UploadButton
              label="Add location stills"
              accept="image/*"
              onFiles={(files) => onUpload(files, "location")}
            />
            <MediaGrid
              ids={scene.location.photoIds}
              media={media}
              urls={urls}
              onRemove={(id) => {
                onChange({
                  ...scene,
                  location: { ...scene.location, photoIds: scene.location.photoIds.filter((item) => item !== id) },
                });
                onRemoveMedia(id);
              }}
            />
          </TabsContent>
          <TabsContent value="media" className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Stills print into the PDF and Word scene kit. Video files stay attached here and are named in the export.
            </p>
            <UploadButton
              label="Add image or video"
              accept="image/*,video/*"
              onFiles={(files) => onUpload(files, "scene")}
            />
            <MediaGrid
              ids={scene.mediaIds}
              media={media}
              urls={urls}
              onRemove={(id) => {
                onChange({ ...scene, mediaIds: scene.mediaIds.filter((item) => item !== id) });
                onRemoveMedia(id);
              }}
            />
            <LinkEditor
              links={scene.links}
              onChange={(links) => onChange({ ...scene, links })}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function LookCard({
  character,
  cast,
  portraitUrl,
  onChange,
  onRemove,
}: {
  character: Character;
  cast: SceneCast;
  portraitUrl?: string;
  onChange: (patch: Partial<SceneCast>) => void;
  onRemove: () => void;
}) {
  const hairList = useId();
  const hair = cast.override && cast.hairStyle.trim() ? cast.hairStyle : character.hairStyle;
  const color = cast.override && cast.hairColor.trim() ? cast.hairColor : character.hairColor;
  const colors = cast.override && cast.dressColors.length ? cast.dressColors : character.dressColors;
  const wardrobe = cast.override && cast.wardrobeNotes.trim() ? cast.wardrobeNotes : character.wardrobeNotes;

  function customize(enabled: boolean) {
    if (!enabled) {
      onChange({ override: false, hairStyle: "", hairColor: "", dressColors: [], wardrobeNotes: "" });
      return;
    }
    onChange({
      override: true,
      hairStyle: character.hairStyle,
      hairColor: character.hairColor,
      dressColors: [...character.dressColors],
      wardrobeNotes: character.wardrobeNotes,
    });
  }

  return (
    <article className="rounded-xl border border-border bg-card/60 p-3">
      <div className="flex items-start gap-3">
        {portraitUrl ? (
          // Blob URLs cannot go through the image optimizer.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={portraitUrl} alt="" className="size-12 rounded-full object-cover" />
        ) : (
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/20 font-display text-lg text-primary">
            {character.name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{character.name}</p>
          <p className="text-xs text-muted-foreground">
            {[character.role, character.age].filter(Boolean).join(" · ") || "Cast"}
          </p>
        </div>
        <Button type="button" size="sm" variant="ghost" onClick={onRemove}>
          Remove
        </Button>
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={cast.override}
          onChange={(event) => customize(event.target.checked)}
        />
        Custom look for this scene
      </label>
      {cast.override ? (
        <div className="mt-3 space-y-3">
          <Field label="Hairstyle">
            <Input list={hairList} value={cast.hairStyle} onChange={(event) => onChange({ hairStyle: event.target.value })} />
            <datalist id={hairList}>
              {HAIR_STYLES.map((style) => (
                <option key={style} value={style} />
              ))}
            </datalist>
          </Field>
          <Field label="Hair color">
            <Input value={cast.hairColor} onChange={(event) => onChange({ hairColor: event.target.value })} />
          </Field>
          <Field label="Dress colors">
            <ColorDots colors={cast.dressColors} onChange={(dressColors) => onChange({ dressColors })} />
          </Field>
          <Field label="Wardrobe notes">
            <Textarea
              value={cast.wardrobeNotes}
              rows={3}
              onChange={(event) => onChange({ wardrobeNotes: event.target.value })}
            />
          </Field>
        </div>
      ) : (
        <dl className="mt-3 space-y-1 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Hair</dt>
            <dd>{[hair, color].filter(Boolean).join(", ") || "Not set in the cast bible"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Dress colors</dt>
            <dd className="mt-1 flex flex-wrap gap-1">
              {colors.length === 0 ? (
                "Not set"
              ) : (
                colors.map((hex) => (
                  <span key={hex} className="size-4 rounded-full ring-1 ring-black/30" style={{ backgroundColor: hex }} title={hex} />
                ))
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Wardrobe</dt>
            <dd className="text-muted-foreground">{wardrobe || "Not set in the cast bible"}</dd>
          </div>
        </dl>
      )}
    </article>
  );
}

function LinkEditor({
  links,
  onChange,
}: {
  links: Scene["links"];
  onChange: (links: Scene["links"]) => void;
}) {
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [kind, setKind] = useState<ReferenceKind>("video");

  function add() {
    const trimmed = url.trim();
    if (!trimmed) return;
    onChange([
      ...links,
      { id: crypto.randomUUID(), url: safeUrl(trimmed), label: label.trim(), kind },
    ]);
    setUrl("");
    setLabel("");
  }

  return (
    <div className="space-y-2 border-t border-border pt-3">
      <p className="text-xs tracking-[0.14em] text-muted-foreground uppercase">Reference links</p>
      {links.map((link) => (
        <div key={link.id} className="flex items-start justify-between gap-2 text-sm">
          <a className="min-w-0 break-all text-primary underline-offset-4 hover:underline" href={safeUrl(link.url)} target="_blank" rel="noreferrer">
            {link.label || link.url}
            <span className="mt-0.5 block text-xs text-muted-foreground">{link.kind}</span>
          </a>
          <Button type="button" size="sm" variant="ghost" onClick={() => onChange(links.filter((item) => item.id !== link.id))}>
            Remove
          </Button>
        </div>
      ))}
      <div className="grid gap-2">
        <Input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Label, optional" />
        <Input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://..." />
        <div className="flex gap-2">
          <select
            className="h-8 flex-1 rounded-lg border border-input bg-transparent px-2 text-sm"
            value={kind}
            onChange={(event) => setKind(event.target.value as ReferenceKind)}
          >
            <option value="video">Video</option>
            <option value="image">Image</option>
            <option value="article">Article</option>
            <option value="other">Other</option>
          </select>
          <Button type="button" variant="secondary" onClick={add}>
            Add link
          </Button>
        </div>
      </div>
    </div>
  );
}

function UploadButton({
  label,
  accept,
  onFiles,
}: {
  label: string;
  accept: string;
  onFiles: (files: File[]) => void;
}) {
  return (
    <label className="inline-flex h-8 cursor-pointer items-center justify-center rounded-lg border border-border bg-secondary px-3 text-sm text-secondary-foreground">
      {label}
      <input
        type="file"
        accept={accept}
        multiple
        className="sr-only"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = "";
          if (files.length) onFiles(files);
        }}
      />
    </label>
  );
}

function MediaGrid({
  ids,
  media,
  urls,
  onRemove,
}: {
  ids: string[];
  media: MediaAsset[];
  urls: Record<string, string>;
  onRemove: (id: string) => void;
}) {
  if (ids.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
        Nothing attached yet.
      </p>
    );
  }
  return (
    <div className="grid gap-2">
      {ids.map((id) => {
        const asset = media.find((item) => item.id === id);
        if (!asset) return null;
        const url = urls[id];
        return (
          <figure key={id} className="overflow-hidden rounded-lg border border-border">
            {asset.mime.startsWith("video/") ? (
              <video src={url} controls className="aspect-video w-full bg-black" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt={asset.name} className="aspect-video w-full object-cover" />
            )}
            <figcaption className="flex items-center justify-between gap-2 px-2 py-1.5 text-xs">
              <span className="truncate">{asset.name}</span>
              <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => onRemove(id)}>
                Remove
              </button>
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-xs text-muted-foreground">
      {label}
      {children}
    </label>
  );
}

export function fileTooLarge(file: File) {
  return file.size > MAX_UPLOAD_BYTES;
}
