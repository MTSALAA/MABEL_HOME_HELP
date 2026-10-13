import Link from "next/link";

export default function AdminNotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-3xl font-bold text-forest-900">Page not found</h1>
      <p className="max-w-md text-muted-foreground">
        This admin page doesn&apos;t exist, or the item was deleted.
      </p>
      <Link
        href="/admin"
        className="font-bold text-forest-700 underline underline-offset-4"
      >
        Back to the dashboard
      </Link>
    </main>
  );
}
