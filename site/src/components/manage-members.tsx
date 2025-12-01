"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useDeleteMember, useFetchmembers } from "@/lib/api/member";

// TeamMembersList.tsx
import React, { useEffect, useState } from "react";
import { Trash2 } from "lucide-react"; // lucide used by shadcn/ui
import clsx from "clsx";

export function ManageMembers({ teamId }) {
  const { data, error } = useFetchmembers(teamId);
  return <TeamMembersList key={"members-list"} initialMembers={data} />;
}

type Team = {
  id: number;
  name: string;
  about?: string;
  createdAt?: string;
  creatorId?: number;
};

type Member = {
  id: number;
  teamId: number;
  userId?: number | null;
  email: string;
  name?: string | null;
  role: string;
  addedAt?: string;
  addedById?: number | null;
  team?: Team | null;
};

type Props = {
  initialMembers: Member[];
  // optional callback if parent wants to react to deletion
  onDeleted?: (memberId: number) => void;
};

export default function TeamMembersList({ initialMembers = [] }: Props) {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [loadingIds, setLoadingIds] = useState<Record<number, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const deleteMember = useDeleteMember();
  useEffect(() => {
    setMembers(initialMembers);
  }, [initialMembers]);
  async function handleDelete(member: Member) {
    const confirmMsg = `Remove ${member.name ?? member.email} from "${
      member.team?.name ?? ""
    }"?`;
    if (!confirm(confirmMsg)) return;

    setError(null);
    setLoadingIds((s) => ({ ...s, [member.id]: true }));

    // optimistic remove
    const prev = members;
    setMembers((m) => m.filter((x) => x.id !== member.id));
    try {
      // call your API — adjust endpoint to your server
      // we assume route: DELETE /api/teams/:teamId/members/:memberId
      const { data } = await deleteMember.mutateAsync({ memberId: member.id });
      if (data) {
      }
    } catch (e: any) {
      // revert optimistic change
      setMembers(prev);
      setError(e?.message || "Failed to delete member");
    } finally {
      setLoadingIds((s) => {
        const copy = { ...s };
        delete copy[member.id];
        return copy;
      });
    }
  }

  if (members.length === 0) {
    return <div className="p-6 text-sm text-slate-400">No members found.</div>;
  }

  return (
    <div className="space-y-3">
      {error && <div className="text-sm text-destructive px-2">{error}</div>}

      {members.map((m) => (
        <div
          key={m.id}
          className="flex items-center justify-between gap-4 p-3 bg-popover rounded-md border border-slate-700"
        >
          <div className="flex items-center gap-3">
            {/* avatar (initials) */}
            <div
              className={clsx(
                "flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium",
                m.userId
                  ? "bg-sky-600 text-white"
                  : "bg-slate-700 text-slate-100"
              )}
            >
              {(m.name || m.email)
                .split(" ")
                .map((s) => s[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </div>

            <div className="min-w-0">
              <div className="truncate font-medium">
                {m.name ?? m.email}
                <span className="ml-2 text-xs text-slate-400">· {m.role}</span>
              </div>
              <div className="text-xs text-slate-400 truncate">{m.email}</div>
              {m.team && (
                <div className="text-xs text-slate-400 truncate mt-0.5">
                  Team: {m.team.name}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(m)}
              disabled={Boolean(loadingIds[m.id])}
              className="hover:bg-red-600/10"
              title={`Remove ${m.name ?? m.email}`}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
