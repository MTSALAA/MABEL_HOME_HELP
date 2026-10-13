"use client";

import { useId, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

function FieldFrame({
  id,
  label,
  help,
  error,
  children,
  className,
}: {
  id: string;
  label: string;
  help?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {help ? (
        <p id={`${id}-help`} className="text-sm text-muted-foreground">
          {help}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="text-sm font-bold text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type Shared = { label: string; help?: string; error?: string; frameClassName?: string };

// `ref` arrives as a normal prop (React 19), so react-hook-form's register()
// can be spread straight onto these.
export function TextField({
  label,
  help,
  error,
  frameClassName,
  ...props
}: Shared & React.ComponentProps<"input">) {
  const id = useId();
  return (
    <FieldFrame id={id} label={label} help={help} error={error} className={frameClassName}>
      <Input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={
          [error ? `${id}-error` : null, help ? `${id}-help` : null]
            .filter(Boolean)
            .join(" ") || undefined
        }
        className="h-10 bg-white"
        {...props}
      />
    </FieldFrame>
  );
}

export function TextAreaField({
  label,
  help,
  error,
  frameClassName,
  ...props
}: Shared & React.ComponentProps<"textarea">) {
  const id = useId();
  return (
    <FieldFrame id={id} label={label} help={help} error={error} className={frameClassName}>
      <Textarea
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={
          [error ? `${id}-error` : null, help ? `${id}-help` : null]
            .filter(Boolean)
            .join(" ") || undefined
        }
        className="bg-white"
        {...props}
      />
    </FieldFrame>
  );
}

export function SwitchField({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-cream-300 bg-cream-50 p-4">
      <div>
        <Label htmlFor={id} className="text-base">
          {label}
        </Label>
        {description ? (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

/**
 * English and French versions of the same fields, as tabs. Both panels stay
 * mounted so values and validation errors are never lost when switching, and
 * a dot marks a language that has an error.
 */
export function LanguageTabs({
  english,
  french,
  englishHasError = false,
  frenchHasError = false,
}: {
  english: ReactNode;
  french: ReactNode;
  englishHasError?: boolean;
  frenchHasError?: boolean;
}) {
  const dot = (
    <span className="size-2 rounded-full bg-danger" aria-label="has errors" role="img" />
  );
  return (
    <Tabs defaultValue="en">
      <TabsList>
        <TabsTrigger value="en" className="gap-2 px-4 text-ink-muted data-[state=active]:text-forest-900">
          English {englishHasError ? dot : null}
        </TabsTrigger>
        <TabsTrigger value="fr" className="gap-2 px-4 text-ink-muted data-[state=active]:text-forest-900">
          Français {frenchHasError ? dot : null}
        </TabsTrigger>
      </TabsList>
      <TabsContent
        value="en"
        forceMount
        className="mt-4 flex flex-col gap-4 data-[state=inactive]:hidden"
      >
        {english}
      </TabsContent>
      <TabsContent
        value="fr"
        forceMount
        className="mt-4 flex flex-col gap-4 data-[state=inactive]:hidden"
      >
        <p className="text-sm text-muted-foreground">
          Anything left empty here is shown in English on the French site.
        </p>
        {french}
      </TabsContent>
    </Tabs>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="rounded-lg border border-danger bg-danger-soft p-3 text-sm font-bold text-danger"
    >
      {message}
    </p>
  );
}
