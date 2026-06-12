/**
 * localStorage persistence using the exact legacy keys and shapes
 * (ui.js:886-975): `card_data` (uuid-stripped), `card_options`,
 * `app_settings`. Saves are debounced 500ms like legacy local_store_save.
 */

import {
  legacy_app_settings,
  legacy_card_data,
  legacy_card_options,
} from '@/app/persistence/legacy';
import { useDeckStore } from '@/app/store/deck-store';

const SAVE_DEBOUNCE_MS = 500;

export function localStoreLoad(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const storedCards = JSON.parse(localStorage.getItem('card_data') ?? 'null');
    const storedOptions = JSON.parse(localStorage.getItem('card_options') ?? 'null');
    const storedSettings = JSON.parse(localStorage.getItem('app_settings') ?? 'null');
    useDeckStore.getState().hydrate({
      cards: storedCards ? legacy_card_data(storedCards) : undefined,
      options: storedOptions ? legacy_card_options(storedOptions) : undefined,
      settings: storedSettings ? legacy_app_settings(storedSettings) : undefined,
    });
  } catch (e) {
    console.error('Error loading from localStorage', e);
  }
}

function save(): void {
  if (typeof localStorage === 'undefined') return;
  const { cards, options, settings } = useDeckStore.getState();
  const card_data_to_save = cards.map((c) => {
    const { uuid: _uuid, ...card } = c;
    return card;
  });
  try {
    localStorage.setItem('card_data', JSON.stringify(card_data_to_save));
    localStorage.setItem('card_options', JSON.stringify(options));
    localStorage.setItem('app_settings', JSON.stringify(settings));
  } catch (e) {
    console.log(e);
  }
}

let timer: ReturnType<typeof setTimeout> | undefined;
let subscribed = false;

/** Call once at app startup (after localStoreLoad). */
export function localStoreSubscribe(): void {
  if (subscribed) return;
  subscribed = true;
  useDeckStore.subscribe(() => {
    clearTimeout(timer);
    timer = setTimeout(save, SAVE_DEBOUNCE_MS);
  });
}

/** Test hook: flush a pending debounced save immediately. */
export function localStoreFlush(): void {
  clearTimeout(timer);
  save();
}
