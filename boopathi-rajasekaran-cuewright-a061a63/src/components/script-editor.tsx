"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { INT_EXT, LINE_LABEL, LINE_PLACEHOLDER, LINE_TYPES, TIMES_OF_DAY } from "@/lib/constants";
import { cycleLineType, nextLineType, resolveLook } from "@/lib/screenplay";
import type { Character, LineType, Scene, ScriptLine } from "@/lib/types";

export function ScriptEditor({
  title,
  scenes,
  characters,
  activeSceneId,
  scrollNonce,
  onActivate,
  onChange,
}: {
  title: string;
  scenes: Scene[];
  characters: Character[];
  activeSceneId: string;
  scrollNonce: number;
  onActivate: (sceneId: string) => void;
  onChange: (scene: Scene) => void;
}) {
  const timeListId = useId();
  const focusRef = useRef<string | null>(null);
  const seenScroll = useRef(0);
  const [activeId, setActiveId] = useState<string | null>(null);

  const located = scenes.flatMap((scene) => scene.lines.map((line) => ({ scene, line })));
  const active = located.find((item) => item.line.id === activeId) ?? null;
  const activeScene = scenes.find((scene) => scene.id === activeSceneId) ?? scenes[0];

  useEffect(() => {
    const id = focusRef.current;
    if (!id) return;
    focusRef.current = null;
    const field = document.getElementById(`line-${id}`) as HTMLTextAreaElement | null;
    field?.focus();
    const length = field?.value.length ?? 0;
    field?.setSelectionRange(length, length);
  }, [scenes]);

  useEffect(() => {
    if (!scrollNonce || scrollNonce === seenScroll.current || !activeSceneId) return;
    seenScroll.current = scrollNonce;
    document.getElementById(`scene-block-${activeSceneId}`)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [scrollNonce, activeSceneId]);

  function focusLine(id: string) {
    setActiveId(id);
    focusRef.current = id;
  }

  function updateLine(scene: Scene, id: string, patch: Partial<ScriptLine>) {
    onChange({
      ...scene,
      lines: scene.lines.map((line) => (line.id === id ? { ...line, ...patch } : line)),
    });
  }

  function insertAfter(scene: Scene, index: number, type: LineType) {
    const line: ScriptLine = { id: crypto.randomUUID(), type, text: "" };
    const lines = [...scene.lines];
    lines.splice(index + 1, 0, line);
    onChange({ ...scene, lines });
    onActivate(scene.id);
    setActiveId(line.id);
    focusRef.current = line.id;
  }

  function removeLine(scene: Scene, index: number) {
    if (scene.lines.length === 1) {
      updateLine(scene, scene.lines[0].id, { text: "", type: "action" });
      focusLine(scene.lines[0].id);
      return;
    }
    const lines = scene.lines.filter((_, lineIndex) => lineIndex !== index);
    onChange({ ...scene, lines });
    focusLine(lines[Math.max(0, index - 1)].id);
  }

  function setActiveType(type: LineType) {
    if (!active) {
      const scene = activeScene;
      if (!scene) return;
      insertAfter(scene, scene.lines.length - 1, type);
      return;
    }
    updateLine(active.scene, active.line.id, { type });
  }

  return (
    <div className="mx-auto flex w-full max-w-[8.5in] flex-col gap-3">
      <div className="flex flex-wrap items-center gap-1">
        {LINE_TYPES.map((type) => (
          <Button
            key={type}
            type="button"
            size="sm"
            variant={active?.line.type === type ? "default" : "secondary"}
            onClick={() => setActiveType(type)}
          >
            {LINE_LABEL[type]}
          </Button>
        ))}
        <span className="ml-1 text-xs text-muted-foreground">
          Tab changes the element. Enter continues, as on a screenplay page.
        </span>
      </div>
      {active?.line.type === "character" && characters.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {characters.map((character) => (
            <Button
              key={character.id}
              type="button"
              size="sm"
              variant="outline"
              onClick={() => updateLine(active.scene, active.line.id, { text: character.name })}
            >
              {character.name}
            </Button>
          ))}
        </div>
      ) : null}

      <article className="script-sheet">
        <div className="script-running-head">
          <span>{title.trim() || "Untitled"}</span>
          <span>{scenes.length === 1 ? "1 scene" : `${scenes.length} scenes`}</span>
        </div>
        {scenes.map((scene) => (
          <section
            key={scene.id}
            id={`scene-block-${scene.id}`}
            className={scene.id === activeSceneId ? "script-scene is-active" : "script-scene"}
            onFocusCapture={() => onActivate(scene.id)}
          >
            <div className="slugline">
              <select
                aria-label="Interior or exterior"
                className="slug-input slug-int"
                value={scene.intExt}
                onChange={(event) => onChange({ ...scene, intExt: event.target.value as Scene["intExt"] })}
              >
                {INT_EXT.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
              <input
                aria-label="Scene location"
                value={scene.place}
                placeholder="LOCATION"
                onChange={(event) => onChange({ ...scene, place: event.target.value })}
                className="slug-input slug-place"
              />
              <span aria-hidden="true">-</span>
              <input
                aria-label="Time of day"
                list={timeListId}
                value={scene.time}
                onChange={(event) => onChange({ ...scene, time: event.target.value })}
                className="slug-input slug-time"
              />
            </div>
            {scene.lines.map((line, index) => (
              <div key={line.id} className={`script-block block-${line.type}`}>
                {line.type === "parenthetical" ? <span className="paren">(</span> : null}
                <textarea
                  id={`line-${line.id}`}
                  ref={(node) => {
                    if (!node) return;
                    node.style.height = "0px";
                    node.style.height = `${node.scrollHeight}px`;
                  }}
                  rows={1}
                  value={line.text}
                  style={
                    line.type === "parenthetical"
                      ? { width: `${Math.max(line.text.length, LINE_PLACEHOLDER.parenthetical.length) + 1}ch` }
                      : undefined
                  }
                  placeholder={LINE_PLACEHOLDER[line.type]}
                  spellCheck={line.type === "action" || line.type === "dialogue"}
                  onFocus={() => {
                    setActiveId(line.id);
                    onActivate(scene.id);
                  }}
                  onBlur={() => {
                    if (line.type === "character" || line.type === "transition" || line.type === "shot") {
                      updateLine(scene, line.id, { text: line.text.toUpperCase() });
                    }
                    if (line.type === "parenthetical") {
                      const inner = line.text.replace(/^\(+/, "").replace(/\)+$/, "").trim();
                      if (inner !== line.text) updateLine(scene, line.id, { text: inner });
                    }
                  }}
                  onChange={(event) => {
                    updateLine(scene, line.id, { text: event.target.value });
                    const node = event.target;
                    node.style.height = "0px";
                    node.style.height = `${node.scrollHeight}px`;
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Tab") {
                      event.preventDefault();
                      updateLine(scene, line.id, { type: cycleLineType(line.type, event.shiftKey) });
                    }
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      insertAfter(scene, index, nextLineType(line.type));
                    }
                    if (event.key === "Backspace" && line.text === "") {
                      event.preventDefault();
                      removeLine(scene, index);
                    }
                  }}
                  className={`script-line line-${line.type}`}
                />
                {line.type === "parenthetical" ? <span className="paren">)</span> : null}
              </div>
            ))}
            <SceneNote scene={scene} characters={characters} />
          </section>
        ))}
      </article>
      <datalist id={timeListId}>
        {TIMES_OF_DAY.map((time) => (
          <option key={time} value={time} />
        ))}
      </datalist>
    </div>
  );
}

function SceneNote({ scene, characters }: { scene: Scene; characters: Character[] }) {
  const rows = scene.cast.flatMap((cast) => {
    const character = characters.find((item) => item.id === cast.characterId);
    if (!character) return [];
    const look = resolveLook(character, cast);
    return [{ character, look }];
  });

  return (
    <section className="scene-note">
      <p className="scene-note-label">On this scene</p>
      {rows.length === 0 ? (
        <p>Add the people in this scene from the scene kit so hair, dress color, and wardrobe stay on the page.</p>
      ) : (
        <ul className="scene-note-list">
          {rows.map(({ character, look }) => (
            <li key={character.id}>
              <span className="scene-note-name">{character.name}</span>
              {look.custom ? <span className="scene-note-tag">This scene</span> : null}
              <span className="scene-note-hair">
                {[look.hairStyle, look.hairColor].filter(Boolean).join(", ") || "Hair not set"}
              </span>
              <span className="scene-note-colors">
                {look.dressColors.length === 0
                  ? "No dress colors"
                  : look.dressColors.map((hex) => (
                      <span key={hex} title={hex} className="scene-swatch" style={{ backgroundColor: hex }} />
                    ))}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
