import * as React from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheckFilled,
  IconDotsVertical,
  IconGripVertical,
  IconLayoutColumns,
  IconLoader,
  IconPlus,
  IconTrendingUp,
} from "@tabler/icons-react";
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type Row,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { toast } from "sonner";
import { z } from "zod";

import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const schema = z.object({
  id: z.number(),
  header: z.string(),
  type: z.string(),
  status: z.string(),
  target: z.string(),
  limit: z.string(),
  reviewer: z.string(),
});

// Create a separate component for the drag handle
function DragHandle({ id }: { id: number }) {
  const { attributes, listeners } = useSortable({
    id,
  });

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent"
    >
      <IconGripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  );
}

const constructedColumns: ColumnDef<z.infer<typeof schema>>[] = [
  {
    id: "drag",
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original.id} />,
  },
];

function DraggableRow({
  row,
  onRowClick,
}: {
  row: Row<z.infer<typeof schema>>;
}) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  });

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
      onClick={(e) => {
        onRowClick(e, row);
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}
/* Replace your existing DataTable with this updated one */
export function DataTable({
  data: initialData,
  columns,
  controls = false,
  onRowClick,
}: {
  data: z.infer<typeof schema>[];
  columns: any;
}) {
  const [data, setData] = React.useState(() => initialData);
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [expandedIds, setExpandedIds] = React.useState<Set<number>>(
    () => new Set()
  );

  const sortableId = React.useId();
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  // Utility: group parents and immediate children so children follow parent
  const groupParentsAndChildren = React.useCallback(
    (flat: z.infer<typeof schema>[]) => {
      const byParent = new Map<number, z.infer<typeof schema>[]>();
      const parents: z.infer<typeof schema>[] = [];
      for (const item of flat) {
        const pid = item.parentTaskId ?? null;
        if (pid === null || typeof pid === "undefined") {
          parents.push(item);
        } else {
          if (!byParent.has(pid)) byParent.set(pid, []);
          byParent.get(pid)!.push(item);
        }
      }
      // Build grouped array: parent then its children
      const grouped: z.infer<typeof schema>[] = [];
      for (const p of parents) {
        grouped.push(p);
        const kids = byParent.get(p.id);
        if (kids && kids.length) grouped.push(...kids);
      }
      // Also include orphaned children (whose parents were missing) at end
      const placedIds = new Set(grouped.map((d) => d.id));
      for (const item of flat) {
        if (!placedIds.has(item.id)) grouped.push(item);
      }
      return grouped;
    },
    []
  );

  // When initialData changes, group it so children follow parent
  React.useEffect(() => {
    setData(groupParentsAndChildren(initialData));
  }, [initialData, groupParentsAndChildren]);

  // Top-level (parent) ids used for sortable context
  const parentIds = React.useMemo(
    () =>
      data
        .filter((d) => !d.parentTaskId)
        .map((d) => d.id) as UniqueIdentifier[],
    [data]
  );

  React.useEffect(() => {
    // keep table data in sync if initialData changes
    setData(groupParentsAndChildren(initialData));
  }, [initialData, groupParentsAndChildren]);

  // The table still consumes the full (grouped) data so we can reuse row renderers
  const table = useReactTable({
    data,
    columns: [...constructedColumns, ...columnsWithExpander(columns)],
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  // ---------------------------
  // helpers for expansion
  // ---------------------------
  const hasChildren = React.useCallback(
    (id: number) => data.some((d) => d.parentTaskId === id),
    [data]
  );

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const copy = new Set(prev);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      return copy;
    });
  };

  // ---------------------------
  // drag: move parent block (parent + its immediate children)
  // ---------------------------
  function moveParentBlock(
    arr: z.infer<typeof schema>[],
    fromId: number,
    toId: number
  ) {
    // find indices for from block
    const startIndex = arr.findIndex((x) => x.id === fromId);
    if (startIndex === -1) return arr;
    let endIndex = startIndex;
    // include contiguous immediate children that belong to fromId
    let i = startIndex + 1;
    while (i < arr.length && arr[i].parentTaskId === fromId) {
      endIndex = i;
      i++;
    }
    const block = arr.slice(startIndex, endIndex + 1);
    // remove block
    const without = arr.slice(0, startIndex).concat(arr.slice(endIndex + 1));
    // find insertion index for toId in the array without the moved block
    const insertAtParentIndex = without.findIndex((x) => x.id === toId);
    // If toId not found, return as-is
    if (insertAtParentIndex === -1) return arr;
    // insert block after the found parent (i.e., place block starting at that parent's position)
    const before = without.slice(0, insertAtParentIndex);
    const after = without.slice(insertAtParentIndex);
    return [...before, ...block, ...after];
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!active || !over || active.id === over.id) return;

    // Only handle dragging when active and over are parent ids
    const activeId = Number(active.id);
    const overId = Number(over.id);
    if (!parentIds.includes(activeId) || !parentIds.includes(overId)) {
      return;
    }

    setData((prev) => {
      return moveParentBlock(prev, activeId, overId);
    });
  }

  // ---------------------------
  // render: we'll iterate parent rows and inject child rows when expanded
  // ---------------------------
  return (
    <Tabs
      defaultValue="outline"
      className="w-full flex-col justify-start gap-6"
    >
      {controls && (
        <div className="flex items-center justify-between px-4 lg:px-6">
          {/* ... same controls as before ... */}
          {/* I'm leaving your original controls unchanged for brevity */}
          <Label htmlFor="view-selector" className="sr-only">
            View
          </Label>
          <Select defaultValue="outline">
            <SelectTrigger
              className="flex w-fit @4xl/main:hidden"
              size="sm"
              id="view-selector"
            >
              <SelectValue placeholder="Select a view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="outline">Outline</SelectItem>
              <SelectItem value="past-performance">Past Performance</SelectItem>
              <SelectItem value="key-personnel">Key Personnel</SelectItem>
              <SelectItem value="focus-documents">Focus Documents</SelectItem>
            </SelectContent>
          </Select>
          {/* ... rest unchanged ... */}
        </div>
      )}

      <TabsContent
        value="outline"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="overflow-hidden rounded-lg border">
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}
          >
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id} colSpan={header.colSpan}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>

              <TableBody className="**:data-[slot=table-cell]:first:w-8">
                {/* Render parent rows (only rows with no parentTaskId) */}
                {data.filter((d) => !d.parentTaskId).length ? (
                  <SortableContext
                    items={parentIds}
                    strategy={verticalListSortingStrategy}
                  >
                    {data
                      .filter((parent) => !parent.parentTaskId)
                      .map((parent) => {
                        // get the table row object for the parent
                        const parentRow = table
                          .getRowModel()
                          .rows.find((r) => r.original.id === parent.id)!;

                        // render parent draggable row
                        return (
                          <React.Fragment key={parent.id}>
                            <DraggableRow
                              onRowClick={onRowClick}
                              row={parentRow}
                            />
                            {expandedIds.has(parent.id) &&
                              // render immediate children (non-draggable) as separate rows
                              data
                                .filter(
                                  (child) => child.parentTaskId === parent.id
                                )
                                .map((child) => {
                                  const childRow = table
                                    .getRowModel()
                                    .rows.find(
                                      (r) => r.original.id === child.id
                                    );
                                  if (!childRow) return null;
                                  return (
                                    <TableRow
                                      key={child.id}
                                      className="bg-muted/3"
                                      onClick={(e) => {
                                        onRowClick(e, child);
                                      }}
                                    >
                                      {childRow
                                        .getVisibleCells()
                                        .map((cell) => (
                                          <TableCell key={cell.id}>
                                            {/* Indent the first cell so children look nested */}
                                            {cell.column.id === "drag" ? (
                                              // placeholder where drag handle would be for child
                                              <div style={{ width: 32 }} />
                                            ) : (
                                              <div
                                                className={
                                                  cell.column.id === "header"
                                                    ? "pl-6"
                                                    : ""
                                                }
                                              >
                                                {flexRender(
                                                  cell.column.columnDef.cell,
                                                  cell.getContext()
                                                )}
                                              </div>
                                            )}
                                          </TableCell>
                                        ))}
                                    </TableRow>
                                  );
                                })}
                          </React.Fragment>
                        );
                      })}
                  </SortableContext>
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length + 1}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>

        {/* Pagination / footer UI unchanged (you can keep yours as-is) */}
        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Rows per page
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              {/* previous / next buttons unchanged */}
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <IconChevronsLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <IconChevronLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <IconChevronRight />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <IconChevronsRight />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>

      {/* keep your other TabsContent panes unchanged */}
      <TabsContent
        value="past-performance"
        className="flex flex-col px-4 lg:px-6"
      >
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
      <TabsContent value="key-personnel" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
      <TabsContent
        value="focus-documents"
        className="flex flex-col px-4 lg:px-6"
      >
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
    </Tabs>
  );

  // ---------------------------
  // helpers to inject an expander column before user columns
  // ---------------------------
  function columnsWithExpander(userColumns: any) {
    // add an expander column at the beginning (id: 'expander')
    const expanderCol: ColumnDef<z.infer<typeof schema>> = {
      id: "expander",
      header: () => null,
      cell: ({ row }) => {
        const id = row.original.id;
        const childrenExist = hasChildren(id);
        if (!childrenExist) return null;
        const isOpen = expandedIds.has(id);
        return (
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand(id);
            }}
            className="p-0"
            aria-label={isOpen ? "Collapse subtasks" : "Expand subtasks"}
          >
            {isOpen ? <IconChevronDown /> : <IconChevronRight />}
          </Button>
        );
      },
    };

    // return as array
    return [expanderCol, ...userColumns];
  }
}
