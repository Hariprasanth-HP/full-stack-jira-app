import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Save, X } from "lucide-react";
import { useParams } from "react-router-dom";
import { useFetchstory, useFetchstoryFromEpic } from "@/lib/api/story";
import { useFetchbug, useFetchbugFromStory } from "@/lib/api/bug";
import { useFetchtask, useFetchtaskFromStory } from "@/lib/api/task";

export default function EpicForm({
  initial: initialProp,
  users = {},
  onSave = () => {},
  onDelete = () => {},
}: any) {
  // resolve initial from navigate state if present
  const { type = undefined, id = undefined } = useParams();
  const navInitial = location?.state?.initial;
  const initial = navInitial || initialProp;
  useEffect(() => {
    setLoading(true);
    handleFetchFormData();
  }, []);
  const fetchStory = useFetchstory();
  const fetchBug = useFetchbug();
  const fetchTask = useFetchtask();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState({});

  function setField<K extends string>(key: K, value: any) {
    setForm((s: any) => ({ ...s, [key]: value }));
  }

  function handleSave() {
    onSave(form);
    setEditing(false);
  }

  function handleCancel() {
    // reset to initial
    setForm({
      id: form.id,
      name: form.name || "",
      description: form.description || "",
      priority: form.priority || "MEDIUM",
      dueDate: form.dueDate || null,
      assignedById: form.assignedById ?? null,
      assigneeId: form.assigneeId ?? null,
      children: form?.children,
    });
    setEditing(false);
  }
  async function handleFetchFormData() {
    let res;

    switch (type) {
      case "story":
        res = await fetchStory.mutateAsync({ id });
        break;
      case "task":
        res = await fetchTask.mutateAsync({ id });
        break;
      case "bug":
        res = await fetchBug.mutateAsync({ id });
        break;
      default:
        return;
    }

    const data = res?.data ?? res;
    console.log("dataForm", data);

    if (!data) return;

    // Map the payload into your form state
    setForm({
      id: data.id,
      name: data.name ?? data.title ?? "",
      description: data.description ?? "",
      priority: data.priority ?? "MEDIUM",
      dueDate: data.dueDate ?? null,
      assignedById: data.assignedById ?? null,
      assigneeId: data.assigneeId ?? null,
      children:
        data?.tasks || data?.bugs ? [...data?.tasks, ...data?.bugs] : [],
    });

    setLoading(false);
  }

  const priorityColor: Record<string, string> = {
    HIGH: "bg-red-100 text-red-700",
    MEDIUM: "bg-yellow-100 text-yellow-800",
    LOW: "bg-green-100 text-green-700",
  };
  if (!id) {
    return <h1>No Story or Task or Bug exists</h1>;
  }
  console.log("formmm", form);

  return (
    <>
      {loading ? (
        <>Loading ...</>
      ) : (
        <Card className="max-w-[100%] mx-auto">
          <CardHeader className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-3">
                {editing ? (
                  <Input
                    value={form.name}
                    onChange={(e) => setField("name", e.target.value)}
                    className="w-80"
                    placeholder="Epic title"
                  />
                ) : (
                  <span className="text-lg font-semibold">{form.name}</span>
                )}

                {/* priority banner */}
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    priorityColor[initial?.priority ?? "MEDIUM"] ||
                    "bg-gray-100 text-gray-700"
                  }`}
                >
                  {form.priority}
                </span>
              </CardTitle>

              {editing ? (
                <div className="mt-2 flex gap-2 items-center">
                  <Label className="text-xs">Priority</Label>
                  <Select
                    onValueChange={(v) => setField("priority", v)}
                    value={form.priority}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HIGH">HIGH</SelectItem>
                      <SelectItem value="MEDIUM">MEDIUM</SelectItem>
                      <SelectItem value="LOW">LOW</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="ml-4">
                    <Label className="text-xs">Due Date</Label>
                    <Input
                      type="date"
                      value={form.dueDate ?? ""}
                      onChange={(e) => setField("dueDate", e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground mt-1">
                  Created: {new Date(form.createdAt).toLocaleString()}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Edit / Delete icons */}
              {editing ? (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleSave}
                    className="flex items-center gap-2"
                  >
                    <Save size={14} /> Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCancel}
                    className="flex items-center gap-2"
                  >
                    <X size={14} /> Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-2"
                  >
                    <Edit size={14} /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onDelete(form.id)}
                    className="flex items-center gap-2"
                  >
                    Delete
                  </Button>
                </>
              )}
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                {/* description */}
                <div className="mb-4">
                  <Label>Description</Label>
                  {editing ? (
                    <Textarea
                      value={form.description}
                      onChange={(e) => setField("description", e.target.value)}
                      placeholder="Describe the epic"
                    />
                  ) : (
                    <div className="text-sm text-gray-700 mt-1">
                      {form.description || (
                        <span className="text-muted-foreground italic">
                          No description
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* children (stories) */}
                {type === "story" && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium">Tasks or Bugs</div>
                      <div className="text-xs text-muted-foreground">
                        {form.children?.length ?? 0}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {form.children?.map((s: any) => (
                        <div
                          key={s.id}
                          className="p-3 border rounded-md bg-white shadow-sm flex items-start justify-between"
                        >
                          <div>
                            <div className="text-sm font-medium">{s.name}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Priority: {s.priority}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">#{s.id}</div>
                        </div>
                      ))}

                      {(!form.children || form.children.length === 0) && (
                        <div className="text-sm text-muted-foreground italic">
                          No stories
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                {/* right column: meta */}
                <div className="mb-4">
                  <Label>Assigned By</Label>
                  {editing ? (
                    <Input
                      value={String(form.assignedById ?? "")}
                      onChange={(e) =>
                        setField(
                          "assignedById",
                          e.target.value ? Number(e.target.value) : null
                        )
                      }
                      placeholder="User id"
                    />
                  ) : (
                    <div className="text-sm mt-1">
                      {form.assignedById ? (
                        users[form.assignedById]?.name ??
                        users[form.assignedById]?.email ??
                        form.assignedById
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <Label>Assignee</Label>
                  {editing ? (
                    <Input
                      value={String(form.assigneeId ?? "")}
                      onChange={(e) =>
                        setField(
                          "assigneeId",
                          e.target.value ? Number(e.target.value) : null
                        )
                      }
                      placeholder="User id"
                    />
                  ) : (
                    <div className="text-sm mt-1">
                      {form.assigneeId ? (
                        users[form.assigneeId]?.name ??
                        users[form.assigneeId]?.email ??
                        form.assigneeId
                      ) : (
                        <span className="text-muted-foreground">
                          Unassigned
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="mb-2">
                  <Label>Priority</Label>
                  {editing ? (
                    <Select
                      onValueChange={(v) => setField("priority", v)}
                      value={form.priority}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HIGH">HIGH</SelectItem>
                        <SelectItem value="MEDIUM">MEDIUM</SelectItem>
                        <SelectItem value="LOW">LOW</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge className="mt-2">{form.priority}</Badge>
                  )}
                </div>

                <div className="text-xs text-muted-foreground mt-4">
                  Created: {new Date(form.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
