/**
 * Ports of the legacy data-migration shims (generator/js/ui.js:910-951).
 * These run on every load path — localStorage, file open/import, clipboard
 * paste of old exports — so decks saved by any historical version of the app
 * keep loading identically.
 */

import { type AppSettings, default_app_settings } from '@/app/types';
import { card_init, default_card_options } from '@/engine/options';
import type { Card, CardOptions } from '@/engine/types';

// common.js:271-274 — loose == null on purpose (matches null and undefined).
export function isNil(q: unknown): q is null | undefined {
  return q == null;
}

/** Legacy card fields that newer versions renamed. */
interface LegacyCardFields {
  icon?: string;
  color?: string;
}

// ui.js:910-931
export function legacy_card_data(
  oldData: ReadonlyArray<Partial<Card> & LegacyCardFields> = [],
): Card[] {
  return oldData.map((oldCard) => {
    const card = card_init({ ...oldCard }) as Card & LegacyCardFields;
    if (!isNil(card.icon)) {
      card.icon_front = card.icon;
      delete card.icon;
    }
    if (!isNil(card.color)) {
      card.color_front = card.color;
      card.color_back = '';
      delete card.color;
    }
    if (isNil(card.icon_back_container)) {
      card.icon_back_container = 'rounded-square';
    }
    if (isNil(card.uuid)) {
      card.uuid = crypto.randomUUID();
    }
    return card;
  });
}

/** Legacy option fields that newer versions split. */
interface LegacyOptionFields {
  page_zoom?: string | number;
}

// ui.js:933-944
export function legacy_card_options(
  data: Partial<CardOptions> & LegacyOptionFields = {},
): CardOptions {
  const newData: CardOptions & LegacyOptionFields = {
    ...default_card_options(),
    ...data,
  };
  if (!isNil(newData.page_zoom)) {
    newData.page_zoom_width = newData.page_zoom;
    newData.page_zoom_height = newData.page_zoom;
    delete newData.page_zoom;
  }
  return newData;
}

// ui.js:946-951
export function legacy_app_settings(data: Partial<AppSettings> = {}): AppSettings {
  return {
    ...default_app_settings(),
    ...data,
  };
}
