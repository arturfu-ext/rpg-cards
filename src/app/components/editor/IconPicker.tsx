/**
 * Reusable icon picker over the game-icons manifest (4199 picker names plus
 * the custom-* aliases). Mirrors the legacy "icon-list" text inputs + the
 * typeahead search button: the raw value stays freely editable text, while
 * the popover offers a virtualized, searchable list.
 */
import { useVirtualizer } from '@tanstack/react-virtual';
import { Check, Search, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ICON_FILES, ICON_PICKER_NAMES } from '@/engine/icons/manifest.gen';
import { cn } from '@/lib/utils';

export interface IconPickerProps {
  value: string;
  onChange: (v: string) => void;
  /** icon_front semantics: the value is a space-separated list of names. */
  multi?: boolean;
  placeholder?: string;
}

const ICON_FILE_MAP: Record<string, string> = ICON_FILES;

/** Same URL resolution as browserEngineContext.iconUrl. */
function iconUrl(name: string): string | null {
  const file = ICON_FILE_MAP[name];
  if (!file) return null;
  return new URL(file, document.baseURI).href;
}

const STANDARD_NAMES: readonly string[] = ICON_PICKER_NAMES;
const STANDARD_NAME_SET: ReadonlySet<string> = new Set(STANDARD_NAMES);
/** custom-* aliases exist in ICON_FILES but not in ICON_PICKER_NAMES. */
const CUSTOM_NAMES: readonly string[] = Object.keys(ICON_FILES)
  .filter((name) => !STANDARD_NAME_SET.has(name))
  .sort();

type Row = { kind: 'heading'; label: string } | { kind: 'icon'; name: string };

const HEADING_HEIGHT = 28;
const ITEM_HEIGHT = 32;

/** Substring filter done by hand — cmdk filtering is off for performance. */
function buildRows(query: string): Row[] {
  const q = query.trim().toLowerCase();
  const custom = q ? CUSTOM_NAMES.filter((name) => name.includes(q)) : CUSTOM_NAMES;
  const standard = q ? STANDARD_NAMES.filter((name) => name.includes(q)) : STANDARD_NAMES;
  const rows: Row[] = [];
  if (custom.length > 0) {
    rows.push({ kind: 'heading', label: 'Custom' });
    for (const name of custom) rows.push({ kind: 'icon', name });
  }
  if (standard.length > 0) {
    rows.push({ kind: 'heading', label: 'Icons' });
    for (const name of standard) rows.push({ kind: 'icon', name });
  }
  return rows;
}

export function IconPicker({ value, onChange, multi = false, placeholder }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  const selectedNames = value.split(/\s+/).filter(Boolean);
  const selectedSet = new Set(selectedNames);
  const rows = buildRows(query);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => listRef.current,
    estimateSize: (index) => (rows[index]?.kind === 'heading' ? HEADING_HEIGHT : ITEM_HEIGHT),
    overscan: 12,
  });

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) setQuery('');
  }

  function handleQueryChange(next: string) {
    setQuery(next);
    // Drop cached per-index sizes: after filtering, the heading/icon split at
    // a given index can change even when the total row count does not.
    virtualizer.measure();
    virtualizer.scrollToOffset(0);
  }

  /** Remove every occurrence of a name (multi-mode toggle off). */
  function removeName(name: string) {
    onChange(selectedNames.filter((n) => n !== name).join(' '));
  }

  /** Remove a single chip; duplicates of the same name are kept. */
  function removeAt(index: number) {
    onChange(selectedNames.filter((_, i) => i !== index).join(' '));
  }

  function pick(name: string) {
    if (multi) {
      if (selectedSet.has(name)) {
        removeName(name);
      } else {
        onChange([...selectedNames, name].join(' '));
      }
    } else {
      onChange(name);
      setOpen(false);
    }
  }

  const previewName = multi ? selectedNames[0] : value.trim();
  const previewUrl = previewName ? iconUrl(previewName) : null;

  return (
    <div className="flex items-center gap-1.5">
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0"
            aria-label="Browse icons"
          >
            {previewUrl ? (
              <img src={previewUrl} alt="" className="size-5" />
            ) : (
              <Search className="size-4 text-muted-foreground" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          {multi && selectedNames.length > 0 && (
            <div className="flex max-h-28 flex-wrap gap-1 overflow-y-auto border-b p-2">
              {selectedNames.map((name, index) => {
                const url = iconUrl(name);
                return (
                  <span
                    // biome-ignore lint/suspicious/noArrayIndexKey: duplicate names are legal in the legacy space-separated list
                    key={`${name}-${index}`}
                    className="inline-flex items-center gap-1 rounded-md border bg-muted px-1.5 py-0.5 text-xs"
                  >
                    {url && <img src={url} alt="" loading="lazy" className="size-3.5" />}
                    <span className="max-w-40 truncate">{name}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${name}`}
                      onClick={() => removeAt(index)}
                      className="rounded-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search icons..."
              value={query}
              onValueChange={handleQueryChange}
            />
            <CommandList ref={listRef}>
              {rows.length === 0 && <CommandEmpty>No icons found.</CommandEmpty>}
              <div
                className="relative w-full"
                style={{ height: `${virtualizer.getTotalSize()}px` }}
              >
                {virtualizer.getVirtualItems().map((virtualRow) => {
                  const row = rows[virtualRow.index];
                  if (!row) return null;
                  const style = {
                    transform: `translateY(${virtualRow.start}px)`,
                    height: `${virtualRow.size}px`,
                  };
                  if (row.kind === 'heading') {
                    return (
                      <div
                        key={virtualRow.key}
                        className="absolute inset-x-1 top-0 flex items-end px-2 pb-1 font-medium text-muted-foreground text-xs"
                        style={style}
                      >
                        {row.label}
                      </div>
                    );
                  }
                  const url = iconUrl(row.name);
                  const isSelected = multi ? selectedSet.has(row.name) : value.trim() === row.name;
                  return (
                    <CommandItem
                      key={virtualRow.key}
                      value={row.name}
                      onSelect={() => pick(row.name)}
                      className={cn('absolute inset-x-1 top-0', isSelected && 'font-medium')}
                      style={style}
                    >
                      {url ? (
                        <img src={url} alt="" loading="lazy" className="size-5 shrink-0" />
                      ) : (
                        <span className="size-5 shrink-0" />
                      )}
                      <span className="truncate">{row.name}</span>
                      {isSelected && <Check className="ml-auto size-4 shrink-0" />}
                    </CommandItem>
                  );
                })}
              </div>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={multi ? 'Icon names' : 'Icon name'}
        spellCheck={false}
        className="min-w-0 flex-1"
      />
      {!multi && value !== '' && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0"
          aria-label="Clear icon"
          onClick={() => onChange('')}
        >
          <X className="size-4" />
        </Button>
      )}
    </div>
  );
}
