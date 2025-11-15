import React, { useState } from "react";
import {
  useCreateProject,
  useDeleteProject,
  useProjects,
} from "@/lib/api/projects";
import { useAppSelector } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle, Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Pagination } from "./Paginated";

export default function ProjectsPage() {
  const auth = useAppSelector((state) => state.auth);

  const {
    data: projects,
    isLoading,
    isError,
    error,
    refetch,
  } = useProjects(auth?.user);
  const navigate = useNavigate();
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();

  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProject.mutateAsync({
        name,
        description: desc,
        creatorId: auth?.user!.id,
      });
      setName("");
      setDesc("");
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error: {error?.message}</div>;

  return (
    <div>
      <h1 className="text-2xl mb-4">Projects</h1>

      <form onSubmit={onCreate} className="flex gap-2 mb-4">
        <Input
          placeholder="Project name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          placeholder="Description"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
        <Button type="submit" disabled={createProject.isLoading}>
          Create
        </Button>
      </form>

      <div className="grid gap-3">
        {projects?.map((p) => (
          <Card
            onClick={() => {
              navigate(`/project/${p?.id}`);
            }}
            key={p.id}
          >
            <CardHeader>
              <CardTitle>{p.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{p.description}</p>
              <div className="mt-2 flex gap-2">
                <Button
                  onClick={() => deleteProject.mutate(p.id)}
                  disabled={deleteProject.isLoading}
                >
                  Delete
                </Button>
                <Button onClick={() => console.log("Open project", p.id)}>
                  Open
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Pagination />
    </div>
  );
}
