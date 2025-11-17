import React, { Fragment, useEffect, useMemo, useState } from "react";
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
import {
  useCreatetask,
  useDeletetask,
  useFetchtaskFromStory,
} from "@/lib/api/task";
import { FormMode } from "@/types/api";
import {
  useCreateComment,
  useDeleteComment,
  useFetchCommentfromtarget,
  useUpdateComment,
} from "@/lib/api/comment";
import { DataTablePagination } from "@/components/Table";
import type { ColumnDef } from "@tanstack/react-table";
import { ChevronDown, ChevronRight, Loader2, Plus, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

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
  const createTask = useCreatetask();

  const deleteBug = useDeletebug();
  const deleteEpic = useDeleteEpic();
  const deleteStory = useDeletestory();
  const deleteComment = useDeleteComment();
  const deleteTask = useDeletetask();

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
    if (epics) {
      setEpicsForTableState(epics);
    }
  }, [epics]);

  const epicsForTable = useMemo(
    () => epicsForTableState ?? ([] as EpicApi[]),
    [epicsForTableState]
  );
  console.log("epicsForTableepicsForTable", epicsForTable, epicsForTableState);

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
        return createTask.mutateAsync(payload);
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
        task: () => deleteTask.mutateAsync({ taskId: id }),
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
  async function onExpandEpic(epicId: string | number) {
    try {
      console.log("dataaaa", epicId, epicsForTable, epics);

      const { data } = await fetchStories.mutateAsync({ epicId });
      setEpicsForTableState((prevEpics) =>
        (prevEpics ?? []).map((epic) =>
          epic.id === epicId ? { ...epic, children: data } : epic
        )
      );
    } finally {
      setLoadingStoriesByEpic((s) => ({ ...s, [epicId]: false }));
    }
  }

  const onExpandStory = async (storyId: string | number, epicId) => {
    try {
      setLoadingBugsByStory((s) => ({ ...s, [storyId]: true }));
      const { data } = await fetchBugs.mutateAsync({ storyId });

      const { data: taskData } = await fetchTasks.mutateAsync({ storyId });
      console.log("datadatastt", data, taskData, storyId, epicId);

      setEpicsForTableState((prev) => {
        return prev.map((epic) => {
          if (epic.id !== epicId) return epic;
          return {
            ...epic,
            children: epic.children?.map((story) =>
              story?.id === storyId
                ? {
                    ...story,
                    children: [
                      ...data.map((dat) => {
                        return { ...dat, type: "bug" };
                      }),
                      ...taskData,
                    ],
                  }
                : story
            ),
          };
        });
      });
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
  type Person = {
    firstName: string;
    lastName: string;
    age: number;
    visits: number;
    status: string;
    progress: number;
  };
  console.log("cdddddddddddddddd", epicsForTable);

  const columns = React.useMemo<ColumnDef<any, any>[]>(
    () => [
      // EXPAND / CHILDREN column (unchanged)
      {
        id: "stories",
        header: "",
        cell: ({ row }) => {
          const depth = row.depth;
          const isExpanded = row.getIsExpanded();

          // ===== EPIC ROW =====
          if (depth === 0) {
            const epic = row.original as Epic;
            const loading = !!loadingStoriesByEpic?.[epic.id];

            const handleEpicExpand = async (e: React.MouseEvent) => {
              e.stopPropagation();
              if (isExpanded) {
                row.toggleExpanded();
                return;
              }
              if (epic.stories?.length > 0) {
                row.toggleExpanded();
                return;
              }
              await onExpandEpic?.(epic.id);
              row.toggleExpanded();
            };

            return (
              <button
                onClick={handleEpicExpand}
                disabled={loading}
                className="h-8 w-13 rounded flex items-center justify-center hover:bg-muted p-0 "
                aria-expanded={isExpanded}
                title={isExpanded ? "Collapse stories" : "Expand stories"}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-black" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-black" />
                )}
              </button>
            );
          }

          // ===== STORY ROW =====
          if (depth === 1) {
            const story = row.original as Story;
            const handleStoryExpand = async (e: React.MouseEvent) => {
              e.stopPropagation();
              console.log("storystorystory", story);

              await onExpandStory?.(story.id, row.original.epicId);
              row.toggleExpanded();
            };

            return (
              <button
                onClick={handleStoryExpand}
                className="h-7 w-13 rounded flex items-center justify-center hover:bg-muted"
                aria-expanded={isExpanded}
                title={isExpanded ? "Collapse story" : "Expand story"}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-black" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-black" />
                )}
              </button>
            );
          }

          // ===== DEEPER ROWS (tasks/bugs) =====
          return null;
        },
      },

      // ID
      {
        id: "id",
        accessorKey: "id",
        header: "ID",
        cell: (info) => (
          <span className="font-mono text-xs">{info.getValue()}</span>
        ),
        footer: (props) => props.column.id,
      },

      // Name
      {
        accessorKey: "name",
        id: "name",
        header: "Name",
        cell: (info) => <div className="font-medium">{info.getValue()}</div>,
        footer: (props) => props.column.id,
      },

      // Description
      {
        accessorKey: "description",
        id: "description",
        header: "Description",
        cell: (info) => (
          <div className="text-xs text-muted-foreground">
            {info.getValue() ?? (
              <span className="text-muted">No description</span>
            )}
          </div>
        ),
        footer: (props) => props.column.id,
      },

      // Creator
      {
        accessorKey: "creator",
        id: "creator",
        header: "Creator",
        cell: (info) => info.getValue() ?? "—",
        footer: (props) => props.column.id,
      },

      // Priority
      {
        accessorKey: "priority",
        id: "priority",
        header: "Priority",
        cell: (info) => (
          <span className="uppercase text-sm font-semibold">
            {info.getValue() ?? "UNKNOWN"}
          </span>
        ),
        footer: (props) => props.column.id,
      },

      // Due date (formatted)
      {
        id: "dueDate",
        accessorKey: "dueDate",
        header: "Due",
        cell: (info) => {
          const v = info.getValue();
          return v ? new Date(v as string).toLocaleDateString() : "—";
        },
        footer: (props) => props.column.id,
      },

      // Created at (formatted)
      {
        id: "createdAt",
        accessorKey: "createdAt",
        header: "Created",
        cell: (info) => {
          const v = info.getValue();
          return v ? new Date(v as string).toLocaleString() : "—";
        },
        footer: (props) => props.column.id,
      },
      // ADD / ACTIONS column (with Delete)
      {
        id: "addActions",
        header: "Actions",
        size: 100,
        maxSize: 100,
        minSize: 80,
        cell: ({ row }) => {
          // Epic row -> single "Add story" + Delete
          if (row.depth === 0) {
            const epic = row.original as Epic;
            return (
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAdd?.("story", { epicId: epic.id });
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();

                    handleDelete?.("epic", epic.id);
                  }}
                  title="Delete epic"
                  className="text-destructive"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            );
          }

          // Story row -> two buttons: Add Task, Add Bug + Delete
          if (row.depth === 1) {
            const story = row.original as Story;
            return (
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAdd?.("task", { storyId: story.id })}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();

                    handleAdd?.("bug", { storyId: story.id });
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();

                    handleDelete?.("story", story.id);
                  }}
                  title="Delete story"
                  className="text-destructive"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            );
          }

          // deeper rows -> show edit/delete for items (assumes __kind exists for tasks/bugs)
          if (row.depth === 2) {
            const taskOrBug = row.original;
            console.log("taskOrBugtaskOrBugtaskOrBug", taskOrBug);

            return (
              <Fragment>
                {taskOrBug.type ? (
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();

                        handleDelete?.("bug", taskOrBug.id);
                      }}
                      title="Delete story"
                      className="text-destructive"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();

                        handleDelete?.("task", taskOrBug.id);
                      }}
                      title="Delete story"
                      className="text-destructive"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </Fragment>
            );
          }
        },
        footer: (props) => props.column.id,
      },
    ],
    // dependencies: update columns if these change
    [
      loadingStoriesByEpic,
      onExpandEpic,
      onExpandStory,
      handleAdd,
      handleDelete,
      handleEdit,
    ]
  );
  const navigate = useNavigate();
  const onRowClick = (row) => {
    if (row.depth === 0) {
      const epicId = row.original.id;
      navigate(`/epic/${epicId}`);
    }
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
        <DataTablePagination
          data={epicsForTable}
          columns={columns}
          getSubRows={(row) => row.children}
          onRowClick={onRowClick}
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
