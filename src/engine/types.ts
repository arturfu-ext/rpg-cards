/**
 * Card engine types.
 *
 * This module is part of the pure TypeScript port of the legacy card engine
 * (generator/js/cards.js). The port is near-verbatim: legacy snake_case names,
 * string-building style, and output HTML are preserved exactly so that golden
 * master tests can compare output byte-for-byte against the legacy engine.
 *
 * Field types mirror the JSON deck format, where almost everything is an
 * optional string (the legacy UI writes empty strings for unset fields).
 */

/** A single card in a deck, as stored in deck JSON files. */
export interface Card {
  /** Number of copies to print. */
  count?: number;
  title: string;
  contents: string[];
  tags: string[];
  /** Editor-only identity; stripped on save. */
  uuid?: string;
  /** Overrides `title` for display purposes only. */
  title_display?: string;
  /** Title font size, e.g. "13"; falls back to options.default_title_size. */
  title_size?: string;
  title_color?: string;
  color_front?: string;
  color_back?: string;
  /** Optional type label rendered next to the title. */
  card_type?: string;
  /** Space-separated list of front header icon names. */
  icon_front?: string;
  /** When set, front header icons are colorized via CSS mask. */
  icon_front_color?: string;
  icon_back?: string;
  icon_back_container?: 'rounded-square' | 'square' | 'circle' | 'none' | string;
  icon_back_rotation?: string | number;
  /** URL of a back-face background image; replaces the back icon. */
  background_image?: string;
  /** Content font size: "8".."12" or "smaller"; "inherit"/"" mean default. */
  card_font_size?: string;
  /** "none" hides the card header. */
  header_show?: string;
  /** "content-area" switches the vertical alignment reference. */
  vertical_alignment_reference?: string;
}

export type Arrangement = 'doublesided' | 'front_only' | 'side_by_side' | 'side_by_side_alt';

/**
 * Deck/page options, as stored in the `card_options` localStorage key and
 * produced by default_card_options(). Numeric-looking values are stored as
 * strings by the legacy UI; the engine converts at use sites exactly where the
 * legacy engine relied on implicit coercion.
 */
export interface CardOptions {
  foreground_color: string;
  background_color: string;
  default_color_front: string;
  default_color_back: string;
  default_icon_front: string;
  default_icon_back: string;
  default_icon_back_container: string;
  /** Referenced by card_data_icon_back_rotation; absent from legacy defaults. */
  default_icon_back_rotation?: string | number;
  /** Referenced by card_data_back_image; absent from legacy defaults. */
  default_background_image?: string;
  default_title_size: string;
  default_title_color: string;
  default_card_font_size: string;
  vertical_alignment_reference: string;
  page_size: string;
  page_width: string;
  page_height: string;
  page_rows: string | number;
  page_columns: string | number;
  page_zoom_width: string | number;
  page_zoom_height: string | number;
  card_arrangement: Arrangement | string;
  card_size: string;
  card_width: string;
  card_height: string;
  card_zoom_width: string;
  card_zoom_height: string;
  /** When set, overrides each card's own count. */
  card_count: number | null;
  icon_inline: boolean;
  rounded_corners: boolean;
  back_bleed_width: string;
  back_bleed_height: string;
  card_type: string;
  crop_marks: boolean;
}

/**
 * Host context injected into the engine. This replaces the two places where
 * the legacy engine reached into the DOM, keeping the port pure:
 *
 * 1. cards.js card_element_icon (lines 155-188) created a hidden <img> with
 *    class `icon-NAME` and read the resolved background-image URL from the
 *    CSS cascade. `iconUrl` provides that URL from the generated icon
 *    manifest instead.
 * 2. cards.js card_generate_back (lines 1192-1200) rendered a temporary back
 *    card and measured `.card-back-inner` with jQuery to size the icon
 *    container. `measureBackInner` provides that measurement (DOM-based in
 *    the app, fixture-derived in tests).
 */
export interface EngineContext {
  /**
   * Resolve an icon name to its image URL, or null when the icon is unknown
   * (mirroring the legacy computed-style miss). The returned URL must be the
   * percent-encoded `new URL(...).href` form so output matches the legacy
   * engine byte-for-byte.
   */
  iconUrl(name: string): string | null;
  /**
   * Content-box size in CSS pixels of `.card-back-inner` inside a temporary
   * back card rendered with the given HTML (a bare back card produced by
   * card_generate_back_html({ card_style })). Mirrors jQuery .width()/.height().
   */
  measureBackInner(tempCardHtml: string): { width: number; height: number };
}

/** Result of card_pages_generate_html. */
export interface GeneratedPages {
  /** A <style> tag containing the @page rule. */
  style: string;
  /** The concatenated <page> elements. */
  html: string;
  /** Pages as arrays of card HTML strings (used by the crop-mark pass). */
  pages: string[][];
}

/** Signature shared by all card_element_* directive generators. */
export type ElementGenerator = (
  params: string[],
  card_data: Card,
  options: CardOptions,
  ctx: EngineContext,
) => string;
