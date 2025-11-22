import React from "react";
import { useNavigate } from "react-router-dom";

type Priority = "LOW" | "MEDIUM" | "HIGH" | string;

type Card = {
  id: number;
  status: string;
  position: number;
  type?: string;
  domainId?: number;
  title: string;
  description?: string;
  priority?: Priority;
  assigneeId?: number | null;
};

type User = {
  id: number;
  name?: string | null;
  email?: string;
  avatarUrl?: string | null;
};

const priorityStyles: Record<Priority, { bg: string; text: string }> = {
  HIGH: { bg: "bg-red-100", text: "text-red-700" },
  MEDIUM: { bg: "bg-yellow-100", text: "text-yellow-700" },
  LOW: { bg: "bg-green-100", text: "text-green-700" },
};

// fallback style
priorityStyles["default"] = { bg: "bg-gray-100", text: "text-gray-700" };

export default function KanbanCardView({
  card,
  users = {},
}: {
  card: Card;
  users?: Record<number, User>;
}) {
  console.log("cardcard", card);
  const navigate = useNavigate();
  const p = (card.priority ?? "default") as Priority;
  const style = priorityStyles[p] ?? priorityStyles["default"];
  const assignee = card.assigneeId ? users[Number(card.assigneeId)] : null;

  return (
    <div
      className="border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-150 bg-white overflow-hidden"
      onClick={() => navigate(`/details/${card.type}/${card.domainId}`)}
    >
      {/* Priority banner */}
      <div className={`h-1 ${style.bg}`} aria-hidden />

      <div className="p-4 flex gap-3">
        {/* Left: avatar / icon */}
        <div className="flex-shrink-0">
          {assignee ? (
            <img
              src={assignee.avatarUrl ?? `/api/avatar/${assignee.id}`}
              alt={assignee.name ?? assignee.email ?? "Assignee"}
              className="w-10 h-10 rounded-full object-cover shadow-sm"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
              {/* simple user icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 11c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 14c-4 0-6 2-6 4v1h12v-1c0-2-2-4-6-4z"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-slate-900 truncate">
                {card.title}
              </div>
              <div className="flex items-center gap-2 mt-1">
                {/* Priority pill */}
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}
                >
                  <span className="sr-only">Priority</span>
                  {card.priority ?? "No priority"}
                </span>

                {/* Type badge */}
                {card.type && (
                  <span className="text-xs text-muted-foreground bg-gray-100 px-2 py-0.5 rounded-full">
                    {card.type}
                  </span>
                )}

                {/* Position */}
                <span className="ml-2 text-xs text-gray-500">
                  #{card.position}
                </span>
              </div>
            </div>

            {/* Right: assignee name */}
            <div className="text-right min-w-[90px]">
              <div className="text-xs text-gray-500">Assignee</div>
              <div className="text-sm font-medium text-slate-800 truncate">
                {assignee ? assignee.name ?? assignee.email : "Unassigned"}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="text-sm text-gray-600 mt-3">
            {card.description ? (
              <p className="line-clamp-3">{card.description}</p>
            ) : (
              <p className="text-xs italic text-gray-400">No description</p>
            )}
          </div>
        </div>
      </div>

      {/* Footer: actions / metadata */}
      <div className="px-4 py-2 border-t bg-white flex items-center justify-between text-xs text-gray-500">
        <div>Domain: {card.domainId ?? "-"}</div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 text-gray-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 7h18M6 12h12M4 17h16"
              />
            </svg>
            <span>{card.id}</span>
          </div>
          <div>
            {/* placeholder for more controls (comments, attachments) */}
          </div>
        </div>
      </div>
    </div>
  );
}
