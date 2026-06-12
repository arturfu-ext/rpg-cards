// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { useDeckStore } from '@/app/store/deck-store';
import { default_card_options } from '@/engine/options';
import type { Card } from '@/engine/types';
import { LivePreview } from './LivePreview';

function seedStore(contents: string[]): void {
  const card: Card = {
    uuid: 'preview-test-uuid',
    count: 1,
    title: 'T',
    contents,
    tags: [],
    color_front: 'Maroon',
  };
  useDeckStore.setState({
    cards: [card],
    selectedUuid: card.uuid ?? null,
    options: default_card_options(),
  });
}

afterEach(() => {
  cleanup();
  useDeckStore.setState({ cards: [], selectedUuid: null, options: default_card_options() });
});

test('renders the selected card front and back', () => {
  seedStore(['text | hello']);
  const { container } = render(<LivePreview />);
  // jsdom getComputedStyle yields empty strings, so the back-inner measurement
  // comes out 0x0 — the engine still renders both faces fine at size 0.
  expect(container.textContent).toContain('hello');
  expect(container.querySelector('.card')).not.toBeNull();
});

test('neutralizes XSS in card contents via sanitizeCards', () => {
  seedStore(['text | <img src=x onerror=alert(1)>']);
  const { container } = render(<LivePreview />);
  expect(container.querySelector('.card')).not.toBeNull();
  // DOMPurify strips the event handler but keeps the benign img element.
  expect(container.innerHTML).not.toContain('onerror');
  expect(container.querySelector('.card img[onerror]')).toBeNull();
});
