"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, type ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type DataColumn = {
  id: string;
  header: string;
  /** Database column to sort by; omit for columns that can't be sorted. */
  sortKey?: string;
  className?: string;
};

export type DataRow = {
  id: string;
  /** Detail page opened when the row is clicked. */
  href?: string;
  cells: Record<string, ReactNode>;
};

/**
 * Table for the admin inboxes. Rows are filtered, sorted and paginated on the
 * server; sorting here only rewrites the ?sort= URL parameter.
 */
export function DataTable({
  columns,
  rows,
  sort,
  emptyMessage,
}: {
  columns: DataColumn[];
  rows: DataRow[];
  sort: { field: string; direction: "asc" | "desc" };
  emptyMessage: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const columnDefs = useMemo<ColumnDef<DataRow>[]>(
    () =>
      columns.map((column) => ({
        id: column.id,
        header: column.header,
        accessorFn: (row) => row.cells[column.id],
        cell: (info) => info.getValue() as ReactNode,
        enableSorting: Boolean(column.sortKey),
        meta: column,
      })),
    [columns],
  );

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table manages its own memoisation.
  const table = useReactTable({
    data: rows,
    columns: columnDefs,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    manualSorting: true,
    manualPagination: true,
  });

  function toggleSort(sortKey: string) {
    const params = new URLSearchParams(searchParams);
    const nextDirection =
      sort.field === sortKey && sort.direction === "desc" ? "asc" : "desc";
    params.set("sort", `${sortKey}.${nextDirection}`);
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="overflow-hidden rounded-xl border border-cream-300 bg-white shadow-soft">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id} className="bg-cream-100 hover:bg-cream-100">
              {group.headers.map((header) => {
                const column = header.column.columnDef.meta as DataColumn;
                const active = column.sortKey !== undefined && sort.field === column.sortKey;
                return (
                  <TableHead
                    key={header.id}
                    aria-sort={
                      active
                        ? sort.direction === "asc"
                          ? "ascending"
                          : "descending"
                        : undefined
                    }
                    className={cn("h-11 font-bold text-forest-900", column.className)}
                  >
                    {column.sortKey ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(column.sortKey as string)}
                        className="-ml-2 inline-flex h-9 items-center gap-1 rounded-md px-2 hover:bg-cream-200"
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {active ? (
                          sort.direction === "asc" ? (
                            <ArrowUpIcon className="size-4" aria-hidden="true" />
                          ) : (
                            <ArrowDownIcon className="size-4" aria-hidden="true" />
                          )
                        ) : (
                          <ChevronsUpDownIcon
                            className="size-4 text-ink-muted/60"
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={columns.length}
                className="h-32 text-center text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => {
              const href = row.original.href;
              return (
                <TableRow
                  key={row.id}
                  // The name in each row is a real link (keyboard and screen
                  // readers); clicking anywhere else on the row is a mouse
                  // shortcut to the same page.
                  onClick={
                    href
                      ? (event) => {
                          if ((event.target as HTMLElement).closest("a, button")) return;
                          router.push(href);
                        }
                      : undefined
                  }
                  className={cn(href && "cursor-pointer")}
                >
                  {row.getVisibleCells().map((cell) => {
                    const column = cell.column.columnDef.meta as DataColumn;
                    return (
                      <TableCell key={cell.id} className={cn("py-3", column.className)}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
