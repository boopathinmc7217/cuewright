"use client";

import { useState } from "react";
import { ColorDots } from "@/components/color-dots";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { HAIR_STYLES, ROLES } from "@/lib/constants";
import { blankCharacter } from "@/lib/screenplay";
import type { Character } from "@/lib/types";

export function CharacterBible({
  open,
  onOpenChange,
  characters,
  urls,
  onChange,
  onPortrait,
  onClearPortrait,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  characters: Character[];
  urls: Record<string, string>;
  onChange: (characters: Character[]) => void;
  onPortrait: (characterId: string, file: File) => void;
  onClearPortrait: (characterId: string) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(characters[0]?.id ?? null);
  const selected = characters.find((character) => character.id === selectedId) ?? characters[0] ?? null;

  function patch(id: string, update: Partial<Character>) {
    onChange(characters.map((character) => (character.id === id ? { ...character, ...update } : character)));
  }

  function add() {
    const character = blankCharacter("New character");
    onChange([...characters, character]);
    setSelectedId(character.id);
  }

  function remove(id: string) {
    const next = characters.filter((character) => character.id !== id);
    onChange(next);
    setSelectedId(next[0]?.id ?? null);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Cast bible</DialogTitle>
          <DialogDescription>
            The default hair, dress colors, and wardrobe for everyone in the script. A scene can override them.
          </DialogDescription>
        </DialogHeader>
        <div className="grid max-h-[68vh] gap-4 overflow-y-auto md:grid-cols-[200px_minmax(0,1fr)]">
          <div className="space-y-2">
            <Button type="button" variant="secondary" className="w-full" onClick={add}>
              New character
            </Button>
            {characters.length === 0 ? (
              <p className="text-sm text-muted-foreground">No one is in the bible yet.</p>
            ) : null}
            {characters.map((character) => (
              <button
                key={character.id}
                type="button"
                onClick={() => setSelectedId(character.id)}
                className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm ${
                  selected?.id === character.id ? "bg-primary/15 text-foreground" : "hover:bg-muted"
                }`}
              >
                <Portrait url={character.portraitId ? urls[character.portraitId] : undefined} name={character.name} />
                <span className="truncate">{character.name}</span>
              </button>
            ))}
          </div>
          {selected ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Portrait
                  url={selected.portraitId ? urls[selected.portraitId] : undefined}
                  name={selected.name}
                  large
                />
                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex h-8 cursor-pointer items-center rounded-lg border border-border px-3 text-sm">
                    Portrait
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        event.target.value = "";
                        if (file) onPortrait(selected.id, file);
                      }}
                    />
                  </label>
                  {selected.portraitId ? (
                    <Button type="button" variant="ghost" onClick={() => onClearPortrait(selected.id)}>
                      Remove portrait
                    </Button>
                  ) : null}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1 text-xs text-muted-foreground">
                  Name
                  <Input value={selected.name} onChange={(event) => patch(selected.id, { name: event.target.value })} />
                </label>
                <label className="grid gap-1 text-xs text-muted-foreground">
                  Role
                  <select
                    className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm text-foreground"
                    value={selected.role}
                    onChange={(event) => patch(selected.id, { role: event.target.value })}
                  >
                    {ROLES.map((role) => (
                      <option key={role}>{role}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-xs text-muted-foreground">
                  Age
                  <Input value={selected.age} onChange={(event) => patch(selected.id, { age: event.target.value })} placeholder="34 or late 30s" />
                </label>
                <label className="grid gap-1 text-xs text-muted-foreground">
                  Pronouns
                  <Input value={selected.pronouns} onChange={(event) => patch(selected.id, { pronouns: event.target.value })} />
                </label>
              </div>
              <label className="grid gap-1 text-xs text-muted-foreground">
                Hairstyle
                <Input
                  list="bible-hairstyles"
                  value={selected.hairStyle}
                  onChange={(event) => patch(selected.id, { hairStyle: event.target.value })}
                  placeholder="Low bun, escaped strands"
                />
                <datalist id="bible-hairstyles">
                  {HAIR_STYLES.map((style) => (
                    <option key={style} value={style} />
                  ))}
                </datalist>
              </label>
              <label className="grid gap-1 text-xs text-muted-foreground">
                Hair color
                <Input
                  value={selected.hairColor}
                  onChange={(event) => patch(selected.id, { hairColor: event.target.value })}
                  placeholder="Black, silver streak at the temple"
                />
              </label>
              <div className="grid gap-1 text-xs text-muted-foreground">
                Dress colors
                <ColorDots
                  colors={selected.dressColors}
                  onChange={(dressColors) => patch(selected.id, { dressColors })}
                />
              </div>
              <label className="grid gap-1 text-xs text-muted-foreground">
                Wardrobe
                <Textarea
                  value={selected.wardrobeNotes}
                  rows={4}
                  onChange={(event) => patch(selected.id, { wardrobeNotes: event.target.value })}
                  placeholder="Cut, fabric, jewelry, what must stay consistent."
                />
              </label>
              <Button type="button" variant="destructive" onClick={() => remove(selected.id)}>
                Delete {selected.name || "character"}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Add a character to start the bible.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Portrait({ url, name, large = false }: { url?: string; name: string; large?: boolean }) {
  const size = large ? "size-16 text-2xl" : "size-8 text-sm";
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt="" className={`${size} rounded-full object-cover`} />
    );
  }
  return (
    <span className={`inline-flex ${size} items-center justify-center rounded-full bg-primary/20 font-display text-primary`}>
      {(name || "?").slice(0, 1).toUpperCase()}
    </span>
  );
}
