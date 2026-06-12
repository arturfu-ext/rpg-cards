// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { Editor } from './Editor';

test('renders the app title', () => {
  render(<Editor />);
  expect(screen.getByRole('heading', { name: 'RPG Card Generator' })).toBeDefined();
});
