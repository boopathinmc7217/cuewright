"use client";

import { ArrowLeft, Download, List, PanelRight, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CharacterBible } from "@/components/character-bible";
import { fileTooLarge, Inspector } from "@/components/inspector";
import { SceneRail } from "@/components/scene-rail";
import { ScriptEditor } from "@/components/script-editor";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { deleteMedia, ensureSeed, getProject, listMedia, saveMedia, saveProject } from "@/lib/db";
import { downloadBlob } from "@/lib/download";
import { fileBase } from "@/lib/id";
import { exportPlugins } from "@/lib/exporters";
import { blankCharacter, blankScene, estimatePages } from "@/lib/screenplay";
import type { Character, MediaAsset, Project } from "@/lib/types";

export function Workspace({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [loadError, setLoadError] = useState("");
  const [sceneId, setSceneId] = useState("");
  const [scrollNonce, setScrollNonce] = useState(0);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error">("saved");
  const latest = useRef<Project | null>(null);
  const urlsRef = useRef<Record<string, string>>({});
  const saveTimer = useRef<number | null>(null);
  const [panel, setPanel] = useState<"scenes" | "kit" | null>(null);
  const [bibleOpen, setBibleOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [exporting, setExporting] = useState<string | null>(null);

  function edit(recipe: (current: Project) => Project) {
    setProject((current) => {
      if (!current) return current;
      const next = recipe(current);
      latest.current = next;
      return next;
    });
    setSaveState("saving");
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      const snapshot = latest.current;
      if (!snapshot) return;
      saveProject(snapshot)
        .then(() => setSaveState("saved"))
        .catch(() => setSaveState("error"));
    }, 280);
  }

  function remember(asset: MediaAsset) {
    const url = URL.createObjectURL(asset.blob);
    setUrls((current) => {
      const next = { ...current, [asset.id]: url };
      urlsRef.current = next;
      return next;
    });
  }

  function forget(id: string) {
    const existing = urlsRef.current[id];
    if (existing) URL.revokeObjectURL(existing);
    setUrls((current) => {
      if (!current[id]) return current;
      const next = { ...current };
      delete next[id];
      urlsRef.current = next;
      return next;
    });
  }

  useEffect(() => {
    let cancelled = false;
    ensureSeed()
      .then(() => getProject(projectId))
      .then(async (found) => {
        if (cancelled) return;
        if (!found) {
          setStatus("missing");
          return;
        }
        const files = await listMedia(projectId);
        if (cancelled) return;
        const nextUrls: Record<string, string> = {};
        for (const file of files) nextUrls[file.id] = URL.createObjectURL(file.blob);
        latest.current = found;
        urlsRef.current = nextUrls;
        setProject(found);
        setMedia(files);
        setUrls(nextUrls);
        setSceneId(found.scenes[0]?.id ?? "");
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setStatus("error");
        setLoadError(error instanceof Error ? error.message : "Could not open this script.");
      });
    return () => {
      cancelled = true;
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      for (const url of Object.values(urlsRef.current)) URL.revokeObjectURL(url);
    };
  }, [projectId]);

  if (status === "loading") {
    return <p className="p-8 text-sm text-muted-foreground">Opening the script…</p>;
  }
  if (status === "missing") {
    return (
      <div className="mx-auto max-w-lg p-8">
        <h1 className="font-display text-3xl">This script is not on the shelf.</h1>
        <p className="mt-2 text-muted-foreground">It may have been removed from this browser.</p>
        <Button asChild className="mt-6">
          <Link href="/">Back to the shelf</Link>
        </Button>
      </div>
    );
  }
  if (status === "error" || !project) {
    return (
      <div className="mx-auto max-w-lg p-8">
        <h1 className="font-display text-3xl">The script could not be opened.</h1>
        <p className="mt-2 text-muted-foreground">{loadError}</p>
        <Button asChild className="mt-6">
          <Link href="/">Back to the shelf</Link>
        </Button>
      </div>
    );
  }

  const draft = project;
  const scene = draft.scenes.find((item) => item.id === sceneId) ?? draft.scenes[0];

  function updateScene(next: Project["scenes"][number]) {
    edit((current) => ({
      ...current,
      scenes: current.scenes.map((item) => (item.id === next.id ? next : item)),
    }));
  }

  function updateCharacters(characters: Character[]) {
    const ids = new Set(characters.map((character) => character.id));
    edit((current) => ({
      ...current,
      characters,
      scenes: current.scenes.map((item) => ({
        ...item,
        cast: item.cast.filter((cast) => ids.has(cast.characterId)),
      })),
    }));
  }

  async function upload(files: File[], target: "scene" | "location" | "portrait", characterId?: string) {
    const accepted: MediaAsset[] = [];
    for (const file of files) {
      if (fileTooLarge(file)) {
        setNotice(`${file.name} is over 20 MB. Link the file instead of attaching it.`);
        continue;
      }
      const image = file.type.startsWith("image/");
      const video = file.type.startsWith("video/");
      if (!image && !video) {
        setNotice(`${file.name} is not an image or video.`);
        continue;
      }
      if (target !== "scene" && video) {
        setNotice("Video belongs on the media tab. Location stills and portraits are images.");
        continue;
      }
      const asset: MediaAsset = {
        id: crypto.randomUUID(),
        projectId,
        name: file.name,
        mime: file.type,
        blob: file,
        createdAt: Date.now(),
      };
      await saveMedia(asset);
      accepted.push(asset);
    }
    if (accepted.length === 0) return;
    setMedia((current) => [...current, ...accepted]);
    for (const asset of accepted) remember(asset);
    setNotice("");
    if (target === "portrait" && characterId) {
      const asset = accepted[0];
      const previous = draft.characters.find((character) => character.id === characterId)?.portraitId;
      updateCharacters(
        draft.characters.map((character) =>
          character.id === characterId ? { ...character, portraitId: asset.id } : character,
        ),
      );
      if (previous) {
        await deleteMedia(previous);
        forget(previous);
        setMedia((current) => current.filter((item) => item.id !== previous));
      }
      return;
    }
    const ids = accepted.map((asset) => asset.id);
    if (target === "location") {
      updateScene({ ...scene, location: { ...scene.location, photoIds: [...scene.location.photoIds, ...ids] } });
    } else {
      updateScene({ ...scene, mediaIds: [...scene.mediaIds, ...ids] });
    }
  }

  async function removeMedia(id: string) {
    await deleteMedia(id);
    forget(id);
    setMedia((current) => current.filter((item) => item.id !== id));
    edit((current) => ({
      ...current,
      characters: current.characters.map((character) =>
        character.portraitId === id ? { ...character, portraitId: undefined } : character,
      ),
      scenes: current.scenes.map((item) => ({
        ...item,
        mediaIds: item.mediaIds.filter((mediaId) => mediaId !== id),
        location: {
          ...item.location,
          photoIds: item.location.photoIds.filter((photoId) => photoId !== id),
        },
      })),
    }));
  }

  async function runExport(id: string) {
    const plugin = exportPlugins.find((item) => item.id === id);
    if (!plugin) return;
    setExporting(plugin.id);
    setNotice("");
    try {
      await saveProject(draft);
      const blob = await plugin.run({ project: draft, media });
      downloadBlob(blob, `${fileBase(draft.title)}.${plugin.extension}`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Export failed.");
    } finally {
      setExporting(null);
    }
  }

  const rail = (
    <SceneRail
      scenes={project.scenes}
      activeId={scene.id}
      onSelect={(id) => {
        setSceneId(id);
        setScrollNonce((nonce) => nonce + 1);
        setPanel(null);
      }}
      onAdd={() => {
        const next = blankScene();
        edit((current) => ({ ...current, scenes: [...current.scenes, next] }));
        setSceneId(next.id);
        setScrollNonce((nonce) => nonce + 1);
      }}
      onMove={(id, direction) => {
        edit((current) => {
          const index = current.scenes.findIndex((item) => item.id === id);
          const target = index + direction;
          if (target < 0 || target >= current.scenes.length) return current;
          const scenes = [...current.scenes];
          const [item] = scenes.splice(index, 1);
          scenes.splice(target, 0, item);
          return { ...current, scenes };
        });
      }}
      onDelete={(id) => {
        if (draft.scenes.length === 1) {
          if (!window.confirm("Clear this only scene?")) return;
          const next = { ...blankScene(), id };
          edit(() => ({ ...draft, scenes: [next] }));
          return;
        }
        if (!window.confirm("Remove this scene from the script?")) return;
        const scenes = draft.scenes.filter((item) => item.id !== id);
        edit(() => ({ ...draft, scenes }));
        if (scene.id === id) setSceneId(scenes[0]?.id ?? "");
      }}
    />
  );

  const kit = (
    <Inspector
      scene={scene}
      characters={project.characters}
      media={media}
      urls={urls}
      notice={notice}
      onChange={updateScene}
      onCreateCharacter={(name) => {
        const character = blankCharacter(name);
        updateCharacters([...project.characters, character]);
        return character;
      }}
      onUpload={(files, target) => void upload(files, target)}
      onRemoveMedia={(id) => void removeMedia(id)}
    />
  );

  return (
    <div className="flex h-dvh min-h-0 flex-col">
      <header className="flex flex-col gap-2 border-b border-border px-3 py-2 lg:flex-row lg:flex-wrap lg:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/">
              <ArrowLeft />
              Shelf
            </Link>
          </Button>
          <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setDetailsOpen(true)}>
            <span className="block truncate font-display text-xl leading-none">{project.title}</span>
            <span className="block truncate text-xs text-muted-foreground">
              {project.draft || "Draft"} · about {estimatePages(project)} {estimatePages(project) === 1 ? "page" : "pages"} ·{" "}
              {saveState === "saving" ? "Saving…" : saveState === "error" ? "Not saved" : "Saved on this device"}
            </span>
          </button>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
        <Button type="button" size="sm" variant="secondary" className="lg:hidden" onClick={() => setPanel("scenes")}>
          <List />
          Scenes
        </Button>
        <Button type="button" size="sm" variant="secondary" className="lg:hidden" onClick={() => setPanel("kit")}>
          <PanelRight />
          Scene kit
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={() => setBibleOpen(true)}>
          <Users />
          Cast
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" size="sm" disabled={Boolean(exporting)}>
              <Download />
              {exporting ? "Exporting…" : "Export"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {exportPlugins.map((plugin) => (
              <DropdownMenuItem key={plugin.id} onSelect={() => void runExport(plugin.id)}>
                <span className="grid">
                  <span>{plugin.label}</span>
                  <span className="text-xs text-muted-foreground">{plugin.hint}</span>
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
        {notice ? <p className="w-full text-xs text-destructive">{notice}</p> : null}
      </header>
      <div className="grid min-h-0 flex-1 lg:grid-cols-[260px_minmax(0,1fr)_360px]">
        <aside className="hidden min-h-0 border-r border-border lg:block">{rail}</aside>
        <main className="min-h-0 overflow-y-auto px-3 py-4 sm:px-6">
          <ScriptEditor
            title={project.title}
            scenes={project.scenes}
            characters={project.characters}
            activeSceneId={scene.id}
            scrollNonce={scrollNonce}
            onActivate={setSceneId}
            onChange={updateScene}
          />
        </main>
        <aside className="hidden min-h-0 border-l border-border lg:block">{kit}</aside>
      </div>
      <Sheet open={panel === "scenes"} onOpenChange={(open) => !open && setPanel(null)}>
        <SheetContent side="left" className="w-full data-[side=left]:w-full data-[side=left]:sm:max-w-sm">
          <SheetHeader>
            <SheetTitle>Scenes</SheetTitle>
          </SheetHeader>
          {rail}
        </SheetContent>
      </Sheet>
      <Sheet open={panel === "kit"} onOpenChange={(open) => !open && setPanel(null)}>
        <SheetContent side="right" className="bg-background data-[side=right]:w-full data-[side=right]:max-w-none data-[side=right]:sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Scene kit</SheetTitle>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-hidden">{kit}</div>
        </SheetContent>
      </Sheet>
      <CharacterBible
        open={bibleOpen}
        onOpenChange={setBibleOpen}
        characters={project.characters}
        urls={urls}
        onChange={updateCharacters}
        onPortrait={(characterId, file) => void upload([file], "portrait", characterId)}
        onClearPortrait={(characterId) => {
          const portraitId = project.characters.find((character) => character.id === characterId)?.portraitId;
          updateCharacters(
            project.characters.map((character) =>
              character.id === characterId ? { ...character, portraitId: undefined } : character,
            ),
          );
          if (portraitId) void removeMedia(portraitId);
        }}
      />
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Script details</DialogTitle>
            <DialogDescription>These land on the title page of every export.</DialogDescription>
          </DialogHeader>
          <label className="grid gap-1 text-xs text-muted-foreground">
            Title
            <Input value={project.title} onChange={(event) => edit((current) => ({ ...current, title: event.target.value }))} />
          </label>
          <label className="grid gap-1 text-xs text-muted-foreground">
            Author
            <Input value={project.author} onChange={(event) => edit((current) => ({ ...current, author: event.target.value }))} />
          </label>
          <label className="grid gap-1 text-xs text-muted-foreground">
            Contact
            <Input value={project.contact} onChange={(event) => edit((current) => ({ ...current, contact: event.target.value }))} />
          </label>
          <label className="grid gap-1 text-xs text-muted-foreground">
            Draft label
            <Input value={project.draft} onChange={(event) => edit((current) => ({ ...current, draft: event.target.value }))} />
          </label>
          <label className="grid gap-1 text-xs text-muted-foreground">
            Logline
            <Textarea
              value={project.logline}
              rows={3}
              onChange={(event) => edit((current) => ({ ...current, logline: event.target.value }))}
            />
          </label>
        </DialogContent>
      </Dialog>
    </div>
  );
}
