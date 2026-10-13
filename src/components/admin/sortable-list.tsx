"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVerticalIcon, PencilIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useId, useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { AdminResult } from "@/lib/validation/admin";
import { cn } from "@/lib/utils";
import { useRunAction } from "./run-action";

export type SortableItem = {
  id: string;
  title: string;
  subtitle?: string;
  editHref: string;
  /** Path of a small image shown before the title. */
  thumbnail?: string;
  badges?: string[];
  flags: { key: string; label: string; value: boolean }[];
};

type ReorderAction = (orderedIds: string[]) => Promise<AdminResult>;
type FlagAction = (id: string, key: string, value: boolean) => Promise<AdminResult>;

function Row({
  item,
  flagAction,
}: {
  item: SortableItem;
  flagAction: FlagAction;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });
  const t = useTranslations("Admin.Common");
  const runAction = useRunAction();
  const [flags, setFlags] = useState(item.flags);
  const [syncedFlags, setSyncedFlags] = useState(item.flags);
  const [pending, startTransition] = useTransition();

  // Fresh data from the server replaces the optimistic local copy.
  if (item.flags !== syncedFlags) {
    setSyncedFlags(item.flags);
    setFlags(item.flags);
  }

  function toggle(key: string, value: boolean) {
    const previous = flags;
    setFlags(flags.map((flag) => (flag.key === key ? { ...flag, value } : flag)));
    startTransition(async () => {
      const result = await runAction(() => flagAction(item.id, key, value));
      if (!result.ok) {
        setFlags(previous);
        toast.error(result.error);
      }
    });
  }

  const inactive = flags.find((flag) => flag.key === "isActive")?.value === false;

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-cream-300 bg-white p-3 shadow-soft sm:flex-row sm:items-center",
        isDragging && "relative z-10 shadow-lift",
        inactive && "bg-cream-100",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          aria-label={t("reorder", { title: item.title })}
          className="flex size-10 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-ink-muted hover:bg-cream-100 active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVerticalIcon className="size-5" aria-hidden="true" />
        </button>
        {item.thumbnail ? (
          // Either a local illustration or a photo on any https host.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.thumbnail}
            alt=""
            width={48}
            height={48}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="size-12 shrink-0 rounded-lg bg-cream-100 object-cover"
          />
        ) : null}
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 font-bold text-forest-900">
            <span className="truncate">{item.title}</span>
            {item.badges?.map((badge) => (
              <Badge key={badge} variant="secondary" className="font-bold">
                {badge}
              </Badge>
            ))}
          </p>
          {item.subtitle ? (
            <p className="truncate text-sm text-muted-foreground">{item.subtitle}</p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pl-13 sm:pl-0">
        {flags.map((flag) => (
          <FlagSwitch
            key={flag.key}
            label={flag.label}
            checked={flag.value}
            disabled={pending}
            onChange={(value) => toggle(flag.key, value)}
          />
        ))}
        <Button asChild variant="outline" size="sm">
          <Link href={item.editHref}>
            <PencilIcon aria-hidden="true" />
            {t("edit")}
          </Link>
        </Button>
      </div>
    </li>
  );
}

function FlagSwitch({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
}) {
  const id = useId();
  return (
    <span className="flex items-center gap-2">
      <Switch id={id} checked={checked} disabled={disabled} onCheckedChange={onChange} />
      <label htmlFor={id} className="text-sm font-bold">
        {label}
      </label>
    </span>
  );
}

/**
 * Drag-to-reorder list with inline on/off switches. Works with a mouse, touch
 * and the keyboard (focus the handle, Space to pick up, arrows to move).
 */
export function SortableList({
  items,
  reorderAction,
  flagAction,
  emptyMessage,
}: {
  items: SortableItem[];
  reorderAction: ReorderAction;
  flagAction: FlagAction;
  emptyMessage: string;
}) {
  const t = useTranslations("Admin.Common");
  const runAction = useRunAction();
  const [ordered, setOrdered] = useState(items);
  const [syncedItems, setSyncedItems] = useState(items);
  const [, startTransition] = useTransition();
  const dndId = useId();

  // Fresh data from the server replaces the optimistic local order.
  if (items !== syncedItems) {
    setSyncedItems(items);
    setOrdered(items);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const from = ordered.findIndex((item) => item.id === active.id);
    const to = ordered.findIndex((item) => item.id === over.id);
    if (from < 0 || to < 0) return;

    const previous = ordered;
    const next = arrayMove(ordered, from, to);
    setOrdered(next);
    startTransition(async () => {
      const result = await runAction(() => reorderAction(next.map((item) => item.id)));
      if (result.ok) {
        toast.success(t("orderSaved"));
      } else {
        setOrdered(previous);
        toast.error(result.error);
      }
    });
  }

  if (ordered.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-cream-300 bg-white p-8 text-center text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext
        items={ordered.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="flex flex-col gap-2">
          {ordered.map((item) => (
            <Row key={item.id} item={item} flagAction={flagAction} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
