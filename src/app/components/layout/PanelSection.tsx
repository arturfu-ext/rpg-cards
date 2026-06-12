import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Titled section wrapper used by the side panels for visual consistency
 * (replaces the legacy bootstrap accordion panel chrome).
 */
export function PanelSection({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('flex flex-col gap-3 rounded-lg border bg-card p-3', className)}>
      <h2 className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
        {title}
      </h2>
      {children}
    </section>
  );
}
