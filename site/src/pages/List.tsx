// components/ProjectHierarchy.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import HierarchicalCollapsibleTable from "./Table";
import EntityModalSingleState from "./EntityModal";
import { useFetchEpics } from "@/lib/api/epic";
import {
  fetchStories,
  useCreatestory,
  useFetchstories,
  useFetchstoryFromEpic,
} from "@/lib/api/story";
import { apiGet } from "@/lib/apiClient";
// import { transformEpicsToRows, EpicApi } from "@/lib/transformHierarchy";

const API_BASE = import.meta.env.NEXT_PUBLIC_API_BASE || "";

// --- API helpers (adjust endpoints if yours differ) ---
async function fetchEpics(projectId?: number | string) {
  const q = projectId ? `?projectId=${projectId}` : "";
  const res = await fetch(`${API_BASE}/api/epics${q}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch epics");
  return (await res.json()) as EpicApi[];
}

async function updateEntityApi(
  type: "epic" | "story" | "task" | "bug",
  id: string | number,
  payload: any
) {
  const base = {
    epic: `${API_BASE}/api/epics/${id}`,
    story: `${API_BASE}/api/stories/${id}`,
    task: `${API_BASE}/api/tasks/${id}`,
    bug: `${API_BASE}/api/bugs/${id}`,
  } as Record<string, string>;
  const res = await fetch(base[type], {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Update failed");
  return res.json();
}

async function deleteEntityApi(
  type: "epic" | "story" | "task" | "bug",
  id: string | number
) {
  const base = {
    epic: `${API_BASE}/api/epics/${id}`,
    story: `${API_BASE}/api/stories/${id}`,
    task: `${API_BASE}/api/tasks/${id}`,
    bug: `${API_BASE}/api/bugs/${id}`,
  } as Record<string, string>;
  const res = await fetch(base[type], {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Delete failed");
  return res.json();
}

// --- Component ---
export default function ProjectHierarchy({
  projectId,
}: {
  projectId?: number | string;
}) {
  const qc = useQueryClient();
  const {
    data: epics,
    isLoading,
    isError,
    error,
    refetch,
  } = useFetchEpics(projectId);
  const createStory = useCreatestory();

  useEffect(() => {
    if (epics) {
      setEpicsForTableState(epics);
    }
  }, [epics]);
  // Transform API shape to nested structure used by table (we use the collapsible table component which expects epics[])
  const [epicsForTableState, setEpicsForTableState] = useState(epics);
  const epicsForTable = useMemo(
    () => epicsForTableState ?? ([] as EpicApi[]),
    [epicsForTableState]
  );
  console.log("eppppppppppp", epicsForTable, epicsForTableState);
  async function createEntityApi(
    type: "epic" | "story" | "task" | "bug",
    payload: any
  ) {
    // Decide endpoint from type + context in payload
    switch (type) {
      case "epic":
        return fetch(`${API_BASE}/api/projects/${payload.projectId}/epics`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      case "story":
        return createStory.mutate(payload);
      case "task":
        return fetch(`${API_BASE}/api/stories/${payload.storyId}/tasks`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      case "bug":
        return fetch(`${API_BASE}/api/stories/${payload.storyId}/bugs`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
    }
  }

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"epic" | "story" | "task" | "bug">(
    "epic"
  );
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [modalContext, setModalContext] = useState<any>(undefined);
  const [editingInitial, setEditingInitial] = useState<
    (Partial<any> & { id?: string | number }) | undefined
  >(undefined);

  // Mutations
  const fetchStories = useFetchstoryFromEpic();
  const createMutation = useMutation({
    mutationFn: ({
      type,
      payload,
    }: {
      type: "epic" | "story" | "task" | "bug";
      payload: any;
    }) =>
      createEntityApi(type, payload).then(async (res) => {
        if (!res.ok) throw new Error("Create failed");
        return res.json();
      }),
    onSuccess: () => qc.invalidateQueries(["epics", projectId]),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      type,
      id,
      payload,
    }: {
      type: "epic" | "story" | "task" | "bug";
      id: string | number;
      payload: any;
    }) => updateEntityApi(type, id, payload),
    onSuccess: () => qc.invalidateQueries(["epics", projectId]),
  });

  const deleteMutation = useMutation({
    mutationFn: ({
      type,
      id,
    }: {
      type: "epic" | "story" | "task" | "bug";
      id: string | number;
    }) => deleteEntityApi(type, id),
    onSuccess: () => qc.invalidateQueries(["epics", projectId]),
  });

  // Handlers for table actions
  function handleAdd(type: "epic" | "story" | "task" | "bug", ctx?: any) {
    setModalType(type);
    setModalMode("create");
    setModalContext(ctx);
    setEditingInitial(undefined);
    // prefill creator or other fields from context if needed
    setModalOpen(true);
  }
  const onExpandEpic = async (epicId) => {
    const { data } = await fetchStories.mutateAsync({ epicId });
    const newEpics = epicsForTable?.map((epic) => {
      if (epic.id === epicId) {
        return { ...epic, stories: data };
      }
      return epic;
    });
    setEpicsForTableState(newEpics);
  };

  function handleEdit(
    type: "epic" | "story" | "task" | "bug",
    id?: string | number,
    ctx?: any
  ) {
    // find entity to populate initial values. We need to search nested epics for matching id.
    if (!id) return;
    // strip prefix if your ids include prefixes (e.g., 'epic-123') — here we assume raw numeric id was passed by table
    // find item in epics
    let found: any = null;
    outer: for (const e of epicsForTable) {
      if (String(e.id) === String(id) && type === "epic") {
        found = e;
        break;
      }
      for (const s of e.stories || []) {
        if (String(s.id) === String(id) && type === "story") {
          found = s;
          break outer;
        }
        for (const t of s.tasks || []) {
          if (String(t.id) === String(id) && type === "task") {
            found = t;
            break outer;
          }
        }
        for (const b of s.bugs || []) {
          if (String(b.id) === String(id) && type === "bug") {
            found = b;
            break outer;
          }
        }
      }
    }
    setModalType(type);
    setModalMode("edit");
    setModalContext(ctx);
    setEditingInitial(
      found
        ? {
            id: found.id,
            name: found.name,
            description: found.description,
            creator: found.creator,
            priority: found.priority,
            dueDate: found.dueDate,
            createdAt: found.createdAt,
          }
        : undefined
    );
    setModalOpen(true);
  }

  async function handleDelete(
    type: "epic" | "story" | "task" | "bug",
    id?: string | number
  ) {
    if (!id) return;
    if (!confirm(`Delete this ${type}? This cannot be undone.`)) return;
    try {
      await deleteMutation.mutateAsync({ type, id });
    } catch (err: any) {
      alert(err?.message || "Delete failed");
    }
  }

  // Modal submit handlers
  async function handleModalCreate(payload: any) {
    // include context ids as needed
    const body = {
      ...payload,
      projectId: modalContext?.projectId ?? projectId,
      epicId: modalContext?.epicId ?? undefined,
      storyId: modalContext?.storyId ?? undefined,
    };
    await createMutation.mutateAsync({ type: modalType, payload: body });
  }

  async function handleModalUpdate(id: string | number, payload: any) {
    const body = { ...payload };
    await updateMutation.mutateAsync({ type: modalType, id, payload: body });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Project Hierarchy</h2>
        <div>
          <button
            className="btn"
            onClick={() => {
              setModalType("epic");
              setModalMode("create");
              setModalContext({ projectId });
              setEditingInitial(undefined);
              setModalOpen(true);
            }}
          >
            Add Epic
          </button>
        </div>
      </div>

      <HierarchicalCollapsibleTable
        epics={epicsForTable}
        onAdd={(type, ctx) => handleAdd(type, ctx)}
        onEdit={(type, id, ctx) => handleEdit(type, id, ctx)}
        onDelete={(type, id) => handleDelete(type, id)}
        onExpandEpic={onExpandEpic}
      />

      <EntityModalSingleState
        open={modalOpen}
        onOpenChange={setModalOpen}
        type={modalType}
        mode={modalMode}
        initial={editingInitial}
        context={modalContext}
        onSubmit={handleModalCreate}
        onUpdate={handleModalUpdate}
        onSuccess={() => {
          // modal will close itself; optionally show toast
        }}
      />
    </div>
  );
}
