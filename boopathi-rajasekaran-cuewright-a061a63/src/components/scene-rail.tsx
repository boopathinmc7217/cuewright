"use client";

import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { slugline } from "@/lib/screenplay";
import type { Scene } from "@/lib/types";

export function SceneRail({
  scenes,
  activeId,
  onSelect,
  onAdd,
  onMove,
  onDelete,
}: {
  scenes: Scene[];
  activeId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between px-3 py-3">
        <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">Scenes</p>
        <Button type="button" size="sm" variant="secondary" onClick={onAdd}>
          <Plus />
          Scene
        </Button>
      </div>
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 pb-4">
        {scenes.map((scene, index) => {
          const active = scene.id === activeId;
          return (
            <div
              key={scene.id}
              className={`rounded-lg border px-2 py-2 ${active ? "border-primary/50 bg-primary/10" : "border-transparent hover:bg-muted/60"}`}
            >
              <button type="button" className="w-full text-left" onClick={() => onSelect(scene.id)}>
                <span className="text-[10px] tracking-[0.14em] text-primary uppercase">
                  {index + 1}
                </span>
                <span className="mt-1 block font-mono text-[11px] leading-snug text-foreground">
                  {scene.place.trim() ? slugline(scene) : "Untitled scene"}
                </span>
                {scene.synopsis.trim() ? (
                  <span className="mt-1 line-clamp-2 block text-xs text-muted-foreground">
                    {scene.synopsis}
                  </span>
                ) : null}
              </button>
              <div className="mt-1 flex gap-1">
                <Button
                  type="button"
                  size="icon-xs"
                  variant="ghost"
                  aria-label="Move scene up"
                  disabled={index === 0}
                  onClick={() => onMove(scene.id, -1)}
                >
                  <ChevronUp />
                </Button>
                <Button
                  type="button"
                  size="icon-xs"
                  variant="ghost"
                  aria-label="Move scene down"
                  disabled={index === scenes.length - 1}
                  onClick={() => onMove(scene.id, 1)}
                >
                  <ChevronDown />
                </Button>
                <Button
                  type="button"
                  size="icon-xs"
                  variant="ghost"
                  aria-label="Delete scene"
                  onClick={() => onDelete(scene.id)}
                >
                  <Trash2 />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
