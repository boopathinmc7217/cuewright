"use client";

import { DRESS_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function ColorDots({
  colors,
  onChange,
}: {
  colors: string[];
  onChange: (colors: string[]) => void;
}) {
  function toggle(hex: string) {
    if (colors.includes(hex)) onChange(colors.filter((color) => color !== hex));
    else onChange([...colors, hex].slice(0, 6));
  }

  return (
    <div className="grid gap-2">
      <div className="flex min-h-6 flex-wrap gap-1.5">
        {colors.length === 0 ? (
          <span className="text-xs text-muted-foreground">Pick up to six dress colors.</span>
        ) : (
          colors.map((hex) => (
            <button
              key={hex}
              type="button"
              className="size-6 rounded-full ring-1 ring-black/30"
              style={{ backgroundColor: hex }}
              onClick={() => toggle(hex)}
              aria-label={`Remove color ${hex}`}
              title={hex}
            />
          ))
        )}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {DRESS_COLORS.map((color) => (
          <button
            key={color.hex}
            type="button"
            title={color.name}
            aria-label={color.name}
            aria-pressed={colors.includes(color.hex)}
            className={cn(
              "size-5 rounded-full ring-1 ring-black/25",
              colors.includes(color.hex) && "ring-2 ring-primary ring-offset-2 ring-offset-background",
            )}
            style={{ backgroundColor: color.hex }}
            onClick={() => toggle(color.hex)}
          />
        ))}
        <label className="relative size-5 overflow-hidden rounded-full ring-1 ring-border" title="Custom color">
          <span className="sr-only">Custom dress color</span>
          <input
            type="color"
            className="absolute inset-0 size-8 -translate-x-1 -translate-y-1 cursor-pointer border-0 bg-transparent p-0"
            onChange={(event) => toggle(event.target.value)}
          />
        </label>
      </div>
    </div>
  );
}
