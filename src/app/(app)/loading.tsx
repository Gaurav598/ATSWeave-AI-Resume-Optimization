export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12 sm:px-8">
      <div className="h-8 w-48 rounded-full bg-muted" />
      <div className="mt-4 h-12 w-96 max-w-full rounded-2xl bg-muted" />
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <div className="aspect-[8.5/11] rounded-md bg-muted shimmer" />
        <div className="aspect-[8.5/11] rounded-md bg-muted shimmer" />
        <div className="aspect-[8.5/11] rounded-md bg-muted shimmer" />
      </div>
    </div>
  );
}
