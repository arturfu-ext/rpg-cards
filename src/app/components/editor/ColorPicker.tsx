/**
 * Reusable color picker mirroring the legacy colorselector dropdown + free
 * text input pair: a swatch grid of the named card colors plus a raw text
 * field that accepts (and propagates) any string, valid CSS color or not.
 */
import { Check } from 'lucide-react';
import { useState } from 'react';
import tinycolor from 'tinycolor2';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { card_colors } from '@/engine/colors';
import { cn } from '@/lib/utils';

export interface ColorPickerProps {
  value: string;
  onChange: (v: string) => void;
  /**
   * Offer a "default (inherit)" option that clears the value to ''.
   * Defaults to true: the legacy colorselector built its options from the
   * full card_colors map, whose '' entry made inherit available everywhere.
   */
  allowEmpty?: boolean;
}

/** Named card colors from the legacy colorselector (the '' entry is the inherit option). */
const COLOR_NAMES: readonly string[] = Object.keys(card_colors).filter((name) => name !== '');

function isValidColor(input: string): boolean {
  return input !== '' && tinycolor(input).isValid();
}

function Swatch({ color, className }: { color: string; className?: string }) {
  const valid = isValidColor(color);
  return (
    <span
      aria-hidden="true"
      className={cn('inline-block size-4 shrink-0 rounded-sm border border-border', className)}
      style={
        valid
          ? { backgroundColor: color }
          : color === ''
            ? {
                // Checkerboard for "default / inherit".
                backgroundImage: 'repeating-conic-gradient(#e5e5e5 0% 25%, #ffffff 0% 50%)',
                backgroundSize: '8px 8px',
              }
            : {
                // Red slash marks an unrecognized free-text value.
                backgroundImage:
                  'linear-gradient(to top right, transparent 45%, #ef4444 46%, #ef4444 54%, transparent 55%)',
              }
      }
    />
  );
}

export function ColorPicker({ value, onChange, allowEmpty = true }: ColorPickerProps) {
  const [open, setOpen] = useState(false);

  const trimmed = value.trim();
  const isInvalid = trimmed !== '' && !tinycolor(trimmed).isValid();

  function pick(next: string) {
    onChange(next);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full min-w-0 justify-start gap-2 px-3 font-normal"
        >
          <Swatch color={trimmed} />
          <span className={cn('truncate', trimmed === '' && 'text-muted-foreground')}>
            {trimmed === '' ? 'default' : trimmed}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Swatch color={trimmed} />
            <Input
              value={value}
              onChange={(event) => onChange(event.target.value)}
              placeholder="Color name or CSS value"
              aria-label="Color value"
              aria-invalid={isInvalid}
              spellCheck={false}
              className={cn(
                'h-8 min-w-0 flex-1',
                isInvalid && 'border-destructive focus-visible:ring-destructive/30',
              )}
            />
          </div>
          {isInvalid && (
            <p className="text-destructive text-xs">Not a recognized CSS color — used as-is.</p>
          )}
          {allowEmpty && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="justify-start gap-2 font-normal"
              onClick={() => pick('')}
            >
              <Swatch color="" />
              Default (inherit)
            </Button>
          )}
          <TooltipProvider delayDuration={200} skipDelayDuration={100}>
            <ScrollArea className="h-56">
              <div
                className="grid grid-cols-8 gap-1 p-0.5 pr-3"
                role="listbox"
                aria-label="Named colors"
              >
                {COLOR_NAMES.map((name) => {
                  const isCurrent = trimmed.toLowerCase() === name.toLowerCase();
                  return (
                    <Tooltip key={name}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          role="option"
                          aria-selected={isCurrent}
                          aria-label={name}
                          onClick={() => pick(name)}
                          className={cn(
                            'flex aspect-square w-full items-center justify-center rounded-sm border border-black/15 outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring',
                            isCurrent && 'ring-2 ring-ring ring-offset-1',
                          )}
                          style={{ backgroundColor: name }}
                        >
                          {isCurrent && (
                            <Check
                              className={cn(
                                'size-3.5',
                                tinycolor(name).isLight() ? 'text-black' : 'text-white',
                              )}
                            />
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top">{name}</TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </ScrollArea>
          </TooltipProvider>
        </div>
      </PopoverContent>
    </Popover>
  );
}
