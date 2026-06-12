/**
 * Card defaults panel — faithful port of the legacy "Default" accordion panel
 * (generator/index.html:545-754). Each default option has an adjacent apply
 * button copying it onto every card (ui.js:815-883).
 */
import { ChevronRight } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { ColorPicker } from '@/app/components/editor/ColorPicker';
import { IconPicker } from '@/app/components/editor/IconPicker';
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

/** generator/index.html:564-572 (#default-title-size). */
const TITLE_SIZES = [
  { value: '16', label: '16pt' },
  { value: '15', label: '15pt' },
  { value: '14', label: '14pt' },
  { value: '13', label: '13pt (initial)' },
  { value: '12', label: '12pt' },
  { value: '11', label: '11pt' },
  { value: '10', label: '10pt' },
];

/** generator/index.html:595-603 (#default-card-font-size). */
const CARD_FONT_SIZES = [
  { value: '12', label: '12px (initial)' },
  { value: '11', label: '11px' },
  { value: 'inherit', label: '10.66px (inherit: 8pt)' },
  { value: '10', label: '10px' },
  { value: '9', label: '9px' },
  { value: 'smaller', label: '8.88px (smaller)' },
  { value: '8', label: '8px' },
];

/** generator/index.html:698-703 (#default-icon-back-container). */
const ICON_BACK_CONTAINERS = [
  { value: 'none', label: 'None' },
  { value: 'square', label: 'Square' },
  { value: 'rounded-square', label: 'Rounded square' },
  { value: 'circle', label: 'Circle' },
];

function ApplyButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      className="shrink-0"
      title="Apply to all cards"
      aria-label="Apply to all cards"
      onClick={onClick}
    >
      <ChevronRight />
    </Button>
  );
}

function Row({
  label,
  children,
  apply,
}: {
  label: ReactNode;
  children: ReactNode;
  apply?: () => void;
}) {
  return (
    <div className="grid grid-cols-[6.5rem_1fr_auto] items-center gap-x-2">
      <div className="text-right">{label}</div>
      <div className="min-w-0">{children}</div>
      <div className="w-8">{apply ? <ApplyButton onClick={apply} /> : null}</div>
    </div>
  );
}

export function DefaultsSettings() {
  const options = useDeckStore((s) => s.options);
  const setOption = useDeckStore((s) => s.setOption);
  const applyDefaultToAllCards = useDeckStore((s) => s.applyDefaultToAllCards);
  const [dangerZoneOpen, setDangerZoneOpen] = useState(false);

  /**
   * #reset-default-tab-values, ui_reset_group_tab_values('default')
   * (ui.js:1061-1069): field resets for the registered default fields plus
   * ui_set_default_tab_values(default_card_options()). Legacy only wrote the
   * DOM for the unregistered fields; with controlled inputs we reset those
   * options to what the legacy UI displayed. icon_inline and
   * default_icon_back_rotation are untouched, exactly like legacy.
   */
  function handleResetDefaultTab() {
    if (!window.confirm("Reset the current tab's value?")) return;
    const d = default_card_options();
    setOption('default_color_front', d.default_color_front);
    setOption('default_color_back', d.default_color_back);
    setOption('default_title_size', d.default_title_size);
    setOption('default_title_color', d.default_title_color);
    setOption('default_icon_front', d.default_icon_front);
    setOption('default_icon_back', d.default_icon_back);
    setOption('default_icon_back_container', d.default_icon_back_container);
    setOption('default_card_font_size', d.default_card_font_size);
    setOption('default_background_image', d.default_background_image);
  }

  /** #clear-all in the legacy Danger Zone (ui.js:1030-1035). */
  function handleClearAllSavedData() {
    if (
      !window.confirm(
        'Delete all saved data?\n\nThis will reset the entire app to its original state and erase all saved cards and settings.\n\nMake sure you’ve downloaded your cards before continuing.',
      )
    ) {
      return;
    }
    localStorage.clear();
    window.location.reload();
  }

  const labelCls = 'text-sm font-medium justify-end';

  return (
    <div className="flex flex-col gap-3 py-2">
      <Row
        label={
          <Label htmlFor="default-title-size" className={labelCls}>
            Title size
          </Label>
        }
        apply={() => applyDefaultToAllCards('title_size', 'default_title_size')}
      >
        <Select
          value={options.default_title_size}
          onValueChange={(v) => setOption('default_title_size', v)}
        >
          <SelectTrigger id="default-title-size" size="sm" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper">
            {TITLE_SIZES.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Row>

      <Row
        label={
          <Label htmlFor="default-title-color" className={labelCls}>
            Title color
          </Label>
        }
        apply={() => applyDefaultToAllCards('title_color', 'default_title_color')}
      >
        <ColorPicker
          value={options.default_title_color}
          onChange={(value) => setOption('default_title_color', value)}
        />
      </Row>

      <Row
        label={
          <Label htmlFor="default-card-font-size" className={labelCls}>
            Text size
          </Label>
        }
        apply={() => applyDefaultToAllCards('card_font_size', 'default_card_font_size')}
      >
        <Select
          value={options.default_card_font_size}
          onValueChange={(v) => setOption('default_card_font_size', v)}
        >
          <SelectTrigger id="default-card-font-size" size="sm" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper">
            {CARD_FONT_SIZES.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Row>

      <Row
        label={
          <Label htmlFor="default-color-front" className={labelCls}>
            Front color
          </Label>
        }
        apply={() => applyDefaultToAllCards('color_front', 'default_color_front')}
      >
        <ColorPicker
          value={options.default_color_front}
          onChange={(value) => setOption('default_color_front', value)}
        />
      </Row>

      <Row
        label={
          <Label htmlFor="default-icon-front" className={labelCls}>
            Front icon
          </Label>
        }
        apply={() => applyDefaultToAllCards('icon_front', 'default_icon_front')}
      >
        <IconPicker
          value={options.default_icon_front}
          onChange={(value) => setOption('default_icon_front', value)}
          placeholder="Icon name"
        />
      </Row>

      <Row label={<span />}>
        {/* Legacy "Use small icons" checkbox (#small-icons, ui.js:763-766). */}
        <div className="flex items-center gap-2">
          <Switch
            id="icon-inline"
            checked={options.icon_inline}
            onCheckedChange={(v) => setOption('icon_inline', v)}
          />
          <Label htmlFor="icon-inline" className="font-normal">
            Use small icons
          </Label>
        </div>
      </Row>

      <Row
        label={
          <Label htmlFor="default-color-back" className={labelCls}>
            Back color
          </Label>
        }
        apply={() => applyDefaultToAllCards('color_back', 'default_color_back')}
      >
        <ColorPicker
          value={options.default_color_back}
          onChange={(value) => setOption('default_color_back', value)}
        />
      </Row>

      <Row
        label={
          <Label htmlFor="default-icon-back" className={labelCls}>
            Back icon
          </Label>
        }
        apply={() => applyDefaultToAllCards('icon_back', 'default_icon_back')}
      >
        <IconPicker
          value={options.default_icon_back}
          onChange={(value) => setOption('default_icon_back', value)}
          placeholder="Default front icon"
        />
      </Row>

      <Row
        label={
          <Label
            htmlFor="default-icon-back-rotation"
            className="justify-end text-sm font-normal text-muted-foreground"
          >
            Rotation (°)
          </Label>
        }
        apply={() => applyDefaultToAllCards('icon_back_rotation', 'default_icon_back_rotation')}
      >
        <Input
          id="default-icon-back-rotation"
          className="h-8"
          type="number"
          min={-360}
          max={360}
          placeholder="0"
          value={String(options.default_icon_back_rotation ?? '')}
          onChange={(e) => setOption('default_icon_back_rotation', e.target.value)}
        />
      </Row>

      <Row
        label={
          <Label
            htmlFor="default-icon-back-container"
            className="justify-end text-sm font-normal text-muted-foreground"
          >
            Container
          </Label>
        }
        apply={() => applyDefaultToAllCards('icon_back_container', 'default_icon_back_container')}
      >
        <Select
          value={options.default_icon_back_container}
          onValueChange={(v) => setOption('default_icon_back_container', v)}
        >
          <SelectTrigger id="default-icon-back-container" size="sm" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper">
            {ICON_BACK_CONTAINERS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Row>

      <Row
        label={
          <Label htmlFor="default-card-background" className={labelCls}>
            Back image
          </Label>
        }
        apply={() => applyDefaultToAllCards('background_image', 'default_background_image')}
      >
        <Input
          id="default-card-background"
          className="h-8"
          value={options.default_background_image ?? ''}
          onChange={(e) => setOption('default_background_image', e.target.value)}
        />
      </Row>

      <div className="space-y-2 text-xs text-muted-foreground">
        <p>
          An attribute's default value will be applied to cards that are missing a value for that
          specific attribute. These default values are stored in the browser but not in the file
          saved using the "Download" button.
        </p>
        <p>
          Press the "&gt;" button to overwrite existing attribute values on each card. These values
          will be stored in the file.
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        onClick={handleResetDefaultTab}
      >
        Restore this tab's default values
      </Button>

      <Separator />

      {/* Legacy Danger Zone (generator/index.html:737-752). */}
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="link"
          size="xs"
          className="self-start px-0"
          onClick={() => setDangerZoneOpen((v) => !v)}
        >
          {dangerZoneOpen ? 'Hide Danger Zone' : 'Show Danger Zone'}
        </Button>
        {dangerZoneOpen && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="w-full"
            onClick={handleClearAllSavedData}
          >
            CLEAR ALL
          </Button>
        )}
      </div>
    </div>
  );
}
