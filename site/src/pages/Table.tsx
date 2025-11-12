import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronRight,
  Edit,
  Trash,
  Plus,
  RefreshCw,
  Loader2,
} from "lucide-react";

type TaskOrBug = {
  id: number | string;
  name: string;
  description?: string;
  creator?: string;
  priority?: string;
  dueDate?: string | null;
  createdAt?: string | null;
};

type Story = {
  id: number | string;
  name: string;
  description?: string;
  tasks?: TaskOrBug[];
  bugs?: TaskOrBug[];
  creator?: string;
  priority?: string;
  dueDate?: string | null;
  createdAt?: string | null;
};

type Epic = {
  id: number | string;
  name: string;
  description?: string;
  stories?: Story[];
  creator?: string;
  priority?: string;
  dueDate?: string | null;
  createdAt?: string | null;
};

type Props = {
  epics: Epic[];
  // handlers receive (type, id, context)
  onAdd?: (type: "epic" | "story" | "task" | "bug", context?: any) => void;
  onEdit?: (
    type: "epic" | "story" | "task" | "bug",
    id?: string | number,
    context?: any
  ) => void;
  onDelete?: (
    type: "epic" | "story" | "task" | "bug",
    id?: string | number
  ) => void;
  // new expand handlers (called when expanding a row to lazily load children)
  onExpandEpic?: (epicId: string | number) => void | Promise<void>;
  onExpandStory?: (
    epicId: string | number,
    storyId: string | number
  ) => void | Promise<void>;
  // refresh handlers for the UI refresh buttons
  onRefreshEpic?: (epicId?: string | number) => void | Promise<void>;
  onRefreshStory?: (
    epicId: string | number,
    storyId?: string | number
  ) => void | Promise<void>;
  onRefreshBug?: (
    epicId: string | number,
    storyId: string | number,
    bugId?: string | number
  ) => void | Promise<void>;
  // loading maps passed from parent so individual rows can show spinners
  loadingStoriesByEpic?: Record<string | number, boolean>;
  loadingBugsByStory?: Record<string | number, boolean>;
  className?: string;
};

export default function HierarchicalCollapsibleTable({
  epics,
  onAdd,
  onEdit,
  onDelete,
  onExpandEpic,
  onExpandStory,
  onRefreshEpic,
  onRefreshStory,
  onRefreshBug,
  loadingStoriesByEpic,
  loadingBugsByStory,
  className,
}: Props) {
  // track expanded epics and stories
  const [openEpics, setOpenEpics] = useState<Record<string | number, boolean>>(
    {}
  );

  const [openStories, setOpenStories] = useState<
    Record<string | number, boolean>
  >({});

  const toggleEpic = (id: string | number) => {
    setOpenEpics((s) => ({ ...s, [id]: !s[id] }));
  };
  const toggleStory = (id: string | number) =>
    setOpenStories((s) => ({ ...s, [id]: !s[id] }));

  const formatDate = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString() : "";

  return (
    <div className={className}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-1/2">Name</TableHead>
            <TableHead>Creator</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Due</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {epics.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center py-6 text-sm text-muted-foreground"
              >
                No epics
              </TableCell>
            </TableRow>
          )}

          {epics.map((epic) => {
            const epicOpen = !!openEpics[epic.id];
            const storiesLoading = !!loadingStoriesByEpic?.[epic.id];

            return (
              <React.Fragment key={`epic-${epic.id}`}>
                {/* Epic row */}
                <TableRow className="bg-slate-50">
                  <TableCell>
                    <div className="flex items-start gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          aria-expanded={epicOpen}
                          onClick={async () => {
                            // toggle locally first
                            toggleEpic(epic.id);
                            // if expanding and no stories loaded -> call onExpandEpic
                            if (!epic.stories?.length && !epicOpen) {
                              await onExpandEpic?.(epic.id);
                            }
                          }}
                          className="h-8 w-8 rounded flex items-center justify-center hover:bg-muted"
                          title={epicOpen ? "Collapse Epic" : "Expand Epic"}
                        >
                          {epicOpen ? (
                            <ChevronDown className="text-black" size={16} />
                          ) : (
                            <ChevronRight className="text-black" size={16} />
                          )}
                        </button>

                        {/* refresh for epic's stories */}
                        <button
                          title="Refresh stories"
                          onClick={() => onRefreshEpic?.(epic.id)}
                          className="h-8 w-8 rounded flex items-center justify-center hover:bg-muted"
                        >
                          {storiesLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw size={14} />
                          )}
                        </button>
                      </div>

                      <div>
                        <div className="font-medium">{epic.name}</div>
                        {epic.description && (
                          <div className="text-xs text-muted-foreground">
                            {epic.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>{epic.creator}</TableCell>
                  <TableCell>{epic.priority}</TableCell>
                  <TableCell>{formatDate(epic.dueDate)}</TableCell>

                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onAdd?.("story", { epicId: epic.id })}
                      >
                        <Plus size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit?.("epic", epic.id)}
                      >
                        <Edit size={14} />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onDelete?.("epic", epic.id)}
                      >
                        <Trash size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>

                {/* Stories */}
                {epicOpen &&
                  (epic.stories || []).map((story) => {
                    const storyOpen = !!openStories[story.id];
                    const bugsLoading = !!loadingBugsByStory?.[story.id];
                    return (
                      <React.Fragment key={`story-${story.id}`}>
                        <TableRow>
                          <TableCell className="pl-12">
                            <div className="flex items-start gap-3">
                              <div className="flex items-center gap-2">
                                <button
                                  aria-expanded={storyOpen}
                                  onClick={async () => {
                                    toggleStory(story.id);
                                    if (!story.bugs?.length && !storyOpen) {
                                      await onExpandStory?.(epic.id, story.id);
                                    }
                                  }}
                                  className="h-7 w-7 rounded flex items-center justify-center hover:bg-muted"
                                  title={
                                    storyOpen
                                      ? "Collapse Story"
                                      : "Expand Story"
                                  }
                                >
                                  {storyOpen ? (
                                    <ChevronDown size={14} />
                                  ) : (
                                    <ChevronRight size={14} />
                                  )}
                                </button>

                                {/* refresh for story's bugs */}
                                <button
                                  title="Refresh bugs"
                                  onClick={() =>
                                    onRefreshStory?.(epic.id, story.id)
                                  }
                                  className="h-7 w-7 rounded flex items-center justify-center hover:bg-muted"
                                >
                                  {bugsLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <RefreshCw size={12} />
                                  )}
                                </button>
                              </div>

                              <div>
                                <div className="font-medium">{story.name}</div>
                                {story.description && (
                                  <div className="text-xs text-muted-foreground">
                                    {story.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>{story.creator}</TableCell>
                          <TableCell>{story.priority}</TableCell>
                          <TableCell>{formatDate(story.dueDate)}</TableCell>

                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  onAdd?.("task", { storyId: story.id })
                                }
                              >
                                <Plus size={14} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  onAdd?.("bug", { storyId: story.id })
                                }
                              >
                                🐞
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEdit?.("story", story.id)}
                              >
                                <Edit size={14} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDelete?.("story", story.id)}
                              >
                                <Trash size={14} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>

                        {/* Tasks & Bugs under story (same level) */}
                        {storyOpen &&
                          (
                            [
                              ...(story.tasks || []).map((t) => ({
                                ...t,
                                __kind: "task" as const,
                              })),
                              ...(story.bugs || []).map((b) => ({
                                ...b,
                                __kind: "bug" as const,
                              })),
                            ] as (TaskOrBug & { __kind: "task" | "bug" })[]
                          ).map((item) => (
                            <TableRow key={`${item.__kind}-${item.id}`}>
                              <TableCell className="pl-20">
                                <div>
                                  <div className="font-medium">{item.name}</div>
                                  {item.description && (
                                    <div className="text-xs text-muted-foreground">
                                      {item.description}
                                    </div>
                                  )}
                                </div>
                              </TableCell>

                              <TableCell>{item.creator}</TableCell>
                              <TableCell>{item.priority}</TableCell>
                              <TableCell>{formatDate(item.dueDate)}</TableCell>

                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      onEdit?.(item.__kind, item.id)
                                    }
                                  >
                                    <Edit size={14} />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      onDelete?.(item.__kind, item.id)
                                    }
                                  >
                                    <Trash size={14} />
                                  </Button>

                                  {/* small refresh to reload bugs for the parent story (useful if a single bug changed upstream) */}
                                  {item.__kind === "bug" && (
                                    <button
                                      title="Refresh this story's bugs"
                                      onClick={() =>
                                        onRefreshBug?.(
                                          epic.id,
                                          story.id,
                                          item.id
                                        )
                                      }
                                      className="h-6 w-6 rounded flex items-center justify-center hover:bg-muted"
                                    >
                                      <RefreshCw size={12} />
                                    </button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                      </React.Fragment>
                    );
                  })}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
