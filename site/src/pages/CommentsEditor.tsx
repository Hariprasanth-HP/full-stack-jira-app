import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils"; // optional helper for classnames

/**
 * Professional comments panel using shadcn/ui + Tailwind.
 * - Shows existing comments (passed via `form.comment`)
 * - Lets user add a NEW comment with validation and optimistic update
 * - Supports reply, edit and delete for comments & replies
 * - Exposes `handleCreateComment`, `handleUpdateComment`, `handleDeleteComment`, `handleDeleteReply` props for real API calls; if omitted, falls back to local state
 *
 * Props:
 * - form: { comment: Comment[] }
 * - handleCreateComment: async (payload) => createdComment  // optional (payload can include parentId)
 * - handleUpdateComment: async (payload) => updatedComment // optional
 * - handleDeleteComment: async (id) => void // optional
 * - handleDeleteReply: async ({ id, parentId }) => void // optional
 * - auth: { id, name, avatarUrl } // optional, used for new comment author
 *
 * Comment shape assumed:
 * { id, author: { name, avatarUrl, id }, content, createdAt, replies? }
 */

export default function CommentsWithShadcn({
  form,
  handleCreateComment,
  auth,
  handleUpdateComment,
  handleDeleteComment,
  type,
}) {
  const [comments, setComments] = useState(
    form?.comments || form?.comment || []
  );
  // editId keys: comment:<id> or reply:<parentId>:<replyId>
  const [editId, setEditId] = useState(null);
  // replyId to open reply composer: replyTo:<parentId>
  const [replyTo, setReplyTo] = useState(null);
  const [newContent, setNewContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  console.log("editIdeditId", editId);

  useEffect(() => {
    setComments(form?.comments || form?.comment || []);
  }, [form?.comments, form?.comment]);

  const validate = (content) => {
    if (!content || !content.trim()) return "Comment can't be empty";
    if (content.trim().length < 2) return "Comment is too short";
    if (content.trim().length > 2000) return "Comment is too long";
    return null;
  };

  // create can be for a top-level comment or a reply (parentId)
  const handleCreate = async ({ content, parentId = null }) => {
    setError(null);
    const v = validate(content);
    if (v) {
      setError(v);
      return null;
    }

    setLoading(true);

    // optimistic object
    const tempId = `temp-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    const optimistic = {
      content: content.trim(),
      createdAt: new Date().toISOString(),
      replies: [],
      authorId: auth?.user.id,
      parentId,
      ...(type === "epic" ? { epicId: form.id } : {}),
    };

    // apply optimistic update locally
    if (parentId) {
      setComments((prev) =>
        prev.map((c) =>
          c.id === parentId
            ? { ...c, replies: [optimistic, ...(c.replies || [])] }
            : c
        )
      );
    } else {
      setComments((prev) => [optimistic, ...prev]);
    }

    try {
      if (typeof handleCreateComment === "function") {
        const payload = { ...optimistic };
        if (parentId) payload.parentId = parentId;
        const created = await handleCreateComment(payload);
        // server should return created item (with id and parentId)
        if (parentId) {
          setComments((prev) =>
            prev.map((c) =>
              c.id === parentId
                ? {
                    ...c,
                    replies: (c.replies || []).map((r) =>
                      r.id === tempId ? created : r
                    ),
                  }
                : c
            )
          );
        } else {
          setComments((prev) =>
            prev.map((c) => (c.id === tempId ? created : c))
          );
        }
        return created;
      } else {
        // fallback: simulate server-created id
        const created = {
          ...optimistic,
          id: `id-${Math.floor(Math.random() * 1e9)}`,
        };
        if (parentId) {
          setComments((prev) =>
            prev.map((c) =>
              c.id === parentId
                ? {
                    ...c,
                    replies: (c.replies || []).map((r) =>
                      r.id === tempId ? created : r
                    ),
                  }
                : c
            )
          );
        } else {
          setComments((prev) =>
            prev.map((c) => (c.id === tempId ? created : c))
          );
        }
        return created;
      }
    } catch (err) {
      console.error(err);
      // rollback optimistic update
      if (parentId) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === parentId
              ? {
                  ...c,
                  replies: (c.replies || []).filter((r) => r.id !== tempId),
                }
              : c
          )
        );
      } else {
        setComments((prev) => prev.filter((c) => c.id !== tempId));
      }
      setError("Failed to post comment. Please try again.");
      return null;
    } finally {
      setLoading(false);
      setEditId(null);
    }
  };

  // update either a comment or a reply depending on key format
  // key: 'comment:<id>' or 'reply:<parentId>:<replyId>'
  const handleUpdate = async (key, content) => {
    setError(null);
    const v = validate(content);
    if (v) {
      setError(v);
      return null;
    }

    setLoading(true);

    try {
      if (key.startsWith("comment:")) {
        const id = key.split(":")[1];
        // optimistic local update
        setComments((prev) =>
          prev.map((c) => (c.id === id ? { ...c, content } : c))
        );
        if (typeof handleUpdateComment === "function") {
          const updated = await handleUpdateComment({
            id,
            content,
            updatedAt: new Date().toISOString(),
          });
          setComments((prev) => prev.map((c) => (c.id === id ? updated : c)));
          return updated;
        }
      } else if (key.startsWith("reply:")) {
        const [, parentId, replyId] = key.split(":");
        setComments((prev) =>
          prev.map((c) => {
            if (c.id !== parentId) return c;
            return {
              ...c,
              replies: (c.replies || []).map((r) =>
                r.id === replyId ? { ...r, content } : r
              ),
            };
          })
        );

        if (typeof handleUpdateComment === "function") {
          const updated = await handleUpdateComment({
            id: replyId,
            parentId,
            content,
            updatedAt: new Date().toISOString(),
          });
          console.log("u[pppppppppppp", updated);

          setComments((prev) =>
            prev.map((c) => {
              if (c.id !== parentId) return c;
              return {
                ...c,
                replies: (c.replies || []).map((r) =>
                  r.id === replyId ? updated : r
                ),
              };
            })
          );
          return updated;
        }
      }
    } catch (err) {
      console.error(err);
      setError("Failed to update. Please try again.");
    } finally {
      setLoading(false);
      setEditId(null);
    }
    return null;
  };

  // delete comment or reply
  const handleDelete = async ({ id, parentId = null }) => {
    setError(null);
    setLoading(true);
    try {
      if (parentId) {
        // delete reply locally
        setComments((prev) =>
          prev.map((c) =>
            c.id === parentId
              ? { ...c, replies: (c.replies || []).filter((r) => r.id !== id) }
              : c
          )
        );
        if (typeof handleDeleteComment === "function") {
          await handleDeleteComment(id);
        }
      } else {
        setComments((prev) => prev.filter((c) => c.id !== id));
        if (typeof handleDeleteComment === "function") {
          await handleDeleteComment(id);
        }
      }
    } catch (err) {
      console.error(err);
      setError("Failed to delete. Please try again.");
    } finally {
      setLoading(false);
      // close any editors related
      setEditId(null);
      setReplyTo(null);
    }
  };
  console.log("editIdeditId", editId);

  return (
    <div className="space-y-4">
      {/* Composer */}
      {!editId && (
        <Card key={`${editId} card`}>
          <CardContent>
            <div className="flex gap-4">
              <div>
                <Avatar>
                  {auth?.avatarUrl ? (
                    <AvatarImage src={auth.avatarUrl} alt={auth.name} />
                  ) : (
                    <AvatarFallback>
                      {(auth?.name || "G").charAt(0)}
                    </AvatarFallback>
                  )}
                </Avatar>
              </div>

              <div className="flex-1">
                <Label className="text-xs">Comment</Label>
                <Textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Share your thoughts..."
                  rows={4}
                  className="mt-1"
                />

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      size="sm"
                      onClick={() => handleCreate({ content: newContent })}
                      disabled={loading}
                    >
                      {loading ? "Posting..." : "Post comment"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setNewContent("")}
                      disabled={loading || !newContent}
                    >
                      Clear
                    </Button>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {error ? (
                      <span className="text-red-600">{error}</span>
                    ) : (
                      <span>Be kind — be concise.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comments list */}
      <div className="space-y-3">
        {comments?.length ? (
          comments.map((c) => (
            <Card key={c.id || c.createdAt} className={cn("overflow-hidden")}>
              <CardContent className="flex gap-3 items-start">
                <Avatar>
                  {c.author?.avatarUrl ? (
                    <AvatarImage src={c.author.avatarUrl} alt={c.author.name} />
                  ) : (
                    <AvatarFallback>
                      {(c.author?.name || "G").charAt(0)}
                    </AvatarFallback>
                  )}
                </Avatar>

                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium">{c.author?.name}</div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div>
                        {c.createdAt
                          ? new Date(c.createdAt).toLocaleString()
                          : ""}
                      </div>

                      {/* actions */}
                      {editId !== `comment:${c.id}` ? (
                        <Button
                          size="sm"
                          onClick={() => setEditId(`comment:${c.id}`)}
                        >
                          Edit
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          type="button"
                          onClick={() =>
                            handleUpdate(
                              `comment:${c.id}`,
                              newContent || c.content
                            )
                          }
                        >
                          Update
                        </Button>
                      )}

                      {editId === `comment:${c.id}` ? (
                        <Button
                          size="sm"
                          type="button"
                          onClick={() => {
                            setEditId(null);
                            setNewContent("");
                          }}
                        >
                          Cancel
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleDelete({ id: c.id })}
                          disabled={editId === `comment:${c.id}`}
                        >
                          Delete
                        </Button>
                      )}

                      {/* Reply button */}
                      {replyTo !== c.id ? (
                        <Button
                          size="sm"
                          onClick={() => {
                            setReplyTo(c.id);
                            setNewContent("");
                          }}
                        >
                          Reply
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          type="button"
                          onClick={() => {
                            setReplyTo(null);
                            setNewContent("");
                          }}
                        >
                          Cancel Reply
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* content or editor for comment */}
                  {editId === `comment:${c.id}` ? (
                    <div className="flex-1 mt-2">
                      <Textarea
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                        placeholder="Edit your comment..."
                        rows={3}
                        className="mt-1"
                      />
                      <div className="mt-2 flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            handleUpdate(
                              `comment:${c.id}`,
                              newContent || c.content
                            )
                          }
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditId(null);
                            setNewContent("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "mt-2 text-sm",
                        c.optimistic ? "opacity-80 italic" : ""
                      )}
                    >
                      {c.content}
                    </div>
                  )}

                  {/* Reply composer inline */}
                  {replyTo === c.id && (
                    <div className="mt-3">
                      <Textarea
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                        placeholder="Write a reply..."
                        rows={3}
                        className="mt-1"
                      />

                      <div className="mt-2 flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            handleCreate({
                              content: newContent,
                              parentId: c.id,
                            })
                          }
                        >
                          Reply
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setReplyTo(null);
                            setNewContent("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* replies preview and actions */}
                  {c.replies?.length > 0 && (
                    <div className="mt-3 text-xs text-muted-foreground space-y-2">
                      {c.replies.map((r) => (
                        <div
                          key={r.id || r.createdAt}
                          className="flex items-start gap-2"
                        >
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <strong>{r.author?.name}</strong>
                                <div className="text-xs">
                                  {r.createdAt
                                    ? new Date(r.createdAt).toLocaleString()
                                    : ""}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {editId !== `reply:${c.id}:${r.id}` ? (
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setEditId(`reply:${c.id}:${r.id}`);
                                      setNewContent(r.content);
                                    }}
                                  >
                                    Edit
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    type="button"
                                    onClick={() =>
                                      handleUpdate(
                                        `reply:${c.id}:${r.id}`,
                                        newContent || r.content
                                      )
                                    }
                                  >
                                    Update
                                  </Button>
                                )}

                                {editId === `reply:${c.id}:${r.id}` ? (
                                  <Button
                                    size="sm"
                                    type="button"
                                    onClick={() => {
                                      setEditId(null);
                                      setNewContent("");
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      handleDelete({ id: r.id, parentId: c.id })
                                    }
                                  >
                                    Delete
                                  </Button>
                                )}
                              </div>
                            </div>

                            {editId === `reply:${c.id}:${r.id}` ? (
                              <div className="mt-1">
                                <Textarea
                                  value={newContent}
                                  onChange={(e) =>
                                    setNewContent(e.target.value)
                                  }
                                  rows={2}
                                />
                                <div className="mt-1 flex gap-2">
                                  <Button
                                    size="sm"
                                    type="button"
                                    onClick={() =>
                                      handleUpdate(
                                        `reply:${c.id}:${r.id}`,
                                        newContent || r.content
                                      )
                                    }
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setEditId(null);
                                      setNewContent("");
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="mt-1">{r.content}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-sm text-muted-foreground">
            No comments yet — be the first to share.
          </div>
        )}
      </div>
    </div>
  );
}
