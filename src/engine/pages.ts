import {
  add_size_to_style,
  card_generate_back,
  card_generate_empty,
  card_generate_front,
  card_repeat,
} from './card';
import { default_card_options } from './options';
import type { Card, CardOptions, EngineContext, GeneratedPages } from './types';
import { getOrientation } from './units';

// ============================================================================
// Functions that generate pages of cards
// ============================================================================

export function card_pages_split(
  data: string[],
  rows: string | number,
  cols: string | number,
): string[][] {
  // Number() — legacy multiplies the string-valued options (cards.js:1258)
  const cards_per_page = Number(rows) * Number(cols);
  const result = [];
  for (let i = 0; i < data.length; i += cards_per_page) {
    const page = data.slice(i, i + cards_per_page);
    result.push(page);
  }
  return result;
}

export function card_pages_merge(front_pages: string[][], back_pages: string[][]): string[][] {
  const result = [];
  for (let i = 0; i < front_pages.length; ++i) {
    // non-null — i is in range of both arrays (cards.js:1269-1271)
    result.push(front_pages[i]!);
    result.push(back_pages[i]!);
  }
  return result;
}

export function card_pages_add_padding(
  cards: string[],
  options: CardOptions,
  is_back: boolean,
): string[] {
  // Number() — legacy multiplies the string-valued options (cards.js:1277)
  const cards_per_page = Number(options.page_rows) * Number(options.page_columns);
  const last_page_cards = cards.length % cards_per_page;
  if (last_page_cards !== 0) {
    return cards.concat(card_generate_empty(cards_per_page - last_page_cards, options, is_back));
  } else {
    return cards;
  }
}

export function card_pages_interleave_cards(
  front_cards: string[],
  back_cards: string[],
  options: CardOptions,
): string[] {
  const result = [];
  let i = 0;
  while (i < front_cards.length) {
    // non-null — i is in range of both arrays (cards.js:1292-1293)
    result.push(front_cards[i]!);
    result.push(back_cards[i]!);
    // Number() — legacy compares/subtracts the string-valued option (cards.js:1294-1296)
    if (Number(options.page_columns) > 2) {
      result.push(
        // legacy pushes the string[] itself; the later page join("\n") stringifies it with commas (cards.js:1295-1297)
        card_generate_empty(Number(options.page_columns) - 2, options, false) as unknown as string,
      );
    }
    ++i;
  }
  return result;
}

export function card_pages_interleave_cards_alt(
  front_cards: string[],
  back_cards: string[],
  options: CardOptions,
): string[] {
  const result = [];
  let i = 0;
  while (i < front_cards.length) {
    if (i % 2) {
      // non-null — i is in range of both arrays (cards.js:1309-1313)
      result.push(back_cards[i]!);
      result.push(front_cards[i]!);
    } else {
      result.push(front_cards[i]!);
      result.push(back_cards[i]!);
    }
    // Number() — legacy compares/subtracts the string-valued option (cards.js:1315-1317)
    if (Number(options.page_columns) > 2) {
      result.push(
        // legacy pushes the string[] itself; the later page join("\n") stringifies it with commas (cards.js:1316-1318)
        card_generate_empty(Number(options.page_columns) - 2, options, false) as unknown as string,
      );
    }
    ++i;
  }
  return result;
}

export function card_pages_wrap(pages: string[][], options: CardOptions): string {
  // force portrait layout then rotate if landscape
  const orientation = getOrientation(options.page_width, options.page_height);
  const pageWidth = options.page_width;
  const pageHeight = options.page_height;

  let result = '';
  for (let i = 0; i < pages.length; ++i) {
    let style = 'style="';
    if (options.card_arrangement === 'doublesided' && i % 2 === 1) {
      style += 'background-color:' + options.background_color + ';';
    } else {
      style += 'background-color:' + options.foreground_color + ';';
    }
    style += '"';
    style = add_size_to_style(style, pageWidth, pageHeight);

    // Number() — legacy divides the string-valued options (cards.js:1346-1347)
    const zw = Number(options.page_zoom_width) / 100;
    const zh = Number(options.page_zoom_height) / 100;
    let zoomStyle = 'style="';
    zoomStyle += `transform: scale(${zw}, ${zh});`;
    if (options.card_arrangement === 'doublesided' && i % 2 === 1) {
      zoomStyle += 'flex-direction:' + 'row-reverse' + ';';
    }
    zoomStyle += '"';
    zoomStyle = add_size_to_style(
      zoomStyle,
      `calc((${options.card_width} + ${options.back_bleed_width}) * ${options.page_columns})`,
      `calc((${options.card_height} + ${options.back_bleed_height}) * ${options.page_rows})`,
    );

    result += '<page class="page page-preview ' + orientation + '" ' + style + '>\n';
    result += '<div class="page-zoom page-zoom-preview" ' + zoomStyle + '>\n';
    // non-null — i is in range (cards.js:1363)
    result += pages[i]!.join('\n');
    result += '</div>\n';
    result += '</page>\n';
  }
  return result;
}

export function card_pages_generate_style(options: CardOptions): string {
  const result = `
  @page {
      margin: 0;
      size:${options.page_width} ${options.page_height};
      print-color-adjust: exact;
  }
  `;
  return `<style>${result}</style>`;
}

export function card_pages_generate_html(
  card_data: Card[],
  options: CardOptions | null | undefined,
  ctx: EngineContext,
): GeneratedPages {
  const defaultOptions = default_card_options();
  options = options || defaultOptions;
  const rows = options.page_rows || defaultOptions.page_rows;
  const cols = options.page_columns || defaultOptions.page_columns;

  // Generate the HTML for each card
  let front_cards: string[] = [];
  let back_cards: string[] = [];
  card_data.forEach((data) => {
    // options! — non-null after the reassignment above; TS drops the narrowing inside closures (cards.js:1390-1396)
    const count = options!.card_count || data.count || 1;
    const front = card_generate_front(data, options!, { isPreview: false }, ctx);
    const back = card_generate_back(data, options!, { isPreview: false }, ctx);
    front_cards = front_cards.concat(card_repeat(front, count));
    back_cards = back_cards.concat(card_repeat(back, count));
  });

  let pages: string[][] = [];
  if (options.card_arrangement === 'doublesided') {
    // Add padding cards so that the last page is full of cards
    front_cards = card_pages_add_padding(front_cards, options, false);
    back_cards = card_pages_add_padding(back_cards, options, true);
    // Split cards to pages
    const front_pages = card_pages_split(front_cards, rows, cols);
    const back_pages = card_pages_split(back_cards, rows, cols);
    // Interleave front and back pages so that we can print double-sided
    pages = card_pages_merge(front_pages, back_pages);
  } else if (options.card_arrangement === 'front_only') {
    const cards = card_pages_add_padding(front_cards, options, false);
    pages = card_pages_split(cards, rows, cols);
  } else if (options.card_arrangement === 'side_by_side') {
    let cards = card_pages_interleave_cards(front_cards, back_cards, options);
    cards = card_pages_add_padding(cards, options, false);
    pages = card_pages_split(cards, rows, cols);
  } else if (options.card_arrangement === 'side_by_side_alt') {
    let cards = card_pages_interleave_cards_alt(front_cards, back_cards, options);
    cards = card_pages_add_padding(cards, options, false);
    pages = card_pages_split(cards, rows, cols);
  }

  return {
    style: card_pages_generate_style(options),
    html: card_pages_wrap(pages, options),
    pages,
  };
}
