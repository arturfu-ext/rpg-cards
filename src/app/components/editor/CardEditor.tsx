/**
 * Card editor form for the selected card.
 *
 * Faithful port of the legacy center column (generator/index.html card panel
 * + generator/js/fields/fields_card.js + generator/js/ui.js): same field set,
 * option values and write semantics, restyled with shadcn/Tailwind.
 */

import { SquarePen } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ColorPicker } from '@/app/components/editor/ColorPicker';
import { ContentsToolbar } from '@/app/components/editor/ContentsToolbar';
import { IconPicker } from '@/app/components/editor/IconPicker';
import { selectSelectedCard, useDeckStore } from '@/app/store/deck-store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import type { Card } from '@/engine/types';
import { cn } from '@/lib/utils';

/**
 * Insert a directive example into the contents textarea at the cursor.
 * Port of insertTextAtCursor + insertTextWithUndo (generator/js/common.js:205-257):
 * the inserted text always lands on its own line, and execCommand is used so
 * the insertion participates in the browser undo stack.
 */
function insertTextAtCursor(textarea: HTMLTextAreaElement, text: string): void {
  textarea.focus();

  const value = textarea.value;
  const selStart = textarea.selectionStart;
  const selEnd = textarea.selectionEnd;

  const lineStart = value.lastIndexOf('\n', selStart - 1) + 1;
  const lineEndIndex = value.indexOf('\n', selEnd);
  const lineEnd = lineEndIndex === -1 ? value.length : lineEndIndex;

  const isAtLineStart = selStart === lineStart;
  const isAtLineEnd = selEnd === lineEnd;

  let toInsert: string;
  if (isAtLineStart) {
    toInsert = `${text}\n`;
  } else if (isAtLineEnd) {
    toInsert = `\n${text}`;
  } else {
    toInsert = `\n${text}\n`;
  }
  // Special rule: if user selected text and selection ends at end of line,
  // avoid extra '\n' at end.
  if (selStart !== selEnd && isAtLineEnd) {
    toInsert = `\n${text}`;
  }

  textarea.setSelectionRange(selStart, selEnd);
  const success = document.execCommand('insertText', false, toInsert);
  if (!success) {
    // Fallback: manual insert (no undo support).
    textarea.value = value.slice(0, selStart) + toInsert + value.slice(selEnd);
    const newPos = selStart + toInsert.length;
    textarea.selectionStart = newPos;
    textarea.selectionEnd = newPos;
  }
}

/** Sentinel for Radix Select, which forbids empty-string item values. */
const EMPTY = '__empty__';

interface SelectFieldProps {
  id: string;
  /** Raw card value; '' / undefined select the ''-valued option if present. */
  value: string | undefined;
  options: ReadonlyArray<{ value: string; label: string }>;
  placeholder?: string;
  onChange: (value: string) => void;
}

function SelectField({ id, value, options, placeholder, onChange }: SelectFieldProps) {
  const hasEmptyOption = options.some((o) => o.value === '');
  const radixValue = value ? value : hasEmptyOption ? EMPTY : '';
  return (
    <Select value={radixValue} onValueChange={(v) => onChange(v === EMPTY ? '' : v)}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value || EMPTY} value={o.value || EMPTY}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function Field({
  id,
  label,
  className,
  children,
}: {
  id: string;
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="col-span-full space-y-2 pt-2 first:pt-0">
      <h3 className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
        {children}
      </h3>
      <Separator />
    </div>
  );
}

// Option lists mirror generator/index.html card panel selects verbatim.
const TITLE_SIZE_OPTIONS = [
  { value: '', label: 'Default title size' },
  { value: '16', label: '16pt' },
  { value: '15', label: '15pt' },
  { value: '14', label: '14pt' },
  { value: '13', label: '13pt (initial)' },
  { value: '12', label: '12pt' },
  { value: '11', label: '11pt' },
  { value: '10', label: '10pt' },
];

const HEADER_SHOW_OPTIONS = [
  { value: '', label: 'Show' },
  { value: 'none', label: 'Hide' },
];

const ICON_BACK_CONTAINER_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'square', label: 'Square' },
  { value: 'rounded-square', label: 'Rounded square' },
  { value: 'circle', label: 'Circle' },
];

const CARD_FONT_SIZE_OPTIONS = [
  { value: '12', label: '12px (initial)' },
  { value: '11', label: '11px' },
  { value: 'inherit', label: '10.66px (inherit: 8pt)' },
  { value: '10', label: '10px' },
  { value: '9', label: '9px' },
  { value: 'smaller', label: '8.88px (smaller)' },
  { value: '8', label: '8px' },
];

const VERTICAL_ALIGNMENT_OPTIONS = [
  { value: '', label: 'Full Card (CSS position)' },
  { value: 'content-area', label: 'Content Area (CSS position)' },
];

export function CardEditor() {
  const card = useDeckStore(selectSelectedCard);
  if (!card) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center text-muted-foreground">
        <SquarePen className="size-10" aria-hidden="true" />
        <p className="font-medium">No card selected</p>
        <p className="max-w-xs text-sm">
          Add a new card or select one from the deck list to start editing.
        </p>
      </div>
    );
  }
  // Remount per card so per-card local state (contents/tags drafts) resets.
  return <CardForm key={card.uuid ?? 'no-uuid'} card={card} />;
}

function CardForm({ card }: { card: Card }) {
  const updateSelectedCard = useDeckStore((s) => s.updateSelectedCard);
  const setCardContents = useDeckStore((s) => s.setCardContents);
  const setCardTags = useDeckStore((s) => s.setCardTags);

  // Contents: local draft committed to the store after a 200ms pause, exactly
  // like the legacy keyup debounce (ui.js:733-740). The commit is dropped if
  // the selection changed in the meantime, so a stale timer can never write
  // one card's text into another.
  const contentsRef = useRef<HTMLTextAreaElement>(null);
  const pendingCommit = useRef<{ timer: ReturnType<typeof setTimeout>; text: string } | null>(null);
  const [contentsText, setContentsText] = useState(() => card.contents.join('\n'));
  // Tags: local draft committed on blur, exactly like the legacy 'change'
  // handler (ui.js:742-756, wired change-only at ui.js:1158); this also keeps
  // the store's trim/lowercase normalization from fighting the caret.
  const [tagsText, setTagsText] = useState(() => card.tags.join(', '));

  const uuid = card.uuid;
  useEffect(() => {
    // Flush (not drop) a pending contents commit on unmount: the legacy
    // textarea never unmounted, so its debounced change could not be lost.
    return () => {
      const pending = pendingCommit.current;
      if (pending === null) return;
      clearTimeout(pending.timer);
      pendingCommit.current = null;
      if (useDeckStore.getState().selectedUuid === uuid) setCardContents(pending.text);
    };
  }, [uuid, setCardContents]);

  function commitContents(text: string) {
    if (useDeckStore.getState().selectedUuid === card.uuid) setCardContents(text);
  }

  function scheduleContentsCommit(text: string) {
    if (pendingCommit.current !== null) clearTimeout(pendingCommit.current.timer);
    const timer = setTimeout(() => {
      pendingCommit.current = null;
      commitContents(text);
    }, 200);
    pendingCommit.current = { timer, text };
  }

  function flushContentsCommit() {
    const pending = pendingCommit.current;
    if (pending === null) return;
    clearTimeout(pending.timer);
    pendingCommit.current = null;
    commitContents(contentsRef.current?.value ?? pending.text);
  }

  function handleContentsChange(text: string) {
    setContentsText(text);
    scheduleContentsCommit(text);
  }

  function handleInsertDirective(example: string) {
    const textarea = contentsRef.current;
    if (!textarea) return;
    insertTextAtCursor(textarea, example);
    // Legacy fires the change handler synchronously after the insert
    // (ui.js:451-452), so commit immediately instead of debouncing. The
    // execCommand input event React also handles schedules a commit with the
    // same text; flushing here keeps the preview update instant.
    setContentsText(textarea.value);
    if (pendingCommit.current !== null) {
      clearTimeout(pendingCommit.current.timer);
      pendingCommit.current = null;
    }
    commitContents(textarea.value);
  }

  return (
    <form
      className="grid grid-cols-1 content-start gap-4 sm:grid-cols-2"
      onSubmit={(e) => e.preventDefault()}
    >
      <Field id="card-title" label="Name" className="sm:col-span-2">
        <Input
          id="card-title"
          value={card.title}
          placeholder="Name"
          onChange={(e) => updateSelectedCard({ title: e.target.value })}
        />
      </Field>
      <Field id="card-count" label="Count">
        <Input
          id="card-count"
          type="number"
          placeholder="0"
          value={card.count ?? ''}
          onChange={(e) =>
            updateSelectedCard({
              count: e.target.value === '' ? undefined : Number(e.target.value),
            })
          }
        />
      </Field>
      <Field id="card-tags" label="Tags">
        <Input
          id="card-tags"
          value={tagsText}
          placeholder="Tags, comma separated"
          onChange={(e) => setTagsText(e.target.value)}
          onBlur={() => setCardTags(tagsText)}
        />
      </Field>

      <SectionHeading>Front face</SectionHeading>
      <Field id="card-color-front" label="Front color">
        <ColorPicker
          value={card.color_front ?? ''}
          onChange={(v) => updateSelectedCard({ color_front: v })}
        />
      </Field>
      <Field id="header-show" label="Header">
        <SelectField
          id="header-show"
          value={card.header_show}
          options={HEADER_SHOW_OPTIONS}
          onChange={(v) => updateSelectedCard({ header_show: v })}
        />
      </Field>
      <Field id="card-title-display" label="Title">
        <Input
          id="card-title-display"
          type="search"
          value={card.title_display ?? ''}
          placeholder={card.title}
          onChange={(e) => updateSelectedCard({ title_display: e.target.value })}
        />
      </Field>
      <Field id="card-title-size" label="Title size">
        <SelectField
          id="card-title-size"
          value={card.title_size}
          options={TITLE_SIZE_OPTIONS}
          onChange={(v) => updateSelectedCard({ title_size: v })}
        />
      </Field>
      <Field id="title-color" label="Title color">
        <ColorPicker
          value={card.title_color ?? ''}
          onChange={(v) => updateSelectedCard({ title_color: v })}
        />
      </Field>
      <Field id="card-type" label="Card type">
        <Input
          id="card-type"
          value={card.card_type ?? ''}
          placeholder="Type or subtitle"
          onChange={(e) => updateSelectedCard({ card_type: e.target.value })}
        />
      </Field>
      {/* Legacy placeholder: "Card icons, space separated" (multi-icon list). */}
      <Field id="card-icon-front" label="Icons" className="sm:col-span-2">
        <IconPicker
          value={card.icon_front ?? ''}
          onChange={(v) => updateSelectedCard({ icon_front: v })}
        />
      </Field>
      {/* Legacy placeholder: "Default title color" (legacy quirk, ids index.html:862). */}
      <Field id="card-icon-front-color" label="Icons color">
        <ColorPicker
          value={card.icon_front_color ?? ''}
          onChange={(v) => updateSelectedCard({ icon_front_color: v })}
        />
      </Field>

      <SectionHeading>Back face</SectionHeading>
      {/* Legacy placeholder: "Front color or default back color". */}
      <Field id="card-color-back" label="Back color">
        <ColorPicker
          value={card.color_back ?? ''}
          onChange={(v) => updateSelectedCard({ color_back: v })}
        />
      </Field>
      {/* Legacy placeholder: "Front icon or default back icon". */}
      <Field id="card-icon-back" label="Back icon">
        <IconPicker
          value={card.icon_back ?? ''}
          onChange={(v) => updateSelectedCard({ icon_back: v })}
        />
      </Field>
      <Field id="card-icon-back-rotation" label="Rotation (°)">
        <Input
          id="card-icon-back-rotation"
          type="number"
          placeholder="0"
          value={String(card.icon_back_rotation ?? '')}
          onChange={(e) => updateSelectedCard({ icon_back_rotation: e.target.value })}
        />
      </Field>
      <Field id="card-icon-back-container" label="Container">
        <SelectField
          id="card-icon-back-container"
          value={card.icon_back_container}
          options={ICON_BACK_CONTAINER_OPTIONS}
          placeholder="Default container"
          onChange={(v) => updateSelectedCard({ icon_back_container: v })}
        />
      </Field>
      <Field id="card-background" label="Back image" className="sm:col-span-2">
        <Input
          id="card-background"
          type="text"
          value={card.background_image ?? ''}
          placeholder="Background image URL"
          onChange={(e) => updateSelectedCard({ background_image: e.target.value })}
        />
      </Field>

      <SectionHeading>Contents</SectionHeading>
      <Field id="card-contents" label="Contents" className="sm:col-span-2">
        <Textarea
          id="card-contents"
          ref={contentsRef}
          rows={14}
          className="field-sizing-fixed font-mono text-sm"
          value={contentsText}
          onChange={(e) => handleContentsChange(e.target.value)}
          onBlur={flushContentsCommit}
        />
      </Field>
      <Field id="card-font-size" label="Text size">
        <SelectField
          id="card-font-size"
          value={card.card_font_size}
          options={CARD_FONT_SIZE_OPTIONS}
          placeholder="Default text size"
          onChange={(v) => updateSelectedCard({ card_font_size: v })}
        />
      </Field>
      <Field id="vertical-alignment-reference" label="Relative to">
        <SelectField
          id="vertical-alignment-reference"
          value={card.vertical_alignment_reference}
          options={VERTICAL_ALIGNMENT_OPTIONS}
          onChange={(v) => updateSelectedCard({ vertical_alignment_reference: v })}
        />
      </Field>
      <div className="space-y-1.5 sm:col-span-2">
        <Label>Actions</Label>
        <ContentsToolbar onInsert={handleInsertDirective} />
      </div>
    </form>
  );
}
