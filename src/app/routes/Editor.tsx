/**
 * Main editor screen: header bar (Generate/Save) + three-panel layout
 * (deck list | card editor + settings | live preview).
 */
import { Printer, Save } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { DeckPanel } from '@/app/components/deck/DeckPanel';
import { CardEditor } from '@/app/components/editor/CardEditor';
import { LivePreview } from '@/app/components/preview/LivePreview';
import { SettingsTabs } from '@/app/components/settings/SettingsTabs';
import { saveDeckFile } from '@/app/persistence/files';
import { useDeckStore } from '@/app/store/deck-store';
import { Button } from '@/components/ui/button';

export function Editor() {
  const navigate = useNavigate();
  const hasCards = useDeckStore((s) => s.cards.length > 0);

  /** ui.js:67-71 — refuse to generate an empty deck. */
  function handleGenerate() {
    if (!hasCards) {
      toast.error('Your deck is empty. Please define some cards first, or load the sample deck.');
      return;
    }
    navigate('/print');
  }

  return (
    <div className="flex h-screen flex-col bg-muted/30 text-foreground">
      <header className="flex shrink-0 items-center gap-3 border-b bg-background px-4 py-2">
        <h1 className="font-semibold text-lg">RPG Card Generator</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" onClick={() => void saveDeckFile()}>
            <Save />
            Save
          </Button>
          <Button size="lg" onClick={handleGenerate}>
            <Printer />
            Generate
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="w-[320px] shrink-0 overflow-y-auto border-r bg-background">
          <DeckPanel />
        </aside>

        <main className="min-w-[420px] flex-1 basis-0 overflow-y-auto border-r">
          <div className="flex flex-col gap-3 p-3">
            <CardEditor />
            <SettingsTabs />
          </div>
        </main>

        <aside className="min-w-[360px] flex-1 basis-0 overflow-auto">
          <LivePreview />
        </aside>
      </div>
    </div>
  );
}
