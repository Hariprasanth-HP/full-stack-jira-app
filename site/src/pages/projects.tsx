import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAppSelector } from "@/hooks/useAuth";
import { useProject } from "@/lib/api/projects";
import { useParams } from "react-router-dom";
import { createEpicApi, useCreateEpic } from "@/lib/api/epic";
import EntityModal from "./EntityModal";
import ProjectHierarchy from "./List";

// ProjectsManager.tsx (shadcn/ui version)
// Replaces the earlier plain UI with shadcn components.
// Functionality:
// - list projects
// - create project
// - edit project (dialog)
// - delete project
// - add epics inline per project

function getAuthHeaders() {
  return { "Content-Type": "application/json" };
}

type Epic = { id: string; title: string };
type Project = {
  id: string;
  name: string;
  description?: string;
  epics?: Epic[];
};

export default function ProjectsManager() {
  const { id } = useParams<{ id: number }>();
  const { data: project, isLoading, isError, error, refetch } = useProject(id);
  const createEpic = useCreateEpic();
  const [open, setOpen] = useState(false);

  const handleCreateEpic = async (payload) => {
    try {
      await createEpic.mutate({ ...payload, projectId: id });
    } catch (error) {
      console.log("Error when creating Epic", error);
    }
  };
  if (isLoading) return <div>Loading project...</div>;
  if (isError && error) return <div className="text-red-600">{error}</div>;
  if (!project) return <div>No project found.</div>;

  return (
    <div className="max-w-full mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{project.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {project.description}
          </p>
          <EntityModal
            open={open}
            onOpenChange={setOpen}
            type="epic"
            mode="create"
            context={{ projectId: id }}
            onSubmit={handleCreateEpic}
          />
          <ProjectHierarchy projectId={id} />
        </CardContent>
      </Card>
    </div>
  );
}
