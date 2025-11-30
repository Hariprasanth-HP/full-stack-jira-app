/**
 * v0 by Vercel.
 * @see https://v0.app/t/b8nBtqXPupB
 * Documentation: https://v0.app/docs#integrating-generated-code-into-your-nextjs-app
 */
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useCreatecomment } from "@/lib/api/comment";
import { useState } from "react";

export default function CommentComp({
  userId,
  taskId,
  parentId,
  comments,
  setComments,
}: {
  userId?: number;
  taskId?: number;
  parentId?: number;
  comments?: any[];
  setComments?: (comments: any[]) => void;
}) {
  const createComment = useCreatecomment();
  const [description, setDescription] = useState("");
  const [descriptionError, setDescriptionError] = useState("");
  const handleCreateComment = async () => {
    try {
      if (!description.trim()) {
        setDescriptionError("Comment description cannot be empty.");
        return;
      }
      setDescriptionError("");

      const { data } = await createComment.mutateAsync?.({
        description,
        userId: userId!,
        taskId: taskId!,
        parentId: parentId,
      });
      if (data) {
        setComments?.([...(comments || []), data]);
        setDescription("");
      }
      // handle success (e.g., show a toast, clear form, etc.)
    } catch (error) {
      // handle error (e.g., show error message)
    }
  };
  console.log("commentsss", comments);

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-8 h-[100%]">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Comments</h2>
        <div className="grid gap-2">
          <Textarea
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Write your comment..."
            className="resize-none rounded-md border border-input bg-background p-3 text-sm shadow-sm"
          />
          {descriptionError && (
            <p className="text-sm text-destructive">{descriptionError}</p>
          )}
        </div>
        <div className="flex justify-end">
          <Button
            className="justify-center"
            onClick={() => {
              handleCreateComment();
            }}
          >
            Submit
          </Button>
        </div>
      </div>
      <div className="space-y-6 overflow-auto h-[50%] max-h-[50%]">
        {comments && comments.length > 0 ? (
          <>
            {comments.map((comment) => {
              return (
                <div className="flex items-start gap-4">
                  <Avatar className="h-10 w-10 border">
                    <AvatarImage
                      src="/placeholder-user.jpg"
                      alt={comment.user.email}
                    />
                    <AvatarFallback>
                      {comment.user.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="grid gap-1.5">
                    <div className="flex items-center gap-2">
                      <div className="font-medium">{comment.user.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      {comment.description}
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No comments yet.</p>
        )}
      </div>
    </div>
  );
}
