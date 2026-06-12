/**
 * Central app state. Action semantics mirror generator/js/ui.js so the new
 * editor behaves exactly like the legacy one (selection rules, title
 * suffixes, migration shims, option interlocks).
 */
import { create } from 'zustand';
import { percentOf, ratioOf, scaleByPercent, scaleByRatio } from '@/app/lib/size-math';
import { legacy_card_data } from '@/app/persistence/legacy';
import { type AppSettings, default_app_settings } from '@/app/types';
import { default_card_data, default_card_options } from '@/engine/options';
import type { Card, CardOptions } from '@/engine/types';
import { isLandscape } from '@/engine/units';

export type MoveDirection = 'top' | 'up' | 'down' | 'bottom';

/** Option keys whose values are swapped by the rotate buttons (ui.js:481-513). */
export type SwappableOptionKey =
  | 'page_width'
  | 'page_height'
  | 'card_width'
  | 'card_height'
  | 'page_rows'
  | 'page_columns'
  | 'page_zoom_width'
  | 'page_zoom_height'
  | 'card_zoom_width'
  | 'card_zoom_height'
  | 'back_bleed_width'
  | 'back_bleed_height';

export interface DeckState {
  cards: Card[];
  selectedUuid: string | null;
  options: CardOptions;
  settings: AppSettings;
  /** Legacy "ask before delete" checkbox — intentionally not persisted. */
  askBeforeDelete: boolean;

  // --- deck actions (ui.js) ---
  /** ui.js:167-175 */
  addNewCard(): void;
  /** ui.js:177-193 — copies selected (title + " (Copy)") or adds an empty card. */
  duplicateSelected(): void;
  /** ui.js:214-233 — appends pasted card(s) with new uuids and " (Pasted)" titles. */
  pasteCards(parsed: unknown): void;
  /** ui.js:250-258 — deletes selected, selects min(index, length-1). */
  deleteSelected(): void;
  /** ui.js:100-111 */
  clearAll(): void;
  /**
   * Append raw (possibly legacy-format) cards through legacy_card_data.
   * select: which card ends up selected (ui.js: sample/import select the
   * first added card, file-open selects index 0).
   */
  addCards(raw: ReadonlyArray<Partial<Card>>, select: 'first-added' | 'first'): void;
  /** Replace the whole deck (file open after clear-all). */
  openDeck(raw: ReadonlyArray<Partial<Card>>, fileName: string): void;
  selectCard(uuid: string): void;
  /** ui.js:646-680 */
  moveSelected(direction: MoveDirection): void;
  /** ui.js:782-794 — user-supplied comparator body: new Function('card_a','card_b', body). */
  sortCards(fnBody: string): void;
  /** ui.js:800-813 — user-supplied predicate body; undefined return keeps the card. */
  filterCards(fnBody: string): void;

  // --- card edit actions ---
  /** ui.js:682-690 — generic property write on the selected card. */
  updateSelectedCard(patch: Partial<Card>): void;
  /** ui.js:725-732 — textarea value split on newlines. */
  setCardContents(text: string): void;
  /** ui.js:742-756 — comma-split, trimmed, lowercased; blank clears. */
  setCardTags(text: string): void;

  // --- option actions ---
  /** Plain option write (ui.js ui_change_option default case). */
  setOption<K extends keyof CardOptions>(key: K, value: CardOptions[K]): void;
  /**
   * ui.js:524-552 — card_size preset select. Splits "W,H" and applies it
   * preserving the current orientation; syncs card_zoom_* when zoom is
   * 100/100. Also writes card_width/card_height onto the selected card
   * (legacy ui_set_card_custom_size quirk, ui.js:692-699).
   */
  setCardSizePreset(value: string): void;
  /** ui.js:553-567 — direct width/height edit with the same syncing. */
  setCardDimension(key: 'card_width' | 'card_height', value: string): void;
  /**
   * ui.js:569-617 — the zoom interlock. Editing any of the four zoom fields
   * recomputes the other three from the card aspect ratio, honoring
   * settings.page_zoom_keep_ratio.
   */
  setZoomField(
    key: 'page_zoom_width' | 'page_zoom_height' | 'card_zoom_width' | 'card_zoom_height',
    value: string,
  ): void;
  /** ui.js:502-508 — reset both page zoom fields to 100 ignoring keep-ratio. */
  zoom100(): void;
  /** ui.js:47-65 rotate buttons. */
  swapOptions(key1: SwappableOptionKey, key2: SwappableOptionKey): void;
  /** ui.js:815-883 — copy a default option onto every card. */
  applyDefaultToAllCards(cardKey: keyof Card & string, optionKey: keyof CardOptions): void;

  // --- settings ---
  setSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void;
  setAskBeforeDelete(value: boolean): void;

  /** Replace state wholesale (localStorage hydration). */
  hydrate(state: { cards?: Card[]; options?: CardOptions; settings?: AppSettings }): void;
}

function selectedIndex(state: { cards: Card[]; selectedUuid: string | null }): number {
  return state.cards.findIndex((c) => c.uuid === state.selectedUuid);
}

export function selectSelectedCard(state: DeckState): Card | undefined {
  return state.cards.find((c) => c.uuid === state.selectedUuid);
}

/** ui.js:264-268 — "Contains N unique cards, M in total." */
export function selectTotalCount(state: DeckState): { unique: number; total: number } {
  return {
    unique: state.cards.length,
    total: state.cards.reduce((result, card) => result + (card?.count || 1) * 1, 0),
  };
}

export const useDeckStore = create<DeckState>()((set, get) => ({
  cards: [],
  selectedUuid: null,
  options: default_card_options(),
  settings: default_app_settings(),
  askBeforeDelete: true,

  addNewCard() {
    const card = legacy_card_data([
      {
        ...default_card_data(),
        title: 'New card',
        icon_back_container: get().options.default_icon_back_container,
      },
    ])[0];
    if (!card) return;
    set((s) => ({ cards: [...s.cards, card], selectedUuid: card.uuid ?? null }));
  },

  duplicateSelected() {
    const old_card = selectSelectedCard(get());
    let new_card: Card;
    if (old_card && get().cards.length > 0) {
      new_card = { ...old_card, title: `${old_card.title} (Copy)`, uuid: crypto.randomUUID() };
    } else {
      new_card = {
        ...default_card_data(),
        uuid: crypto.randomUUID(),
        icon_back_container: get().options.default_icon_back_container,
      };
    }
    set((s) => ({ cards: [...s.cards, new_card], selectedUuid: new_card.uuid ?? null }));
  },

  pasteCards(parsed) {
    const content = (Array.isArray(parsed) ? parsed : [parsed]) as Array<Partial<Card>>;
    const pasted = content.map((c) => ({
      ...c,
      uuid: crypto.randomUUID(),
      title: `${c.title ?? ''} (Pasted)`,
    })) as Card[];
    const first = pasted[0];
    if (!first) return;
    set((s) => ({ cards: [...s.cards, ...pasted], selectedUuid: first.uuid ?? null }));
  },

  deleteSelected() {
    const state = get();
    const index = selectedIndex(state);
    if (index === -1) return;
    const cards = state.cards.filter((_, i) => i !== index);
    const nextSelected = cards[Math.min(index, cards.length - 1)];
    set({ cards, selectedUuid: nextSelected?.uuid ?? null });
  },

  clearAll() {
    set({ cards: [], selectedUuid: null });
  },

  addCards(raw, select) {
    const newCards = legacy_card_data(raw);
    set((s) => {
      const cards = [...s.cards, ...newCards];
      const selected = select === 'first-added' ? (newCards[0] ?? null) : (cards[0] ?? null);
      return { cards, selectedUuid: selected?.uuid ?? s.selectedUuid };
    });
  },

  openDeck(raw, fileName) {
    const cards = legacy_card_data(raw);
    set((s) => ({
      cards,
      selectedUuid: cards[0]?.uuid ?? null,
      settings: { ...s.settings, file_name: fileName },
    }));
  },

  selectCard(uuid) {
    set({ selectedUuid: uuid });
  },

  moveSelected(direction) {
    const state = get();
    const idx = selectedIndex(state);
    if (idx === -1) return;
    const cards = [...state.cards];
    const [card] = cards.splice(idx, 1);
    if (!card) return;
    const target =
      direction === 'top'
        ? 0
        : direction === 'bottom'
          ? cards.length
          : direction === 'up'
            ? Math.max(0, idx - 1)
            : Math.min(cards.length, idx + 1);
    if (
      (direction === 'up' && idx === 0) ||
      (direction === 'down' && idx === state.cards.length - 1)
    ) {
      return;
    }
    cards.splice(target, 0, card);
    set({ cards });
  },

  sortCards(fnBody) {
    // Power feature carried over from the legacy sort modal (ui.js:786).
    const fn = new Function('card_a', 'card_b', fnBody) as (a: Card, b: Card) => number;
    set((s) => ({ cards: [...s.cards].sort((a, b) => fn(a, b)) }));
  },

  filterCards(fnBody) {
    const fn = new Function('card', fnBody) as (c: Card) => boolean | undefined;
    set((s) => ({
      cards: s.cards.filter((card) => {
        const result = fn(card);
        return result === undefined ? true : result;
      }),
    }));
  },

  updateSelectedCard(patch) {
    set((s) => ({
      cards: s.cards.map((c) => (c.uuid === s.selectedUuid ? { ...c, ...patch } : c)),
    }));
  },

  setCardContents(text) {
    get().updateSelectedCard({ contents: text.split('\n') });
  },

  setCardTags(text) {
    const tags =
      text.trim().length === 0 ? [] : text.split(',').map((val) => val.trim().toLowerCase());
    get().updateSelectedCard({ tags });
  },

  setOption(key, value) {
    set((s) => ({ options: { ...s.options, [key]: value } }));
  },

  setCardSizePreset(value) {
    const state = get();
    const options = { ...state.options };
    const changed = options.card_size !== value;
    let w: string;
    let h: string;
    if (changed) {
      options.card_size = value;
      [w = '', h = ''] = value ? value.split(',') : ['', ''];
    } else {
      w = options.card_width;
      h = options.card_height;
    }
    let width = '';
    let height = '';
    if (isLandscape(w, h)) {
      width = h;
      height = w;
    } else {
      width = w;
      height = h;
    }
    options.card_width = width;
    options.card_height = height;
    if (options.page_zoom_width === '100' && options.page_zoom_height === '100') {
      options.card_zoom_width = width;
      options.card_zoom_height = height;
    }
    set({ options });
    get().updateSelectedCard({ card_width: width, card_height: height } as Partial<Card>);
  },

  setCardDimension(key, value) {
    const state = get();
    const options = { ...state.options, [key]: value };
    const width = options.card_width;
    const height = options.card_height;
    // ui.js:558 syncs the card-size select to a matching preset (UI concern,
    // derived in the component); zoom sync mirrors ui.js:561-566.
    if (options.page_zoom_width === '100' && options.page_zoom_height === '100') {
      options.card_zoom_width = width;
      options.card_zoom_height = height;
    }
    set({ options });
    get().updateSelectedCard({ card_width: width, card_height: height } as Partial<Card>);
  },

  setZoomField(key, value) {
    const state = get();
    const options = { ...state.options };
    const cardWidth = options.card_width;
    const cardHeight = options.card_height;
    const r = ratioOf(cardWidth, cardHeight);
    if (r) {
      let percWidth: string | null = null;
      let percHeight: string | null = null;
      let sizeWidth: string | null = null;
      let sizeHeight: string | null = null;
      const keepRatio = state.settings.page_zoom_keep_ratio;
      if (key === 'page_zoom_width') {
        percWidth = value;
        percHeight = keepRatio ? percWidth : String(options.page_zoom_height);
      } else if (key === 'page_zoom_height') {
        percHeight = value;
        percWidth = keepRatio ? percHeight : String(options.page_zoom_width);
      } else if (key === 'card_zoom_width') {
        sizeWidth = value;
        sizeHeight = keepRatio ? scaleByRatio(sizeWidth, 1 / r) : options.card_zoom_height;
      } else {
        sizeHeight = value;
        sizeWidth = keepRatio ? scaleByRatio(sizeHeight, r) : options.card_zoom_width;
      }
      if (percWidth == null) {
        percWidth = percentOf(sizeWidth, cardWidth);
        percHeight = percentOf(sizeHeight, cardHeight);
      } else {
        sizeWidth = scaleByPercent(cardWidth, percWidth);
        sizeHeight = scaleByPercent(cardHeight, percHeight);
      }
      type ZoomKey = Parameters<DeckState['setZoomField']>[0];
      const setVal = (k: ZoomKey, v: string | null) => {
        options[k] = k === key ? value : (v ?? String(options[k]));
      };
      setVal('page_zoom_width', percWidth);
      setVal('page_zoom_height', percHeight);
      setVal('card_zoom_width', sizeWidth);
      setVal('card_zoom_height', sizeHeight);
    } else {
      options[key] = value;
    }
    set({ options });
  },

  zoom100() {
    const state = get();
    set({
      options: { ...state.options, page_zoom_width: '100', page_zoom_height: '100' },
    });
    // Legacy re-derives card zoom through the interlock with keep-ratio
    // temporarily off (ui.js:502-508): both fields land on 100%.
    const options = { ...get().options };
    options.card_zoom_width = scaleByPercent(options.card_width, '100') ?? options.card_width;
    options.card_zoom_height = scaleByPercent(options.card_height, '100') ?? options.card_height;
    set({ options });
  },

  swapOptions(key1, key2) {
    set((s) => ({
      options: { ...s.options, [key1]: s.options[key2], [key2]: s.options[key1] },
    }));
  },

  applyDefaultToAllCards(cardKey, optionKey) {
    const value = get().options[optionKey];
    set((s) => ({
      cards: s.cards.map((c) => ({ ...c, [cardKey]: value })),
    }));
  },

  setSetting(key, value) {
    set((s) => ({ settings: { ...s.settings, [key]: value } }));
  },

  setAskBeforeDelete(value) {
    set({ askBeforeDelete: value });
  },

  hydrate(state) {
    set((s) => ({
      cards: state.cards ?? s.cards,
      options: state.options ?? s.options,
      settings: state.settings ?? s.settings,
      selectedUuid: state.cards?.[0]?.uuid ?? s.selectedUuid,
    }));
  },
}));
