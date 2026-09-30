"use client";

import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { deleteProject, ensureSeed, listProjects, restoreSample, saveProject } from "@/lib/db";
import { formatWhen } from "@/lib/id";
import { blankProject, estimatePages } from "@/lib/screenplay";
import { SAMPLE_ID } from "@/lib/sample";
import type { Project } from "@/lib/types";

export function LibraryView() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [about, setAbout] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [logline, setLogline] = useState("");
  const router = useRouter();

  async function refresh() {
    setStatus("loading");
    try {
      await ensureSeed();
      setProjects(await listProjects());
      setStatus("ready");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "The shelf could not be read.");
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return projects;
    return projects.filter((project) =>
      `${project.title} ${project.logline} ${project.author}`.toLowerCase().includes(needle),
    );
  }, [projects, query]);

  async function create() {
    const project = blankProject(title, author);
    project.logline = logline.trim();
    await saveProject(project);
    router.push(`/project/${project.id}`);
  }

  async function remove(project: Project) {
    if (!window.confirm(`Remove “${project.title}” from this browser?`)) return;
    await deleteProject(project.id);
    setProjects(await listProjects());
  }

  async function loadSample() {
    const sample = await restoreSample();
    router.push(`/project/${sample.id}`);
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <p className="text-xs tracking-[0.22em] text-primary uppercase">Script writer plugin</p>
          <h1 className="mt-2 font-display text-5xl leading-none text-foreground">Cuewright</h1>
          <p className="mt-3 text-base text-muted-foreground">
            A classical screenplay page, with hair, dress color, place, and reference media kept on the scene you are writing.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => setAbout(true)}>
            Why it works this way
          </Button>
          <Button type="button" onClick={() => setOpen(true)}>
            <Plus />
            New script
          </Button>
        </div>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search titles and loglines"
          className="sm:max-w-sm"
        />
        <p className="text-xs text-muted-foreground">Scripts stay in this browser until you export a file.</p>
        {status === "ready" && !projects.some((project) => project.id === SAMPLE_ID) ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => void loadSample()}>
            Put the sample back
          </Button>
        ) : null}
      </div>

      {status === "loading" ? (
        <div className="grid gap-3">
          <div className="h-28 animate-pulse rounded-xl bg-card" />
          <div className="h-28 animate-pulse rounded-xl bg-card" />
        </div>
      ) : null}

      {status === "error" ? (
        <div className="rounded-xl border border-destructive/40 bg-card px-4 py-5">
          <h2 className="font-display text-2xl">The shelf did not open.</h2>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          <Button type="button" className="mt-4" onClick={() => void refresh()}>
            Try again
          </Button>
        </div>
      ) : null}

      {status === "ready" && visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-4 py-10">
          <h2 className="font-display text-3xl">The shelf is clear.</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Start a script, or open the sample and see a scene whose wardrobe changes between the booth and the platform.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" onClick={() => setOpen(true)}>
              New script
            </Button>
            <Button type="button" variant="secondary" onClick={() => void loadSample()}>
              Open the sample
            </Button>
          </div>
        </div>
      ) : null}

      {status === "ready" && visible.length > 0 ? (
        <ul className="grid gap-3">
          {visible.map((project) => (
            <li key={project.id} className="rounded-xl border border-border bg-card/80">
              <div className="flex items-stretch">
                <Link href={`/project/${project.id}`} className="min-w-0 flex-1 px-4 py-4">
                  <span className="text-[10px] tracking-[0.16em] text-primary uppercase">
                    {project.id === SAMPLE_ID ? "Sample" : project.draft || "Draft"}
                  </span>
                  <span className="mt-1 block truncate font-display text-2xl">{project.title}</span>
                  <span className="mt-1 line-clamp-2 block text-sm text-muted-foreground">
                    {project.logline || "No logline yet."}
                  </span>
                  <span className="mt-3 block text-xs text-muted-foreground">
                    {project.scenes.length} {project.scenes.length === 1 ? "scene" : "scenes"} ·{" "}
                    {project.characters.length} in the cast · about {estimatePages(project)}{" "}
                    {estimatePages(project) === 1 ? "page" : "pages"} · {formatWhen(project.updatedAt)}
                  </span>
                </Link>
                <div className="flex items-start p-3">
                  <Button type="button" size="icon" variant="ghost" aria-label={`Delete ${project.title}`} onClick={() => void remove(project)}>
                    <Trash2 />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">New script</DialogTitle>
            <DialogDescription>A title is enough. The first scene is waiting on the page.</DialogDescription>
          </DialogHeader>
          <label className="grid gap-1 text-xs text-muted-foreground">
            Title
            <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Last light at the station" />
          </label>
          <label className="grid gap-1 text-xs text-muted-foreground">
            Author
            <Input value={author} onChange={(event) => setAuthor(event.target.value)} placeholder="Your name" />
          </label>
          <label className="grid gap-1 text-xs text-muted-foreground">
            Logline
            <Textarea value={logline} rows={3} onChange={(event) => setLogline(event.target.value)} placeholder="Who wants what, and what it costs." />
          </label>
          <DialogFooter>
            <Button type="button" onClick={() => void create()}>
              Create script
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={about} onOpenChange={setAbout}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Borrowed from the writers&apos; room</DialogTitle>
            <DialogDescription>
              Cuewright is a script plugin: the page, the scene kit, and the file exporters are separate pieces on one draft.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              Final Draft, Fade In, and Highland own the page: slug, action, character, parenthetical, dialogue, transition. Tab changes the element. The text export is Fountain, so those apps can import it.
            </p>
            <p>
              Celtx and StudioBinder own the breakdown: locations, wardrobe, and reference boards live beside the scene instead of in a separate folder. Cuewright keeps hair, dress color, and continuity on every character in that scene, including a look that differs from the cast bible.
            </p>
            <p>
              Export plugins write .txt, .pdf, .docx, and a Word-compatible .doc. Stills travel into the PDF and Word scene kit. Video stays attached in the studio and is named in the file.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
