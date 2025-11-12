// src/components/CommentForm.tsx
import type { FormMode } from "@/types/api";
import React, { useState } from "react";

export default function CommentForm({
  onSuccess,
  mode,
  comment,
  setForm,
  index,
}: CommentFormProps) {
  const {
    targetType = "",
    targetId = "",
    authorId = "",
    parentId = "",
    content: contentData,
  } = comment;
  const [content, setContent] = useState(contentData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await createComment({
        content,
        authorId,
        targetType,
        targetId,
        parentId,
      });
      setContent("");
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || "Failed to create comment");
    } finally {
      setLoading(false);
    }
  }
  const handleBlur = (e) => {
    setForm((prev) => {
      console.log("prrrrrrrrrrrr", prev);
      return {
        ...prev,
        comment: { ...prev.comment, content: e.target.value },
      };
    });
  };
  console.log("commeeeene", comment);

  return (
    <form
      onSubmit={handleSubmit}
      className="border rounded-md p-3 bg-white shadow-sm flex flex-col gap-2"
    >
      <textarea
        className="w-full border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Write a comment..."
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
        }}
        onBlur={handleBlur}
        rows={3}
        required
      />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {mode !== "create" && (
        <button
          type="submit"
          disabled={loading}
          className="self-end px-4 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Posting..." : "Post Comment"}
        </button>
      )}
    </form>
  );
}

export interface CommentFormProps {
  mode: FormMode;
  comment: any;
  onSuccess?: () => void;
}
