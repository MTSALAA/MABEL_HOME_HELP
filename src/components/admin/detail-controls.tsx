"use client";

import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { AdminResult } from "@/lib/validation/admin";
import { runAction } from "./run-action";

/** Status dropdown that saves as soon as a value is picked. */
export function StatusSelect({
  value,
  options,
  action,
}: {
  value: string;
  options: { value: string; label: string }[];
  action: (status: string) => Promise<AdminResult>;
}) {
  const [pending, startTransition] = useTransition();
  const [current, setCurrent] = useState(value);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="status-select" className="text-sm font-bold text-forest-900">
        Status
      </label>
      <select
        id="status-select"
        value={current}
        disabled={pending}
        onChange={(event) => {
          const next = event.target.value;
          const previous = current;
          setCurrent(next);
          startTransition(async () => {
            const result = await runAction(() => action(next));
            if (result.ok) {
              toast.success("Status updated.");
            } else {
              setCurrent(previous);
              toast.error(result.error);
            }
          });
        }}
        className="h-10 rounded-md border border-input bg-white px-3 font-bold"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Private notes, visible only in the admin. */
export function NotesForm({
  initial,
  action,
}: {
  initial: string;
  action: (values: { notes: string }) => Promise<AdminResult>;
}) {
  const [pending, startTransition] = useTransition();
  const [notes, setNotes] = useState(initial);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          const result = await runAction(() => action({ notes }));
          if (result.ok) toast.success("Notes saved.");
          else toast.error(result.error);
        });
      }}
      className="flex flex-col gap-3"
    >
      <label htmlFor="admin-notes" className="text-sm font-bold text-forest-900">
        Private notes
      </label>
      <Textarea
        id="admin-notes"
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        rows={5}
        maxLength={5000}
        placeholder="Only admins can see these."
        className="bg-white"
      />
      <Button type="submit" variant="secondary" className="self-start" disabled={pending}>
        {pending ? "Saving…" : "Save notes"}
      </Button>
    </form>
  );
}

/** A button that asks for confirmation before running a Server Action. */
export function ConfirmAction({
  trigger,
  title,
  description,
  confirmLabel,
  destructive = true,
  successMessage,
  action,
}: {
  trigger: ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  successMessage?: string;
  // Actions that redirect resolve to nothing.
  action: () => Promise<AdminResult | void>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            className={destructive ? "bg-destructive text-white hover:bg-destructive/90" : undefined}
            onClick={(event) => {
              event.preventDefault();
              startTransition(async () => {
                const result = await runAction(() => action());
                if (result && !result.ok) {
                  toast.error(result.error);
                } else if (successMessage) {
                  toast.success(successMessage);
                }
                setOpen(false);
              });
            }}
          >
            {pending ? "Working…" : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
