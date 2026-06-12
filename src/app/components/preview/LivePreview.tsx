/**
 * Live preview of the selected card, mirroring ui_render_selected_card
 * (generator/js/ui.js:460-471): front + back generated at isPreview:true,
 * sanitized, injected, then run through the data-onload="fix-icon-size" pass.
 */
import { IdCard, TriangleAlert } from 'lucide-react';
import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { browserEngineContext } from '@/app/render/engine-context';
import { sanitizeCards } from '@/app/render/sanitize';
import { selectSelectedCard, useDeckStore } from '@/app/store/deck-store';
import { Button } from '@/components/ui/button';
import { card_generate_back, card_generate_front, process_card_generated_front } from '@/engine';

const ZOOM_LEVELS = [50, 75, 100, 150];

/** Subtle checkerboard so white card stock reads against the pane. */
const checkerboardStyle: CSSProperties = {
  backgroundColor: '#ffffff',
  backgroundImage: 'repeating-conic-gradient(#f4f4f5 0% 25%, #ffffff 0% 50%)',
  backgroundSize: '24px 24px',
};

export function LivePreview() {
  const card = useDeckStore(selectSelectedCard);
  const options = useDeckStore((s) => s.options);
  const [zoom, setZoom] = useState(100);
  const renderRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<HTMLDivElement>(null);

  let html = '';
  let error: string | null = null;
  if (card) {
    try {
      const front = card_generate_front(card, options, { isPreview: true }, browserEngineContext);
      const back = card_generate_back(card, options, { isPreview: true }, browserEngineContext);
      html = `${front}\n${back}`;
    } catch (e) {
      // Legacy parity: the engine throws on unknown front icon names
      // (cards.js:177). Surface the message instead of crashing the app.
      error = e instanceof Error ? e.message : String(e);
    }
  }

  useEffect(() => {
    // The data-onload="fix-icon-size" pass (ui.js:469).
    if (html && renderRef.current) {
      // fix_icon_size measures getBoundingClientRect(), which includes
      // ancestor transforms; the legacy engine assumes scale 1 (legacy has no
      // preview zoom). Clear the zoom transform for the synchronous
      // measurement and restore it before the browser paints. (Icons whose
      // images are not yet cached take fix_icon_size's async onload path and
      // may still measure under zoom — unfixable without engine changes.)
      const wrapper = zoomRef.current;
      const prevTransform = wrapper ? wrapper.style.transform : '';
      if (wrapper) wrapper.style.transform = 'none';
      try {
        process_card_generated_front(renderRef.current);
      } finally {
        if (wrapper) wrapper.style.transform = prevTransform;
      }
    }
  }, [html]);

  if (!card) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center text-muted-foreground">
        <IdCard aria-hidden className="size-10" strokeWidth={1.25} />
        <p className="font-medium text-sm">No card selected</p>
        <p className="max-w-60 text-xs">
          Select a card in the deck or add a new one to see its live preview.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b bg-background px-3 py-1.5">
        <span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
          Preview
        </span>
        <div className="flex items-center gap-0.5">
          {ZOOM_LEVELS.map((level) => (
            <Button
              aria-pressed={zoom === level}
              className="h-6 px-1.5 text-xs"
              key={level}
              onClick={() => setZoom(level)}
              size="xs"
              type="button"
              variant={zoom === level ? 'secondary' : 'ghost'}
            >
              {level}%
            </Button>
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-4" style={checkerboardStyle}>
        {error ? (
          <div
            className="mx-auto max-w-md rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-destructive text-sm"
            role="alert"
          >
            <p className="flex items-center gap-2 font-medium">
              <TriangleAlert aria-hidden className="size-4 shrink-0" />
              This card cannot be rendered
            </p>
            <p className="mt-1 break-words">{error}</p>
          </div>
        ) : (
          <div
            ref={zoomRef}
            // Inverse width keeps the scaled content exactly as wide as the
            // scroll container, so zoomed-in cards re-wrap instead of
            // overflowing past the (unscrollable) left edge.
            style={
              zoom === 100
                ? undefined
                : {
                    transform: `scale(${zoom / 100})`,
                    transformOrigin: 'top left',
                    width: `${10000 / zoom}%`,
                  }
            }
          >
            {/*
             * Legacy .preview-container layout (ui.css:69-78) replicated on the
             * render root itself: flex + wrap + space-evenly, 10px bottom margin
             * on each direct .card child. The child selector keeps the rule from
             * cascading into card internals.
             */}
            <div
              className="rpg-cards-render flex flex-wrap justify-evenly [&>.card]:mb-[10px]"
              // biome-ignore lint/security/noDangerouslySetInnerHtml: engine output passes through the sanitizeCards DOMPurify boundary
              dangerouslySetInnerHTML={{ __html: sanitizeCards(html) }}
              ref={renderRef}
            />
          </div>
        )}
      </div>
    </div>
  );
}
