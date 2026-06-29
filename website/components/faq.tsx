import { ChevronDown } from 'lucide-react';

/**
 * Accessible FAQ accordion built on native <details>/<summary> — open/close
 * works without JavaScript and each item is keyboard-operable for free.
 */
export function Faq({
  items,
}: {
  items: { question: string; answer: string }[];
}) {
  return (
    <div className="divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/70 bg-card/40">
      {items.map((item) => (
        <details className="group px-5" key={item.question}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-medium text-foreground [&::-webkit-details-marker]:hidden">
            {item.question}
            <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <p className="pb-5 text-muted-foreground text-sm leading-relaxed">
            {item.answer}
          </p>
        </details>
      ))}
    </div>
  );
}
