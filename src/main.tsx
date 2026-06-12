import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createHashRouter, RouterProvider } from 'react-router';
import { localStoreLoad, localStoreSubscribe } from '@/app/persistence/local-store';
import { Editor } from '@/app/routes/Editor';
import { PrintPreview } from '@/app/routes/PrintPreview';
import { Toaster } from '@/components/ui/sonner';
import '@/styles/app.css';

localStoreLoad();
localStoreSubscribe();

const router = createHashRouter([
  { path: '/', element: <Editor /> },
  { path: '/print', element: <PrintPreview /> },
]);

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <RouterProvider router={router} />
    <Toaster />
  </StrictMode>,
);
