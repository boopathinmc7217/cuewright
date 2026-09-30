"use client";

import { useParams } from "next/navigation";
import { Workspace } from "@/components/workspace";

export default function ProjectPage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  if (!id) return null;
  return <Workspace key={id} projectId={id} />;
}
