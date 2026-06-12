/**
 * Deck list + deck toolbar. Mirrors the legacy "File" and "Deck" accordion
 * panels (generator/index.html + ui.js): card list with title filter, move
 * buttons, new/duplicate/delete, copy/paste, sort/filter modals, open vs
 * import file flows and the "ask before delete" guard.
 */
import { ChevronDown, ChevronsDown, ChevronsUp, ChevronUp, Search } from 'lucide-react';
import { type ChangeEvent, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useShallow } from 'zustand/react/shallow';
import { PanelSection } from '@/app/components/layout/PanelSection';
import sampleDeck from '@/app/data/sample-deck.json';
import { readDeckFile } from '@/app/persistence/files';
import { selectSelectedCard, selectTotalCount, useDeckStore } from '@/app/store/deck-store';
import { default_app_settings } from '@/app/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Card } from '@/engine/types';
import { cn } from '@/lib/utils';

const sampleDeckCards = sampleDeck as ReadonlyArray<Partial<Card>>;

/** Pre-filled comparator body from the legacy sort modal (index.html:1036-1046). */
const SORT_DEFAULT_BODY = `if (card_a.title < card_b.title) {
    return -1;
}
else if (card_a.title > card_b.title) {
    return 1;
}
else {
    return 0;
}`;

/**
 * Pre-filled body from the legacy filter modal (index.html:1068-1078). A stray
 * "w" after the "yellow" assignment is dropped — it made the legacy sample
 * throw a ReferenceError.
 */
const FILTER_DEFAULT_BODY = `// Color all spell cards yellow
if (card_has_tag(card, "spell")) {
    card.color = "yellow";
}

// Remove all creature cards
if (card_has_tag(card, "creature")) {
    return false;
}`;

const COPY_FAILURE_MESSAGE =
  'Failure to copy: Check permissions for clipboard or try with another browser';

type DeckDialog = 'delete-card' | 'clear-all' | 'open-confirm' | 'sort' | 'filter' | 'help' | null;

/** ui.js:260-262 — ui_deck_option_text. */
function deckOptionText(card: Card): string {
  return `${card.count ?? 1}x ${card.title}`;
}

export function DeckPanel() {
  const cards = useDeckStore((s) => s.cards);
  const selectedUuid = useDeckStore((s) => s.selectedUuid);
  const askBeforeDelete = useDeckStore((s) => s.askBeforeDelete);
  const counts = useDeckStore(useShallow(selectTotalCount));
  const selectedCard = useDeckStore(selectSelectedCard);
  const {
    addNewCard,
    duplicateSelected,
    deleteSelected,
    pasteCards,
    clearAll,
    addCards,
    openDeck,
    selectCard,
    moveSelected,
    sortCards,
    filterCards,
    setSetting,
    setAskBeforeDelete,
  } = useDeckStore(
    useShallow((s) => ({
      addNewCard: s.addNewCard,
      duplicateSelected: s.duplicateSelected,
      deleteSelected: s.deleteSelected,
      pasteCards: s.pasteCards,
      clearAll: s.clearAll,
      addCards: s.addCards,
      openDeck: s.openDeck,
      selectCard: s.selectCard,
      moveSelected: s.moveSelected,
      sortCards: s.sortCards,
      filterCards: s.filterCards,
      setSetting: s.setSetting,
      setAskBeforeDelete: s.setAskBeforeDelete,
    })),
  );

  const [dialog, setDialog] = useState<DeckDialog>(null);
  const [titleFilter, setTitleFilter] = useState('');
  // Legacy pre-fills both modal textareas; whatever is in the box runs verbatim.
  const [sortBody, setSortBody] = useState(SORT_DEFAULT_BODY);
  const [filterBody, setFilterBody] = useState(FILTER_DEFAULT_BODY);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileModeRef = useRef<'open' | 'import'>('import');

  // ui.js:379-386 — case-insensitive RegExp over the row text. An invalid
  // pattern must not blow up the list: fall back to matching everything.
  let rowMatches: (text: string) => boolean;
  try {
    const re = new RegExp(titleFilter, 'i');
    rowMatches = (text) => re.test(text);
  } catch {
    rowMatches = () => true;
  }

  // --- deck actions -------------------------------------------------------

  function handleDelete() {
    if (!selectedCard) return;
    if (askBeforeDelete) {
      setDialog('delete-card');
    } else {
      deleteSelected();
    }
  }

  function resetFileName() {
    setSetting('file_name', default_app_settings().file_name);
  }

  /** ui.js:100-111 — clear-all resets the file name field too. */
  function executeClearAll() {
    clearAll();
    resetFileName();
  }

  function handleClearAll() {
    if (cards.length === 0) return;
    if (askBeforeDelete) {
      setDialog('clear-all');
    } else {
      executeClearAll();
    }
  }

  // --- clipboard (ui.js:195-233) ------------------------------------------

  function handleCopyCard() {
    const card = selectedCard;
    if (!card || cards.length === 0) return;
    navigator.clipboard.writeText(JSON.stringify(card, null, 2)).then(
      () => toast.success(`Card "${card.title}" was copied to the clipboard`),
      () => toast.error(COPY_FAILURE_MESSAGE),
    );
  }

  function handleCopyAll() {
    navigator.clipboard.writeText(JSON.stringify(cards, null, 2)).then(
      () => toast.success('All cards were copied to the clipboard'),
      () => toast.error(COPY_FAILURE_MESSAGE),
    );
  }

  function handlePaste() {
    navigator.clipboard.readText().then(
      (text) => {
        try {
          pasteCards(JSON.parse(text));
        } catch (e) {
          toast.error(`Could not paste clipboard as card or list of cards.\n${e}`);
        }
      },
      () =>
        toast.error(
          'Failure to paste: Check permissions for clipboard or try with another browser',
        ),
    );
  }

  // --- file open / import (ui.js:113-153, 1107-1121) -----------------------

  function triggerFilePicker(mode: 'open' | 'import') {
    fileModeRef.current = mode;
    fileInputRef.current?.click();
  }

  /** Legacy #button-open asks before replacing a non-empty deck. */
  function handleOpenClick() {
    if (cards.length > 0 && askBeforeDelete) {
      setDialog('open-confirm');
    } else {
      triggerFilePicker('open');
    }
  }

  async function handleFilesSelected(event: ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (files.length === 0) return;
    const mode = fileModeRef.current;
    // Legacy import selects the first card added across all files (ui.js:118).
    const firstAddedIndex = useDeckStore.getState().cards.length;
    for (const file of files) {
      try {
        const result = await readDeckFile(file);
        if (!result) {
          toast(`The file ${file.name} is empty.`);
          continue;
        }
        if (mode === 'open') {
          // OPEN: every file replaces the deck and takes over the file name
          // (ui.js:133-138 runs clear-all per file, so the last file wins).
          openDeck(result.cards, result.fileName);
        } else {
          // IMPORT: append; selection fixed below.
          addCards(result.cards, 'first-added');
        }
      } catch (err) {
        console.error(`Error parsing ${file.name}:`, err);
        toast.error(`Error parsing ${file.name}:`);
      }
    }
    if (mode === 'import') {
      const state = useDeckStore.getState();
      const firstAdded = state.cards[firstAddedIndex];
      if (firstAdded?.uuid) selectCard(firstAdded.uuid);
    }
  }

  /** ui.js:91-98 — append the sample deck, select its first card. */
  function handleLoadSample() {
    addCards(sampleDeckCards, 'first-added');
  }

  // --- sort / filter modals (ui.js:779-813) ---------------------------------

  // Legacy runs the textarea content verbatim (ui.js:785, 803): an empty body
  // returns undefined, which sorts nothing / keeps every card. No fallback —
  // substituting a default here could silently drop cards.
  function runSort() {
    setDialog(null);
    try {
      sortCards(sortBody);
    } catch (e) {
      toast.error(`Sort failed: ${e}`);
    }
  }

  function runFilter() {
    setDialog(null);
    try {
      filterCards(filterBody);
    } catch (e) {
      toast.error(`Filter failed: ${e}`);
    }
  }

  function closeDialog(open: boolean) {
    if (!open) setDialog(null);
  }

  return (
    <div className="flex flex-col gap-3 p-3">
      <PanelSection title="File">
        {/* Legacy 2x2 layout: Help | Open, Add sample | Add (index.html:182-200). */}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onClick={() => setDialog('help')}>
            Help
          </Button>
          <Button variant="outline" size="sm" onClick={handleOpenClick}>
            Open…
          </Button>
          <Button variant="outline" size="sm" onClick={handleLoadSample}>
            Sample deck
          </Button>
          <Button variant="outline" size="sm" onClick={() => triggerFilePicker('import')}>
            Import…
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          multiple
          className="hidden"
          onChange={handleFilesSelected}
        />
      </PanelSection>

      <PanelSection title="Deck" className="min-h-0 flex-1">
        <div className="relative">
          <Search className="-translate-y-1/2 absolute top-1/2 left-2.5 size-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search"
            aria-label="Filter cards by title"
            className="pl-8"
            value={titleFilter}
            onChange={(e) => setTitleFilter(e.target.value)}
          />
        </div>

        <div className="flex min-h-0 gap-2">
          <div className="flex flex-col gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              title="Move to top"
              disabled={!selectedCard}
              onClick={() => moveSelected('top')}
            >
              <ChevronsUp />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              title="Move up"
              disabled={!selectedCard}
              onClick={() => moveSelected('up')}
            >
              <ChevronUp />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              title="Move down"
              disabled={!selectedCard}
              onClick={() => moveSelected('down')}
            >
              <ChevronDown />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              title="Move to bottom"
              disabled={!selectedCard}
              onClick={() => moveSelected('bottom')}
            >
              <ChevronsDown />
            </Button>
          </div>

          <div
            className="h-64 min-w-0 flex-1 overflow-y-auto rounded-md border bg-background"
            role="listbox"
            aria-label="Cards in deck"
          >
            {cards.map((card) => {
              const text = deckOptionText(card);
              if (!rowMatches(text)) return null;
              const selected = card.uuid === selectedUuid;
              return (
                <button
                  key={card.uuid}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={cn(
                    'block w-full truncate px-2 py-1 text-left text-sm hover:bg-accent',
                    selected && 'bg-accent font-medium text-accent-foreground',
                  )}
                  onClick={() => card.uuid && selectCard(card.uuid)}
                >
                  {text}
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-muted-foreground text-xs">
          Contains {counts.unique} unique cards, {counts.total} in total.
        </p>

        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" size="sm" onClick={addNewCard}>
            New
          </Button>
          <Button variant="outline" size="sm" onClick={duplicateSelected}>
            Duplicate
          </Button>
          <Button variant="destructive" size="sm" disabled={!selectedCard} onClick={handleDelete}>
            Delete
          </Button>
          <Button variant="outline" size="sm" disabled={!selectedCard} onClick={handleCopyCard}>
            Copy
          </Button>
          <Button variant="outline" size="sm" onClick={handleCopyAll}>
            Copy all
          </Button>
          <Button variant="outline" size="sm" onClick={handlePaste}>
            Paste
          </Button>
          <Button variant="outline" size="sm" onClick={() => setDialog('sort')}>
            Sort…
          </Button>
          <Button variant="outline" size="sm" onClick={() => setDialog('filter')}>
            Filter…
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={cards.length === 0}
            onClick={handleClearAll}
          >
            Delete all
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="ask-before-delete"
            type="checkbox"
            className="size-4 accent-primary"
            checked={askBeforeDelete}
            onChange={(e) => setAskBeforeDelete(e.target.checked)}
          />
          <Label htmlFor="ask-before-delete" className="font-normal">
            Ask before deleting
          </Label>
        </div>
      </PanelSection>

      {/* Confirm: delete selected card (ui.js:250-258). */}
      <Dialog open={dialog === 'delete-card'} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete card</DialogTitle>
            <DialogDescription>Delete {selectedCard?.title}?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setDialog(null);
                deleteSelected();
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm: clear all (ui.js:100-111). */}
      <Dialog open={dialog === 'clear-all'} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete all cards</DialogTitle>
            <DialogDescription>Delete all cards?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setDialog(null);
                executeClearAll();
              }}
            >
              Delete all
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm: open replaces the deck (ui.js:1113-1116). */}
      <Dialog open={dialog === 'open-confirm'} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Open file</DialogTitle>
            <DialogDescription className="whitespace-pre-line">
              {'This will delete all cards.\nAre you sure?'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setDialog(null);
                triggerFilePicker('open');
              }}
            >
              Open
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sort modal (ui.js:779-794). */}
      <Dialog open={dialog === 'sort'} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sort cards</DialogTitle>
            <DialogDescription>
              Enter the comparison function below. The comparison function is a block of javascript
              code. Return -1 if card_a should appear before card_b.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={sortBody}
            onChange={(e) => setSortBody(e.target.value)}
            spellCheck={false}
            wrap="off"
            className="min-h-40 font-mono text-xs"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button onClick={runSort}>Sort</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filter/map modal (ui.js:796-813). */}
      <Dialog open={dialog === 'filter'} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filter/map cards</DialogTitle>
            <DialogDescription>
              Enter code below that will be executed for each card in the deck. Return false to
              remove the current card from the deck.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={filterBody}
            onChange={(e) => setFilterBody(e.target.value)}
            spellCheck={false}
            wrap="off"
            className="min-h-40 font-mono text-xs"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button onClick={runFilter}>Filter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Help modal (ui.js:473-475, index.html:963-1020). */}
      <Dialog open={dialog === 'help'} onOpenChange={closeDialog}>
        <DialogContent
          aria-describedby={undefined}
          className="max-h-[85vh] overflow-y-auto sm:max-w-xl"
        >
          <DialogHeader>
            <DialogTitle>RPG card generator</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <ul className="list-disc space-y-2 pl-5">
              <li>
                To learn about what features are available to define a card, you can:
                <ul className="list-disc pl-5">
                  <li>
                    read the{' '}
                    <a
                      className="underline"
                      href="generator/about.html"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Basic documentation
                    </a>
                  </li>
                  <li>
                    read the{' '}
                    <a
                      className="underline"
                      href="generator/documentation.html"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Elements documentation
                    </a>
                  </li>
                  <li>inspect the sample deck</li>
                </ul>
              </li>
              <li>
                If you find a bug or have a feature request, you can post them at the{' '}
                <a
                  className="underline"
                  href="https://github.com/mephitrpg/rpg-cards/issues"
                  target="_blank"
                  rel="noreferrer"
                >
                  Github project site
                </a>{' '}
                to maintain a record if you wish. However, it's not guarantee if and when they will
                be reviewed.
              </li>
              <li>
                Some RPG systems are protected by copyright. Even if some spell/item data is freely
                available, it does not mean you may redistribute cards containing such data.
              </li>
              <li>
                The user interface consists of three columns: the left column contains the menu and
                global settings. In the middle menu, you can select and edit individual cards. The
                right column contains a preview of the selected card.
              </li>
              <li>
                To use the generator, either load the sample card deck ("Sample deck"), load a card
                deck from a file ("Open"), or manually add some cards. When you're done, click on
                "Generate" to generate a document with all your cards, which can then be printed.
              </li>
            </ul>
            <h4 className="font-semibold">Printing notes</h4>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                Make sure you enable the printing of background images and colors in your browser.
              </li>
              <li>Make sure your printer uses the correct paper size (same as in the editor).</li>
              <li>
                You can use the double-sided (flip on long edge) print setting, but manually
                printing each side usually aligns the pages more accurately.
              </li>
              <li>Do not scale the document to fit the page. Print at original size.</li>
              <li>
                Some printers are not very precise (pages print slightly shifted or rotated) and the
                cards will not line up with the card backs. If this is the case, there's not much
                you can do. Try making the page background the same color as the cards or use the
                bleed option, so that you won't get any white edges on the card. If that does not
                help, try a different printer or print single-sided.
              </li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
