export function CodeCard({ title, code }: { title: string; code: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xl shadow-black/10 dark:shadow-black/40">
      <div className="flex items-center gap-1.5 border-border border-b bg-muted/50 px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-red-500/70" />
        <span className="size-2.5 rounded-full bg-yellow-500/70" />
        <span className="size-2.5 rounded-full bg-green-500/70" />
        <span className="ml-2 font-mono text-muted-foreground text-xs">
          {title}
        </span>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[12.5px] text-card-foreground leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}
