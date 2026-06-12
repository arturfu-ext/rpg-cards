// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { expect, test } from 'vitest';
import { Editor } from './Editor';

test('renders the app header and main actions', () => {
  const router = createMemoryRouter([{ path: '/', element: <Editor /> }]);
  render(<RouterProvider router={router} />);
  expect(screen.getByRole('heading', { name: 'RPG Card Generator' })).toBeDefined();
  expect(screen.getByRole('button', { name: /generate/i })).toBeDefined();
  expect(screen.getByRole('button', { name: /save/i })).toBeDefined();
});
