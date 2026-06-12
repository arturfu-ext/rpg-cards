/**
 * File/app settings panel — the settings half of the legacy "File" accordion
 * panel (generator/index.html:96-205, generator/js/fields/fields_file.js).
 * The Download/Open/Add/Help buttons live with the deck toolbar.
 */
import { useDeckStore } from '@/app/store/deck-store';
import { default_app_settings } from '@/app/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

const downloadSettingsAvailable = typeof window !== 'undefined' && 'showSaveFilePicker' in window;

export function FileSettings() {
  const settings = useDeckStore((s) => s.settings);
  const setSetting = useDeckStore((s) => s.setSetting);

  /**
   * fields_file.js interlock (intended semantics — the legacy handler reads
   * the nonexistent `app_settings.save_file_dialog`, an obvious typo for
   * `open_save_dialog`): turning the save dialog off also turns off
   * "browser asks where to save".
   */
  function handleOpenSaveDialogChange(checked: boolean) {
    setSetting('open_save_dialog', checked);
    if (!checked) setSetting('browser_asks_where_save', false);
  }

  /** fields_file.js:15-17 — enabling this forces the save dialog on. */
  function handleBrowserAsksChange(checked: boolean) {
    setSetting('browser_asks_where_save', checked);
    if (checked) setSetting('open_save_dialog', true);
  }

  return (
    <div className="flex flex-col gap-4 py-2">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="file-name">File name</Label>
        <Input
          id="file-name"
          placeholder="File name"
          value={settings.file_name}
          onChange={(e) => setSetting('file_name', e.target.value)}
          onFocus={(e) => e.target.select()}
          onBlur={(e) => {
            // fields_file.js blur handler: an empty name resets to default.
            if (!e.target.value) setSetting('file_name', default_app_settings().file_name);
          }}
        />
      </div>

      <div>
        <Button
          type="button"
          variant="link"
          size="xs"
          className="px-0"
          onClick={() => setSetting('show_download_settings', !settings.show_download_settings)}
        >
          {settings.show_download_settings ? 'Hide settings' : 'Show settings'}
        </Button>

        {settings.show_download_settings &&
          (downloadSettingsAvailable ? (
            <div className="flex flex-col gap-4">
              <p className="text-xs text-muted-foreground italic">
                Please note that changing one of these settings may automatically adjust another.
              </p>
              <div className="flex items-start justify-between gap-3">
                <Label htmlFor="open-save-dialog" className="font-normal leading-snug">
                  Would you like to select the save location each time you save a file?
                </Label>
                <Switch
                  id="open-save-dialog"
                  checked={settings.open_save_dialog}
                  onCheckedChange={handleOpenSaveDialogChange}
                />
              </div>
              <div className="rounded-md border bg-muted/40 p-3">
                <div className="flex items-start justify-between gap-3">
                  <Label htmlFor="browser-asks-where-save" className="font-normal leading-snug">
                    Is your browser set to ask where to save files before downloading?
                  </Label>
                  <Switch
                    id="browser-asks-where-save"
                    checked={settings.browser_asks_where_save}
                    onCheckedChange={handleBrowserAsksChange}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Ensure this matches your browser download settings; otherwise, the save dialog may
                  behave unexpectedly.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-xs text-muted-foreground">
              <p>
                Download settings are not available. This may be because the browser lacks necessary
                features (window.showSaveFilePicker) or the page isn't being used in a{' '}
                <a
                  href="https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts"
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  secure context
                </a>
                .
              </p>
              <p>
                In your browser's download settings, you can choose whether to be asked where to
                save each file and set a default download location.
              </p>
            </div>
          ))}
      </div>
    </div>
  );
}
