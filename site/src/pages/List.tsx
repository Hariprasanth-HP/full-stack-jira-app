import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import HierarchicalCollapsibleTable from "./Table";
import EntityModalSingleState from "./EntityModal";
import { useCreateEpic, useDeleteEpic, useFetchEpics } from "@/lib/api/epic";
import {
  useCreatestory,
  useDeletestory,
  useFetchstoryFromEpic,
} from "@/lib/api/story";
import {
  useCreatebug,
  useDeletebug,
  useFetchbugFromStory,
} from "@/lib/api/bug";
import { useFetchtaskFromStory } from "@/lib/api/task";
import { FormMode } from "@/types/api";
import {
  useCreateComment,
  useDeleteComment,
  useFetchCommentfromtarget,
  useUpdateComment,
} from "@/lib/api/comment";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export default function ProjectHierarchy({
  projectId,
}: {
  projectId?: number | string;
}) {
  const qc = useQueryClient();

  // Epics list from server (react-query hook)
  const {
    data: epics,
    isLoading: isLoadingEpics,
    isError,
    error,
    refetch: refetchEpics,
  } = useFetchEpics(projectId);

  // CRUD hooks
  const createStory = useCreatestory();
  const createEpic = useCreateEpic();
  const createComment = useCreateComment();
  const updateComment = useUpdateComment();
  const createBug = useCreatebug();

  const deleteBug = useDeletebug();
  const deleteEpic = useDeleteEpic();
  const deleteStory = useDeletestory();
  const deleteComment = useDeleteComment();

  // lazy fetchers for nested lists
  const fetchStories = useFetchstoryFromEpic();
  const fetchBugs = useFetchbugFromStory();
  const fetchTasks = useFetchtaskFromStory();
  const fetchComment = useFetchCommentfromtarget();

  // local UI state used by the table
  const [epicsForTableState, setEpicsForTableState] = useState<
    EpicApi[] | undefined
  >(undefined);

  // maps to track loading state per-entity when expanding or refreshing
  const [loadingStoriesByEpic, setLoadingStoriesByEpic] = useState<
    Record<string | number, boolean>
  >({});
  const [loadingBugsByStory, setLoadingBugsByStory] = useState<
    Record<string | number, boolean>
  >({});

  useEffect(() => {
    // whenever epics from server change, update local copy for the table
    if (epics) setEpicsForTableState(epics);
  }, [epics]);

  const epicsForTable = useMemo(
    () => epicsForTableState ?? ([] as EpicApi[]),
    [epicsForTableState]
  );

  // Generic update API (for inline edits)
  async function updateEntityApi(
    type: "epic" | "story" | "task" | "bug",
    id: string | number,
    payload: any
  ) {
    const base = {
      epic: `${API_BASE}/epic/${id}`,
      story: `${API_BASE}/stories/${id}`,
      task: `${API_BASE}/tasks/${id}`,
      bug: `${API_BASE}/bugs/${id}`,
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

  // Create helpers
  async function createEntityApi(
    type: "epic" | "story" | "task" | "bug",
    payload: any
  ) {
    switch (type) {
      case "epic":
        const { comment, ...rest } = payload;
        const { data } = await createEpic.mutateAsync(rest);
        return;
      case "story":
        return createStory.mutateAsync(payload);
      case "task":
        // no createTask hook available in this file — fallback to story/bug endpoint as appropriate in your API
        return createBug.mutateAsync(payload);
      case "bug":
        return createBug.mutateAsync(payload);
      default:
        throw new Error("Unsupported type");
    }
  }

  // Delete mapping
  async function deleteEntityApi(
    type: "epic" | "story" | "task" | "bug",
    id: string | number
  ) {
    try {
      const actions: {
        [K in "epic" | "story" | "task" | "bug"]?: () => Promise<any>;
      } = {
        epic: () => deleteEpic.mutateAsync({ epicId: id }),
        story: () => deleteStory.mutateAsync({ storyId: id }),
        // task: () => deleteTask.mutateAsync({ taskId: id }),
        bug: () => deleteBug.mutateAsync({ bugId: id }),
      };

      const action = actions[type];
      if (!action)
        throw new Error(`Delete action for "${type}" is not implemented`);
      return await action();
    } catch (err) {
      console.error("deleteEntityApi error:", err);
      throw err;
    }
  }

  // Mutations used by modal create/update flows
  const createMutation = useMutation({
    mutationFn: ({
      type,
      payload,
    }: {
      type: "epic" | "story" | "task" | "bug";
      payload: any;
    }) =>
      createEntityApi(type, payload).then((res: any) => {
        // many mutateAsync hooks return the parsed JSON already; guard for both shapes
        if (res?.ok === false) throw new Error("Create failed");
        return res;
      }),
    onSuccess: () => qc.invalidateQueries(["epics", projectId]),
    onSettled: () => {
      // modal will be closed by caller
    },
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

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"epic" | "story" | "task" | "bug">(
    "epic"
  );
  const [modalMode, setModalMode] = useState<FormMode>(FormMode.CREATE);
  const [modalContext, setModalContext] = useState<any>(undefined);
  const [editingInitial, setEditingInitial] = useState<
    (Partial<any> & { id?: string | number }) | undefined
  >(undefined);

  // Table handlers
  function handleAdd(type: "epic" | "story" | "task" | "bug", ctx?: any) {
    setModalType(type);
    setModalMode(FormMode.CREATE);
    setModalContext(ctx);
    setEditingInitial(undefined);
    setModalOpen(true);
  }

  function handleEdit(
    type: "epic" | "story" | "task" | "bug",
    id?: string | number,
    ctx?: any
  ) {
    if (!id) return;
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
            comments: found.comments,
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
      await deleteEntityApi(type, id);
      qc.invalidateQueries(["epics", projectId]);
    } catch (err: any) {
      alert(err?.message || "Delete failed");
    }
  }

  async function handleModalCreate(payload: any) {
    const body = {
      ...payload,
      projectId: modalContext?.projectId ?? projectId,
      epicId: modalContext?.epicId ?? undefined,
      storyId: modalContext?.storyId ?? undefined,
    };
    await createMutation.mutateAsync({ type: modalType, payload: body });
    setModalOpen(false);
  }

  async function handleModalUpdate(id: string | number, payload: any) {
    await updateMutation.mutateAsync({ type: modalType, id, payload });
    setModalOpen(false);
  }

  // Expand / refresh helpers that set loading state per-entity and update local table state
  const onExpandEpic = async (epicId: string | number) => {
    try {
      setLoadingStoriesByEpic((s) => ({ ...s, [epicId]: true }));
      const { data } = await fetchStories.mutateAsync({ epicId });
      const newEpics = epicsForTable?.map((epic) =>
        epic.id === epicId ? { ...epic, stories: data } : epic
      );
      setEpicsForTableState(newEpics);
    } finally {
      setLoadingStoriesByEpic((s) => ({ ...s, [epicId]: false }));
    }
  };

  const onExpandStory = async (
    epicId: string | number,
    storyId: string | number
  ) => {
    try {
      setLoadingBugsByStory((s) => ({ ...s, [storyId]: true }));
      const { data } = await fetchBugs.mutateAsync({ storyId });
      const { data: taskData } = await fetchTasks.mutateAsync({ storyId });

      const newEpics = epicsForTable?.map((epic) => {
        if (epic.id !== epicId) return epic;
        return {
          ...epic,
          stories: epic.stories?.map((story) =>
            story?.id === storyId
              ? { ...story, bugs: data, tasks: taskData }
              : story
          ),
        };
      });
      setEpicsForTableState(newEpics);
    } finally {
      setLoadingBugsByStory((s) => ({ ...s, [storyId]: false }));
    }
  };

  // Refresh handlers (these will render as small refresh buttons in the table rows)
  const handleRefreshEpic = async (epicId?: string | number) => {
    if (!epicId) {
      // refresh entire epics list
      await refetchEpics();
      return;
    }
    // if epicId provided, re-fetch its stories (and optionally epic data)
    await onExpandEpic(epicId);
  };

  const handleRefreshStory = async (
    epicId: string | number,
    storyId?: string | number
  ) => {
    if (!storyId) {
      // refresh all stories for epic
      await onExpandEpic(epicId);
      return;
    }
    await onExpandStory(epicId, storyId);
  };

  const handleRefreshBug = async (
    epicId: string | number,
    storyId: string | number,
    bugId?: string | number
  ) => {
    // currently we only support reloading story->bugs; pass storyId to reload bugs list
    await onExpandStory(epicId, storyId);
  };

  const handleCreateComment = async (comment) => {
    await createComment.mutateAsync({
      ...comment,
    });
  };
  const handleUpdateComment = async (comment) => {
    try {
      console.log("cccccccccccccc", comment);

      await updateComment.mutateAsync(comment);
    } catch (error) {
      console.log("eeeeeeeeeeeeeeeeeee0", error);
    }
  };
  const handleDeleteComment = (commentId) => {
    deleteComment.mutateAsync({ commentId });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Project Hierarchy</h2>
        <div className="flex items-center gap-2">
          <button
            className="btn"
            onClick={() => {
              setModalType("epic");
              setModalMode(FormMode.CREATE);
              setModalContext({ projectId });
              setEditingInitial(undefined);
              setModalOpen(true);
            }}
          >
            Add Epic
          </button>
          <button
            aria-label="Refresh epics"
            title="Refresh epics"
            className="btn"
            onClick={() => refetchEpics()}
          >
            ⟳
          </button>
        </div>
      </div>

      {isLoadingEpics ? (
        <div>Loading epics…</div>
      ) : isError ? (
        <div className="text-red-600">Error loading epics: {String(error)}</div>
      ) : (
        <HierarchicalCollapsibleTable
          epics={epicsForTable}
          onAdd={(type, ctx) => handleAdd(type, ctx)}
          onEdit={(type, id, ctx) => handleEdit(type, id, ctx)}
          onDelete={(type, id) => handleDelete(type, id)}
          onExpandEpic={onExpandEpic}
          onExpandStory={onExpandStory}
          // new refresh props for UI at each level — table should render small refresh icon/button where appropriate
          onRefreshEpic={(epicId?: string | number) =>
            handleRefreshEpic(epicId)
          }
          onRefreshStory={(
            epicId: string | number,
            storyId?: string | number
          ) => handleRefreshStory(epicId, storyId)}
          onRefreshBug={(
            epicId: string | number,
            storyId: string | number,
            bugId?: string | number
          ) => handleRefreshBug(epicId, storyId, bugId)}
          // loading indicators maps
          loadingStoriesByEpic={loadingStoriesByEpic}
          loadingBugsByStory={loadingBugsByStory}
        />
      )}

      <EntityModalSingleState
        open={modalOpen}
        onOpenChange={setModalOpen}
        type={modalType}
        mode={modalMode}
        initial={editingInitial}
        context={modalContext}
        onSubmit={handleModalCreate}
        onUpdate={handleModalUpdate}
        handleCreateComment={handleCreateComment}
        handleUpdateComment={handleUpdateComment}
        handleDeleteComment={handleDeleteComment}
        onSuccess={() => {
          // optional toast or side-effect
        }}
      />
    </div>
  );
}
