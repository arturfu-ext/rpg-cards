/**
 * Browser implementation of EngineContext — the host side of the two
 * injected dependencies the pure engine needs.
 */
import { ICON_FILES } from '@/engine/icons/manifest.gen';
import type { EngineContext } from '@/engine/types';

function iconUrl(name: string): string | null {
  const file = (ICON_FILES as Record<string, string>)[name];
  if (!file) return null;
  // document.baseURI resolves under the Vite base (/rpg-cards/), where the
  // static icon copies are served. Hash routing keeps baseURI stable.
  return new URL(file, document.baseURI).href;
}

/** jQuery .width()/.height() equivalent: content-box size in px. */
function contentSize(el: Element): { width: number; height: number } {
  const cs = getComputedStyle(el);
  let width = parseFloat(cs.width) || 0;
  let height = parseFloat(cs.height) || 0;
  if (cs.boxSizing === 'border-box') {
    width -=
      (parseFloat(cs.paddingLeft) || 0) +
      (parseFloat(cs.paddingRight) || 0) +
      (parseFloat(cs.borderLeftWidth) || 0) +
      (parseFloat(cs.borderRightWidth) || 0);
    height -=
      (parseFloat(cs.paddingTop) || 0) +
      (parseFloat(cs.paddingBottom) || 0) +
      (parseFloat(cs.borderTopWidth) || 0) +
      (parseFloat(cs.borderBottomWidth) || 0);
  }
  return { width, height };
}

/**
 * Mirrors the legacy temp-card measurement (cards.js:1192-1200): render the
 * bare back card hidden in the live document (so cards.css applies) and
 * measure .card-back-inner.
 */
function measureBackInner(tempCardHtml: string): { width: number; height: number } {
  const container = document.createElement('div');
  container.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;';
  // The measured markup is engine-generated geometry probing only — never
  // user content — but sanitize anyway since it enters the live DOM.
  container.innerHTML = tempCardHtml;
  document.body.appendChild(container);
  // Scope the measurement under the same render root the preview uses so
  // card CSS scoping rules apply identically.
  container.className = 'rpg-cards-render';
  const inner = container.querySelector('.card-back-inner');
  const result = inner ? contentSize(inner) : { width: 0, height: 0 };
  container.remove();
  return result;
}

export const browserEngineContext: EngineContext = {
  iconUrl,
  measureBackInner,
};
