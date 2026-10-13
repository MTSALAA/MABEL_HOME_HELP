"use client";

import { DownloadIcon, SearchIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AdminResult } from "@/lib/validation/admin";
import { runAction } from "./run-action";

export type ToolbarFilter = {
  param: string;
  label: string;
  /** Label of the empty option, e.g. "All open". */
  allLabel: string;
  options: { value: string; label: string }[];
};

type ExportAction = () => Promise<AdminResult<{ csv?: string; filename?: string }>>;

/**
 * Search box, filters and CSV export for an admin list. All state lives in
 * the URL, so a filtered view can be bookmarked or shared.
 */
export function ListToolbar({
  searchPlaceholder,
  filters,
  exportAction,
}: {
  searchPlaceholder: string;
  filters: ToolbarFilter[];
  exportAction: ExportAction;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [exporting, startExport] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function setParam(name: string, value: string) {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(name, value);
    else params.delete(name);
    params.delete("page");
    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  }

  function onSearch(value: string) {
    setQuery(value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setParam("q", value.trim()), 300);
  }

  function onExport() {
    startExport(async () => {
      const result = await runAction(() => exportAction());
      if (!result.ok || !result.csv) {
        toast.error(result.ok ? "Nothing to export." : result.error);
        return;
      }
      const url = URL.createObjectURL(
        new Blob([result.csv], { type: "text/csv;charset=utf-8" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = result.filename ?? "export.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end">
      <div className="relative flex-1">
        <label htmlFor="list-search" className="sr-only">
          Search
        </label>
        <SearchIcon
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted"
          aria-hidden="true"
        />
        <Input
          id="list-search"
          type="search"
          value={query}
          onChange={(event) => onSearch(event.target.value)}
          placeholder={searchPlaceholder}
          className="h-10 bg-white pl-9"
        />
      </div>
      {filters.map((filter) => (
        <div key={filter.param} className="flex flex-col gap-1">
          <label
            htmlFor={`filter-${filter.param}`}
            className="text-xs font-bold text-ink-muted"
          >
            {filter.label}
          </label>
          <select
            id={`filter-${filter.param}`}
            value={searchParams.get(filter.param) ?? ""}
            onChange={(event) => setParam(filter.param, event.target.value)}
            className="h-10 min-w-40 rounded-md border border-input bg-white px-3 text-sm font-bold"
          >
            <option value="">{filter.allLabel}</option>
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        className="h-10 bg-white"
        onClick={onExport}
        disabled={exporting}
      >
        <DownloadIcon aria-hidden="true" />
        {exporting ? "Exporting…" : "Export CSV"}
      </Button>
    </div>
  );
}
