import React, { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ExpandedState,
  type Table,
  type Row,
} from "@tanstack/react-table";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CustomCompFn<T> = (row: Row<T>, table: Table<T>) => React.ReactNode;

export type DataTablePaginationProps<TData> = {
  data: TData[];
  columns: ColumnDef<TData, any>[];
  /**
   * Either:
   *  - a single ReactNode shown for every expanded row, OR
   *  - a function (row, table) => ReactNode to render per-row expanded UI
   */
  customComp?: React.ReactNode | CustomCompFn<TData>;
  /** Optional function to return subrows for a given row (for nested tables) */
  getSubRows?: (row: TData) => TData[] | undefined;
  /** Optional initial page size */
  initialPageSize?: number;
};

export function DataTablePagination<TData extends object>({
  data,
  columns,
  customComp,
  getSubRows,
  initialPageSize = 10,
  onRowClick = () => {},
}: DataTablePaginationProps<TData>) {
  const [expanded, setExpanded] = useState<ExpandedState>({});
  console.log("tabledatadatadata", data);

  // Table instance (memoized)
  const table = useReactTable({
    data,
    columns,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSubRows: getSubRows ?? ((row: any) => row?.subRows ?? undefined),
    state: { expanded },
    onExpandedChange: setExpanded,
    initialState: { pagination: { pageSize: initialPageSize } },
    paginateExpandedRows: true,
  });

  const leafColumnCount = table.getAllLeafColumns().length;

  return (
    <div className="flex w-full flex-col gap-4">
      {/* TABLE */}
      <div className="rounded-md border ">
        <table className="w-full border-collapse text-sm overflow-auto">
          <thead className="bg-muted/60 text-muted-foreground">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b">
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left font-medium whitespace-nowrap"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody
            style={{
              overflow: "auto",
            }}
          >
            {table.getRowModel().rows.length === 0 && (
              <tr>
                <td
                  colSpan={leafColumnCount}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  No results.
                </td>
              </tr>
            )}

            {table.getRowModel().rows.map((row) => (
              <React.Fragment key={row.id}>
                <tr
                  className="border-b hover:bg-accent transition-colors"
                  onClick={() => onRowClick(row)}
                >
                  {row.getVisibleCells().map((cell) => {
                    // Indent name column by depth (optional): change condition to target your name column id
                    const isNameColumn =
                      cell.column.id === "name" ||
                      cell.column.id === "firstName";
                    const basePadding = 16;
                    const indentPerDepth = 20;
                    const paddingLeft = isNameColumn
                      ? basePadding + row.depth * indentPerDepth
                      : undefined;

                    return (
                      <td
                        key={cell.id}
                        className="px-4 py-3 align-top"
                        style={
                          paddingLeft !== undefined
                            ? { paddingLeft }
                            : undefined
                        }
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* Expanded row content — full-width row inserted below the main row */}
                {row.getIsExpanded() && (
                  <tr>
                    <td colSpan={leafColumnCount} className="p-0">
                      <div className="overflow-hidden transition-all duration-200">
                        <div className="p-4 border-t bg-gray-50">
                          {typeof customComp === "function"
                            ? (customComp as CustomCompFn<TData>)(row, table)
                            : customComp ?? null}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* FOOTER / PAGINATION */}
      <div className="flex flex-col gap-4 items-center justify-between md:flex-row md:gap-0 text-sm text-muted-foreground px-1">
        <div className="order-2 md:order-1">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected
        </div>

        <div className="order-3 md:order-2 flex items-center space-x-2">
          <p className="font-medium">Rows per page</p>

          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger className="h-8 w-[80px]">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>

            <SelectContent side="top">
              {[10, 20, 25, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="order-1 md:order-3 flex items-center space-x-2">
          <div className="text-sm mr-2 font-medium whitespace-nowrap">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="hidden md:flex size-8"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="hidden md:flex size-8"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
