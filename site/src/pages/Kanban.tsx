import React, { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Card, CardContent } from "@/components/ui/card"; // shadcn components
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { ChevronDown, GripVertical } from "lucide-react";
import { useParams } from "react-router-dom";
import { useFetchKanbanfromtarget, useUpdateKanban } from "@/lib/api/kanban";
import KanbanCardView from "./KanbanCardView";
import { useUsers } from "@/lib/api/user";

/**
 * Kanban page:
 * - Fetches epics / stories / tasks / bugs from /api/kanban/data
 * - Converts domain items into Kanban cards (default status TODO if none)
 * - Renders 4 static lanes: TODO, IN_PROGRESS, PENDING, COMPLETED
 * - Allows drag & drop within and across lanes using @dnd-kit
 * - Updates in local state and PATCHes /api/kanban/cards/:id with new status+position
 *
 * Requirements:
 * - Add real endpoints: GET /api/kanban/data -> { epics, stories, tasks, bugs }
 * - Add PATCH /api/kanban/cards/:id to persist card moves.
 * - Install dependencies: @dnd-kit/core, @dnd-kit/sortable, lucide-react, shadcn/ui
 */

type LinkType = "STORY" | "TASK" | "BUG";

enum KanbanStatus {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
}

interface DomainItem {
  id: number;
  name: string;
  description?: string | null;
  // optional status field on domain item — if absent, place into TODO
  status?: keyof typeof KanbanStatus | null;
  assigneeId?: number | null;
}

interface KanbanCard {
  id: string; // prefixed id to keep unique across types
  linkType: LinkType;
  domainId: number; // id of story/task/bug
  title: string;
  description?: string | null;
  status: KanbanStatus;
  position: number;
  assigneeId?: number | null;
}

const STATUS_ORDER: KanbanStatus[] = [
  KanbanStatus.TODO,
  KanbanStatus.IN_PROGRESS,
  KanbanStatus.PENDING,
  KanbanStatus.COMPLETED,
];

const STATUS_LABEL: Record<KanbanStatus, string> = {
  [KanbanStatus.TODO]: "To Do",
  [KanbanStatus.IN_PROGRESS]: "In Progress",
  [KanbanStatus.PENDING]: "Pending",
  [KanbanStatus.COMPLETED]: "Completed",
};

export default function KanbanPage() {
  const { id } = useParams<{ id: number }>();

  const [loading, setLoading] = useState(true);
  const [cardsByLane, setCardsByLane] = useState<Record<string, KanbanCard[]>>({
    [KanbanStatus.TODO]: [],
    [KanbanStatus.IN_PROGRESS]: [],
    [KanbanStatus.PENDING]: [],
    [KanbanStatus.COMPLETED]: [],
  });
  const updateKanban = useUpdateKanban();
  const fetchKanban = useFetchKanbanfromtarget();
  useEffect(() => {
    // fetch domain items from your API
    async function load() {
      setLoading(true);
      try {
        const { data, error } = await fetchKanban.mutateAsync({ epicId: id });
        if (error) throw new Error("Failed to fetch kanban data");
        console.log("dddddddddddddddddddd", data);

        const cardList: KanbanCard[] = [];

        // helper to push domain items into cardList
        const pushCards = (items: DomainItem[]) => {
          for (const it of items) {
            const status = (it.status as KanbanStatus) ?? KanbanStatus.TODO;
            const type = it.type;
            cardList.push({
              id: it.id,
              linkType: type,
              domainId: it.id,
              title: it.name,
              description: it.description ?? null,
              status,
              position: 0, // filled later
              assigneeId: it.assigneeId ?? null,
              ...it,
            });
          }
        };

        pushCards(data);

        // Group into lanes and assign positions if missing
        const grouped: Record<string, KanbanCard[]> = {
          [KanbanStatus.TODO]: [],
          [KanbanStatus.IN_PROGRESS]: [],
          [KanbanStatus.PENDING]: [],
          [KanbanStatus.COMPLETED]: [],
        };

        for (const c of cardList) grouped[c.status].push(c);

        // set positions: 1000,2000,... to allow insert-between using arithmetic
        for (const lane of STATUS_ORDER) {
          const arr = grouped[lane];
          arr.sort((a, b) => a.domainId - b.domainId); // deterministic
          for (let i = 0; i < arr.length; i++) {
            arr[i].position = (i + 1) * 1000;
          }
        }

        setCardsByLane(grouped);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const [activeCard, setActiveCard] = useState<KanbanCard | null>(null);
  function findCardById(cardId: string): KanbanCard | null {
    for (const lane of Object.keys(cardsByLane)) {
      const card = cardsByLane[lane].find((c) => c.id === cardId);
      if (card) return card;
    }
    return null;
  }
  function handleDragStart(event) {
    const activeId = String(event.active.id);
    // find the active card object from state (cardsByLane)
    const card = findCardById(activeId);
    setActiveCard(card ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    // clear overlay immediately (overlay will animate out because we use CSS)
    setActiveCard(null);

    if (!over) return;
    const cardId = active.id;

    // if dropped in a lane
    if (over.id.startsWith("lane-")) {
      const lane = over.id.replace("lane-", "");

      moveCardToLane(cardId, lane);
    }
  }
  async function moveCardToLane(cardId, newLane) {
    await setCardsByLane((prev) => {
      let card;
      const updated = { ...prev };

      // remove from old lane
      for (const lane of Object.keys(prev)) {
        const idx = updated[lane].findIndex((c) => c.id === cardId);
        if (idx !== -1) {
          card = updated[lane][idx];
          updated[lane].splice(idx, 1);
          break;
        }
      }

      // add to new lane
      card.status = newLane;
      updated[newLane].push(card);
      console.log("updatedupdated", card);
      updateKanban.mutateAsync(card);
      return updated;
    });
  }

  const { data: users, isLoading } = useUsers();
  console.log("userssss", users);
  if (loading) return <div className="p-8">Loading Kanban...</div>;

  return (
    <div className="p-6">
      <h6 className="text-xl font-bold mb-4">Team Kanban</h6>
      <DndContext
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveCard(null)}
        // onDragOver={handleDragOver} // keep if you use it
      >
        <div className="grid grid-cols-4 gap-4">
          {STATUS_ORDER.map((lane) => (
            <LaneColumn
              key={lane}
              lane={lane}
              cards={cardsByLane[lane]}
              users={users}
            />
          ))}
        </div>

        {/* DragOverlay renders the moving card under pointer — smooth and detached from document flow */}
        <DragOverlay dropAnimation={{ duration: 160, easing: "ease" }}>
          {activeCard ? <DraggableCardOverlay card={activeCard} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function LaneColumn({ lane, cards, users }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `lane-${lane}`,
  });
  return (
    <div
      ref={setNodeRef}
      className={`bg-gray-50 rounded p-3 h-[70vh] overflow-y-auto transition ${
        isOver ? "bg-amber-100" : ""
      }`}
    >
      <h2 className="font-semibold text-sm mb-3">{lane}</h2>

      <div className="space-y-2">
        {cards.map((card) => (
          <DraggableCard key={card.id} card={card} users={users} />
        ))}
      </div>
    </div>
  );
}
function DraggableCard({ card, users }: { card: KanbanCard }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: card.id,
    });

  // apply transform for pointer-follow fallback; DragOverlay handles the main drag visualization
  const style: React.CSSProperties = {
    transform: transform ? transform : undefined,
    transition: isDragging
      ? "none"
      : "transform 180ms ease, opacity 180ms ease",
    willChange: "transform, opacity",
    opacity: isDragging ? 0.4 : 1, // slightly fade the original while overlay is visible
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="transition-transform duration-200 ease-in-out"
      // keep attributes/listeners if you want the card itself to be draggable.
      // If you want handle-only dragging, DO NOT spread listeners here — attach to handle instead.
      {...attributes}
    >
      <Card className={`shadow-sm ${isDragging ? "scale-100" : ""}`}>
        <div
          className="flex items-center border-2 hover:cursor-pointer"
          aria-label="drag"
          {...listeners}
        ></div>
        <CardContent className="p-3 flex gap-3 items-start">
          <KanbanCardView card={card} users={users} />
        </CardContent>
      </Card>
    </div>
  );
}
function DraggableCardOverlay({ card }: { card: KanbanCard }) {
  return (
    <div className="pointer-events-none">
      <div className="transform-gpu scale-100">
        <Card className="shadow-2xl" style={{ width: 320 }}>
          <CardContent className="p-3 flex gap-3 items-start">
            <div className="flex items-center">
              <div className="p-1 rounded">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">{card.title}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {card.description}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
