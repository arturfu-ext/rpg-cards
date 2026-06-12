/**
 * App-level settings, stored under the legacy `app_settings` localStorage key
 * (shape must stay identical for backward compatibility — ui.js:6-14).
 */
export interface AppSettings {
  file_name: string;
  browser_asks_where_save: boolean;
  open_save_dialog: boolean;
  show_download_settings: boolean;
  page_zoom_keep_ratio: boolean;
}

export function default_app_settings(): AppSettings {
  return {
    file_name: 'rpg_cards',
    browser_asks_where_save: false,
    open_save_dialog: false,
    show_download_settings: true,
    page_zoom_keep_ratio: true,
  };
}
