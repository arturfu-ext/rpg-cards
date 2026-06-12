/**
 * Deck file save/open. Saved files must stay byte-compatible with legacy
 * saves (ui.js:298-347): uuid stripped, JSON.stringify(data, null, "  ").
 */

import { useDeckStore } from '@/app/store/deck-store';
import type { Card } from '@/engine/types';

export function serializeDeck(cards: ReadonlyArray<Card>): string {
  const data = cards.map((item) => {
    const { uuid: _uuid, ...card } = item;
    return card;
  });
  return JSON.stringify(data, null, '  ');
}

interface SaveFilePickerWindow extends Window {
  showSaveFilePicker?(options: {
    suggestedName?: string;
    types?: Array<{ description: string; accept: Record<string, string[]> }>;
  }): Promise<{
    name: string;
    createWritable(): Promise<{
      write(data: string): Promise<void>;
      close(): Promise<void>;
    }>;
  }>;
}

/** ui.js ui_save_file — File System Access API when enabled, else download. */
export async function saveDeckFile(): Promise<void> {
  const { cards, settings, setSetting } = useDeckStore.getState();
  const jsonString = serializeDeck(cards);
  const filename = settings.file_name;

  const w = window as SaveFilePickerWindow;
  if (w.showSaveFilePicker && settings.open_save_dialog && !settings.browser_asks_where_save) {
    try {
      const handle = await w.showSaveFilePicker({
        suggestedName: `${filename}.json`,
        types: [{ description: 'File JSON', accept: { 'application/json': ['.json'] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(jsonString);
      await writable.close();
      const newFilename = handle.name.split('.').slice(0, -1).join('.');
      if (newFilename !== filename) setSetting('file_name', newFilename);
      return;
    } catch (err) {
      if ((err as DOMException).name === 'AbortError') return;
      console.error(err);
    }
  }

  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  if (filename) {
    a.download = filename;
    a.click();
  }
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

export interface LoadResult {
  fileName: string;
  cards: Array<Partial<Card>>;
}

/** Parse one selected file; throws on invalid JSON (caller shows the toast). */
export async function readDeckFile(file: File): Promise<LoadResult | null> {
  const result = ((await file.text()) || '').trim();
  if (!result) return null;
  const data = JSON.parse(result);
  return {
    fileName: file.name.replace(/\.[^/.]+$/, ''),
    cards: data,
  };
}
