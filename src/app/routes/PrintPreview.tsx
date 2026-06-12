/**
 * In-app replacement for the legacy output.html window: renders the full
 * print layout (card_pages_generate_html) and prints via window.print().
 * The post-render passes mirror output.js receiveMessage: crop-mark
 * visibility and the fix-icon-size pass.
 */
import { useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router';
import { browserEngineContext } from '@/app/render/engine-context';
import { sanitizePages } from '@/app/render/sanitize';
import { useDeckStore } from '@/app/store/deck-store';
import { Button } from '@/components/ui/button';
import { cropMarks } from '@/engine/crop-marks';
import { process_card_generated_front } from '@/engine/fix-icon-size';
import { card_pages_generate_html } from '@/engine/pages';
import '@/styles/print-preview.css';

export function PrintPreview() {
  const cards = useDeckStore((s) => s.cards);
  const options = useDeckStore((s) => s.options);
  const containerRef = useRef<HTMLDivElement>(null);

  const generated = useMemo(() => {
    if (cards.length === 0) return null;
    try {
      return card_pages_generate_html(cards, options, browserEngineContext);
    } catch (err) {
      return { error: err instanceof Error ? err.message : String(err) };
    }
  }, [cards, options]);

  const docHtml =
    generated && !('error' in generated)
      ? // The engine style block (the @page rule) is engine-generated, not
        // user content; pages go through the shared DOMPurify boundary —
        // exactly like legacy output.js insertCards.
        generated.style + sanitizePages(generated.html)
      : null;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !generated || 'error' in generated) return;
    // output.js:8-9
    if (options.crop_marks) cropMarks(container, generated.pages.length, options);
    process_card_generated_front(container);
  }, [generated, options]);

  return (
    <>
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background px-4 py-2 print:hidden">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link to="/">← Back to editor</Link>
          </Button>
          <h1 className="font-semibold text-sm">Print preview</h1>
        </div>
        <Button size="sm" onClick={() => window.print()} disabled={!docHtml}>
          Print
        </Button>
      </header>

      {docHtml ? (
        // Portaled to <body> so <page> elements fragment against the body in
        // print, like the legacy output page — nesting them under #root makes
        // Chromium spill a blank trailing PDF page.
        createPortal(
          <div
            ref={containerRef}
            className="rpg-cards-render print-preview-root"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized via sanitizePages
            dangerouslySetInnerHTML={{ __html: docHtml }}
          />,
          document.body,
        )
      ) : (
        <main className="flex h-[80vh] items-center justify-center p-8 text-center">
          <div>
            <p className="text-muted-foreground">
              {generated && 'error' in generated
                ? `Could not generate pages: ${generated.error}`
                : 'Your deck is empty. Add some cards in the editor first.'}
            </p>
            <Button asChild className="mt-4">
              <Link to="/">Back to editor</Link>
            </Button>
          </div>
        </main>
      )}
    </>
  );
}
