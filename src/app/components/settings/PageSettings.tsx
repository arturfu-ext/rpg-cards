/**
 * Page/print settings panel — faithful port of the legacy "Page" accordion
 * panel (generator/index.html:303-542, generator/js/fields/fields_page.js,
 * generator/js/ui.js:481-624).
 */
import { ArrowLeftRight, HelpCircle } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { ColorPicker } from '@/app/components/editor/ColorPicker';
import { useDeckStore } from '@/app/store/deck-store';
import { Button } from '@/components/ui/button';
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
import { Switch } from '@/components/ui/switch';
import { default_card_options } from '@/engine/options';
import { getOrientation } from '@/engine/units';

interface SizePreset {
  value: string;
  label: string;
}

/** generator/index.html:322-328 (#page-size). */
const PAGE_SIZE_PRESETS: SizePreset[] = [
  { value: '210mm,297mm', label: 'A4' },
  { value: '210mm,280mm', label: 'PA4' },
  { value: '8.5in,11in', label: 'US letter' },
  { value: '2.5in,3.5in', label: '2.5" x 3.5"' },
];

/** generator/index.html:346-374 (#card-size); labels kept verbatim. */
const CARD_SIZE_PRESETS: SizePreset[] = [
  { value: '63mm,88mm', label: 'Poker EU, MtG - 63mm × 88mm' },
  { value: '2.5in,3.5in', label: 'Poker US - 2 1/2” × 3 1/2”' },
  { value: '57mm,89mm', label: 'Bridge - 57mm × 89mm' },
  { value: '2.25in,3.5in', label: 'Bridge - 2 1/4” × 3 1/2”' },
  { value: '59mm,92mm', label: 'Standard - 59mm × 92mm' },
  { value: '2.25in,3.5in', label: 'Standard - 2 1/4” × 3 1/2”' },
  { value: '3in,2in', label: 'Standard Small - 3” × 2”' },
  { value: '3.5in,5in', label: 'Standard Large - 3 1/2” × 5”' },
  { value: '3.5in,5.5in', label: 'Standard Jumbo - 3 1/2” × 5 1/2”' },
  { value: '44mm,68mm', label: 'Mini - 44m × 68mm' },
  { value: '1.75in,2.5in', label: 'Mini - 1 3/4” × 2 1/2”' },
  { value: '70mm,120mm', label: 'Tarot - 70mm × 120mm' },
  { value: '2.75in,4.75in', label: 'Tarot - 2 3/4” × 4 3/4”' },
  { value: '89mm,146mm', label: 'Tarot Large - 89mm × 146mm' },
  { value: '3.5in,5.75in', label: 'Tarot Large - 3 1/2” × 5 3/4”' },
  { value: '85mm,55mm', label: 'Business - 85mm × 55mm' },
  { value: '3.5in,2in', label: 'Business - 3 1/2” × 2”' },
  { value: '1.75in,3.5in', label: 'Domino - 1 3/4” × 3 1/2”' },
  { value: '3in,4.5in', label: 'Index Small - 3” × 4 1/2”' },
  { value: '3in,5in', label: 'Index Regular - 3” × 5”' },
  { value: '3in,5.5in', label: 'Index Large - 3” × 5 1/2”' },
  { value: '4.75in,7in', label: 'Index Giant - 4 3/4” × 7”' },
  { value: '3in,3in', label: 'Square Small - 3” × 3”' },
  { value: '3.5in,3.5in', label: 'Square Regular - 3 1/2” × 3 1/2”' },
  { value: '4.75in,4.75in', label: 'Square Large - 4 3/4” × 4 3/4”' },
  { value: '7.5in,5.0in', label: '7 1/2” × 5”' },
];

/** generator/index.html:395-401 (#card-arrangement); labels kept verbatim. */
const ARRANGEMENTS = [
  { value: 'doublesided', label: 'Double sided printing - flip on long edge -' },
  { value: 'front_only', label: 'Front side only' },
  { value: 'side_by_side', label: 'Side by side' },
  { value: 'side_by_side_alt', label: 'Side by side, alternating' },
];

/**
 * Radix Select forbids empty-string item values, so the legacy "Custom"
 * option (value "") gets a sentinel. Preset item values are suffixed with
 * their index because the legacy list repeats "2.25in,3.5in".
 */
const CUSTOM = '__custom__';

function presetItemValue(preset: SizePreset, index: number): string {
  return `${preset.value}#${index}`;
}

function presetRawValue(itemValue: string): string {
  if (itemValue === CUSTOM) return '';
  const raw = itemValue.split('#')[0];
  return raw ?? '';
}

/**
 * ui_set_value_to_format (ui.js:626-638): the select displays the first
 * preset matching width/height in either orientation, else "Custom".
 */
function presetSelectValue(presets: SizePreset[], width: string, height: string): string {
  const portrait = `${width},${height}`;
  const landscape = `${height},${width}`;
  for (let i = 0; i < presets.length; i++) {
    const preset = presets[i];
    if (preset && (preset.value === portrait || preset.value === landscape)) {
      return presetItemValue(preset, i);
    }
  }
  return CUSTOM;
}

function SizePresetSelect({
  id,
  presets,
  width,
  height,
  onValueChange,
}: {
  id: string;
  presets: SizePreset[];
  width: string;
  height: string;
  onValueChange: (rawValue: string) => void;
}) {
  return (
    <Select
      value={presetSelectValue(presets, width, height)}
      onValueChange={(v) => onValueChange(presetRawValue(v))}
    >
      <SelectTrigger id={id} size="sm" className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper">
        {presets.map((preset, i) => (
          <SelectItem key={presetItemValue(preset, i)} value={presetItemValue(preset, i)}>
            {preset.label}
          </SelectItem>
        ))}
        <SelectItem value={CUSTOM}>Custom</SelectItem>
      </SelectContent>
    </Select>
  );
}

function SwapButton({ title, onClick }: { title: string; onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      className="shrink-0"
      title={title}
      aria-label={title}
      onClick={onClick}
    >
      <ArrowLeftRight />
    </Button>
  );
}

function Row({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[6.5rem_1fr] items-center gap-x-3">
      <div className="text-right">{label}</div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function PageSettings() {
  const options = useDeckStore((s) => s.options);
  const settings = useDeckStore((s) => s.settings);
  const setOption = useDeckStore((s) => s.setOption);
  const setSetting = useDeckStore((s) => s.setSetting);
  const setCardSizePreset = useDeckStore((s) => s.setCardSizePreset);
  const setCardDimension = useDeckStore((s) => s.setCardDimension);
  const setZoomField = useDeckStore((s) => s.setZoomField);
  const zoom100 = useDeckStore((s) => s.zoom100);
  const swapOptions = useDeckStore((s) => s.swapOptions);
  const [showBleedInfo, setShowBleedInfo] = useState(false);

  /**
   * ui.js:545-550 / 561-566 else-branch: when page zoom is not 100/100 a card
   * size change re-runs the zoom interlock from the current card zoom width.
   */
  function syncCardZoomAfterSizeChange() {
    const o = useDeckStore.getState().options;
    if (!(o.page_zoom_width === '100' && o.page_zoom_height === '100')) {
      useDeckStore.getState().setZoomField('card_zoom_width', String(o.card_zoom_width));
    }
  }

  /** fields_page.js page-size change: apply the preset keeping orientation. */
  function handlePageSizeChange(rawValue: string) {
    const { page_width, page_height } = options;
    setOption('page_size', rawValue);
    const [w = '', h = ''] = rawValue ? rawValue.split(',') : ['', ''];
    if (getOrientation(page_width, page_height) === 'landscape') {
      setOption('page_width', h);
      setOption('page_height', w);
    } else {
      setOption('page_width', w);
      setOption('page_height', h);
    }
  }

  function handleCardSizeChange(rawValue: string) {
    setCardSizePreset(rawValue);
    syncCardZoomAfterSizeChange();
  }

  /**
   * ui.js:553-567 card_width/card_height case: a direct width/height edit
   * runs the same zoom else-branch as the card-size select.
   */
  function handleCardDimensionChange(key: 'card_width' | 'card_height', value: string) {
    setCardDimension(key, value);
    syncCardZoomAfterSizeChange();
  }

  /**
   * ui_card_rotate (ui.js:486-489) swaps the inputs, which re-triggers the
   * card_width/card_height input handlers: swap, then re-run the dimension
   * sync (zoom + selected-card write) from the post-swap store state.
   */
  function handleCardRotate() {
    swapOptions('card_width', 'card_height');
    const o = useDeckStore.getState().options;
    setCardDimension('card_height', o.card_height);
    syncCardZoomAfterSizeChange();
  }

  /** ui_zoom_rotate (ui.js:496-500). */
  function handleZoomRotate() {
    swapOptions('page_zoom_width', 'page_zoom_height');
    swapOptions('card_zoom_width', 'card_zoom_height');
  }

  /**
   * #reset-page-tab-values, ui_reset_group_tab_values('page') (ui.js:1061-1069):
   * field resets for the registered page fields plus
   * ui_set_page_tab_values(default_card_options()). The legacy version only
   * wrote the zoom/rounded-corners DOM values without updating card_options;
   * with controlled inputs we reset those options too (the value the legacy
   * UI displayed). Zoom defaults land before the card-size cascade so the
   * cascade sees 100/100 and re-syncs card zoom, like a fresh session.
   */
  function handleResetPageTab() {
    if (!window.confirm("Reset the current tab's value?")) return;
    const d = default_card_options();
    setOption('page_size', d.page_size);
    setOption('page_width', d.page_width);
    setOption('page_height', d.page_height);
    setOption('foreground_color', d.foreground_color);
    setOption('background_color', d.background_color);
    setOption('crop_marks', d.crop_marks);
    setOption('card_arrangement', d.card_arrangement);
    setOption('page_rows', d.page_rows);
    setOption('page_columns', d.page_columns);
    setOption('back_bleed_width', d.back_bleed_width);
    setOption('back_bleed_height', d.back_bleed_height);
    setOption('rounded_corners', d.rounded_corners);
    setOption('page_zoom_width', d.page_zoom_width);
    setOption('page_zoom_height', d.page_zoom_height);
    setOption('card_zoom_width', d.card_zoom_width);
    setOption('card_zoom_height', d.card_zoom_height);
    // Last, mirroring $("#card-size").val(...).change() (ui.js:1047): the
    // store cascade keeps the legacy `changed` quirk and selected-card write.
    setCardSizePreset(d.card_size);
  }

  const labelCls = 'text-sm font-medium';
  const subLabelCls = 'text-sm text-muted-foreground';

  return (
    <div className="flex flex-col gap-3 py-2">
      <Row
        label={
          <Label htmlFor="page-size" className={`${labelCls} justify-end`}>
            Page Size
          </Label>
        }
      >
        <SizePresetSelect
          id="page-size"
          presets={PAGE_SIZE_PRESETS}
          width={options.page_width}
          height={options.page_height}
          onValueChange={handlePageSizeChange}
        />
      </Row>
      <Row
        label={
          <span className="text-sm text-muted-foreground italic">
            {getOrientation(options.page_width, options.page_height)}
          </span>
        }
      >
        <div className="flex items-center gap-1.5">
          <Input
            id="page-width"
            className="h-8"
            placeholder="0mm"
            value={options.page_width}
            onChange={(e) => setOption('page_width', e.target.value)}
          />
          <SwapButton
            title="Swap page width and height"
            onClick={() => swapOptions('page_width', 'page_height')}
          />
          <Input
            id="page-height"
            className="h-8"
            placeholder="0mm"
            value={options.page_height}
            onChange={(e) => setOption('page_height', e.target.value)}
          />
        </div>
      </Row>

      <Row
        label={
          <Label htmlFor="card-size" className={`${labelCls} justify-end`}>
            Card Size
          </Label>
        }
      >
        <SizePresetSelect
          id="card-size"
          presets={CARD_SIZE_PRESETS}
          width={options.card_width}
          height={options.card_height}
          onValueChange={handleCardSizeChange}
        />
      </Row>
      <Row
        label={
          <span className="text-sm text-muted-foreground italic">
            {getOrientation(options.card_width, options.card_height)}
          </span>
        }
      >
        <div className="flex items-center gap-1.5">
          <Input
            id="card-width"
            className="h-8"
            placeholder="0mm"
            value={options.card_width}
            onChange={(e) => handleCardDimensionChange('card_width', e.target.value)}
          />
          <SwapButton title="Swap card width and height" onClick={handleCardRotate} />
          <Input
            id="card-height"
            className="h-8"
            placeholder="0mm"
            value={options.card_height}
            onChange={(e) => handleCardDimensionChange('card_height', e.target.value)}
          />
        </div>
      </Row>

      <Row
        label={
          <Label htmlFor="card-arrangement" className={`${labelCls} justify-end`}>
            Arrangement
          </Label>
        }
      >
        <Select
          value={String(options.card_arrangement)}
          onValueChange={(v) => setOption('card_arrangement', v)}
        >
          <SelectTrigger id="card-arrangement" size="sm" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper">
            {ARRANGEMENTS.map((a) => (
              <SelectItem key={a.value} value={a.value}>
                {a.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Row>

      <Row
        label={
          <Label htmlFor="page-columns" className={`${labelCls} justify-end`}>
            Cards/page
          </Label>
        }
      >
        <div className="flex items-center gap-1.5">
          <Input
            id="page-columns"
            className="h-8"
            type="number"
            min={1}
            value={String(options.page_columns)}
            onChange={(e) => setOption('page_columns', e.target.value)}
          />
          <SwapButton
            title="Swap rows and columns"
            onClick={() => swapOptions('page_rows', 'page_columns')}
          />
          <Input
            id="page-rows"
            className="h-8"
            type="number"
            min={1}
            value={String(options.page_rows)}
            onChange={(e) => setOption('page_rows', e.target.value)}
          />
        </div>
      </Row>

      <Row
        label={
          <span className="inline-flex items-center justify-end gap-1">
            <Label htmlFor="back-bleed-width" className={`${labelCls} justify-end`}>
              Bleed
            </Label>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground"
              title="What is bleed?"
              aria-label="What is bleed?"
              onClick={() => setShowBleedInfo((v) => !v)}
            >
              <HelpCircle className="size-3.5" />
            </button>
          </span>
        }
      >
        <div className="flex items-center gap-1.5">
          <Input
            id="back-bleed-width"
            className="h-8"
            placeholder="0mm"
            value={options.back_bleed_width}
            onChange={(e) => setOption('back_bleed_width', e.target.value)}
          />
          <SwapButton
            title="Swap bleed width and height"
            onClick={() => swapOptions('back_bleed_width', 'back_bleed_height')}
          />
          <Input
            id="back-bleed-height"
            className="h-8"
            placeholder="0mm"
            value={options.back_bleed_height}
            onChange={(e) => setOption('back_bleed_height', e.target.value)}
          />
        </div>
      </Row>
      {showBleedInfo && (
        <Row label={<span />}>
          <p className="text-xs text-muted-foreground">
            The values entered are TOTAL bleed. For example, entering 4 mm as horizontal bleed adds
            2 mm to the left and 2 mm to the right.
          </p>
        </Row>
      )}

      <Row
        label={
          <Label htmlFor="foreground-color" className={`${labelCls} justify-end`}>
            Front color
          </Label>
        }
      >
        <ColorPicker
          value={options.foreground_color}
          onChange={(value) => setOption('foreground_color', value)}
        />
      </Row>
      <Row
        label={
          <Label htmlFor="background-color" className={`${labelCls} justify-end`}>
            Back color
          </Label>
        }
      >
        <ColorPicker
          value={options.background_color}
          onChange={(value) => setOption('background_color', value)}
        />
      </Row>

      <Separator />

      <Row label={<span className={labelCls}>Zoom</span>}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Switch
              id="page-zoom-keep-ratio"
              checked={settings.page_zoom_keep_ratio}
              onCheckedChange={(v) => setSetting('page_zoom_keep_ratio', v)}
            />
            <Label htmlFor="page-zoom-keep-ratio" className="font-normal">
              Keep aspect ratio
            </Label>
          </div>
          <Button type="button" variant="link" size="xs" className="px-0" onClick={zoom100}>
            100%
          </Button>
        </div>
      </Row>
      <Row
        label={
          <Label htmlFor="page-zoom-width" className={`${subLabelCls} justify-end font-normal`}>
            Perc. (%)
          </Label>
        }
      >
        <div className="flex items-center gap-1.5">
          <Input
            id="page-zoom-width"
            className="h-8"
            type="number"
            placeholder="0"
            value={String(options.page_zoom_width)}
            onChange={(e) => setZoomField('page_zoom_width', e.target.value)}
          />
          <SwapButton title="Swap zoom width and height" onClick={handleZoomRotate} />
          <Input
            id="page-zoom-height"
            className="h-8"
            type="number"
            placeholder="0"
            value={String(options.page_zoom_height)}
            onChange={(e) => setZoomField('page_zoom_height', e.target.value)}
          />
        </div>
      </Row>
      <Row
        label={
          <Label htmlFor="card-zoom-width" className={`${subLabelCls} justify-end font-normal`}>
            Card size
          </Label>
        }
      >
        <div className="flex items-center gap-1.5">
          <Input
            id="card-zoom-width"
            className="h-8"
            value={options.card_zoom_width}
            onChange={(e) => setZoomField('card_zoom_width', e.target.value)}
          />
          <SwapButton title="Swap zoom width and height" onClick={handleZoomRotate} />
          <Input
            id="card-zoom-height"
            className="h-8"
            value={options.card_zoom_height}
            onChange={(e) => setZoomField('card_zoom_height', e.target.value)}
          />
        </div>
      </Row>

      <Separator />

      <Row label={<span className={labelCls}>Other</span>}>
        <div className="flex items-center gap-2">
          <Switch
            id="rounded-corners"
            checked={options.rounded_corners}
            onCheckedChange={(v) => setOption('rounded_corners', v)}
          />
          <Label htmlFor="rounded-corners" className="font-normal">
            Rounded card corners
          </Label>
        </div>
      </Row>
      <Row label={<span />}>
        <div className="flex items-center gap-2">
          <Switch
            id="crop-marks"
            checked={options.crop_marks}
            onCheckedChange={(v) => setOption('crop_marks', v)}
          />
          <Label htmlFor="crop-marks" className="font-normal">
            Crop marks
          </Label>
        </div>
      </Row>
      <Row
        label={
          <Label htmlFor="card-count-override" className={`${labelCls} justify-end`}>
            Count override
          </Label>
        }
      >
        <Input
          id="card-count-override"
          className="h-8"
          type="number"
          min={0}
          placeholder="per-card count"
          title="When set, overrides each card's own count"
          value={options.card_count ?? ''}
          onChange={(e) =>
            setOption('card_count', e.target.value === '' ? null : Number(e.target.value))
          }
        />
      </Row>

      <Separator />

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        onClick={handleResetPageTab}
      >
        Restore this tab's default values
      </Button>
    </div>
  );
}
