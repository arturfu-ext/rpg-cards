import type { Card, CardOptions } from './types';

export function default_card_options(): CardOptions {
  return {
    foreground_color: 'white',
    background_color: 'white',
    default_color_front: 'black',
    default_color_back: '',
    default_icon_front: '',
    default_icon_back: '',
    default_icon_back_container: 'rounded-square',
    default_title_size: '13',
    default_title_color: 'white',
    default_card_font_size: 'inherit',
    vertical_alignment_reference: '',
    page_size: '210mm,297mm',
    page_width: '210mm',
    page_height: '297mm',
    page_rows: '3',
    page_columns: '3',
    page_zoom_width: '100',
    page_zoom_height: '100',
    card_arrangement: 'doublesided',
    card_size: '63mm,88mm',
    card_width: '63mm',
    card_height: '88mm',
    card_zoom_width: '63mm',
    card_zoom_height: '88mm',
    card_count: null,
    icon_inline: true,
    rounded_corners: true,
    back_bleed_width: '2mm',
    back_bleed_height: '2mm',
    card_type: '',
    crop_marks: true,
  };
}

export function default_card_data(): Card {
  return {
    count: 1,
    title: '',
    contents: [],
    tags: [],
  };
}

export function card_init(card: Partial<Card>): Card {
  return {
    ...card,
    title: card.title || '',
    contents: card.contents || [],
    tags: card.tags || [],
  };
}

export function card_has_tag(card: Card, tag: string): boolean {
  tag = tag.trim().toLowerCase();
  const index = card.tags.indexOf(tag);
  return index > -1;
}

export function card_add_tag(card: Card, tag: string): void {
  tag = tag.trim().toLowerCase();
  const index = card.tags.indexOf(tag);
  if (index === -1) {
    card.tags.push(tag);
  }
}

export function card_remove_tag(card: Card, tag: string): void {
  tag = tag.trim().toLowerCase();
  card.tags = card.tags.filter((t) => tag !== t);
}

export function card_data_color_front(card_data: Card, options: CardOptions): string {
  return card_data.color_front || options.default_color_front;
}

export function card_data_color_back(card_data: Card, options: CardOptions): string {
  return (
    card_data.color_back ||
    options.default_color_back ||
    card_data.color_front ||
    options.default_color_front
  );
}

export function card_data_icon_front(card_data: Card, options: CardOptions): string {
  return card_data.icon_front || options.default_icon_front || '';
}

export function card_data_icon_back(card_data: Card, options: CardOptions): string {
  return card_data.icon_back || options.default_icon_back || '';
}

export function card_data_icon_back_container(card_data: Card, options: CardOptions): string {
  return card_data.icon_back_container || options.default_icon_back_container || '';
}

export function card_data_icon_back_rotation(
  card_data: Card,
  options: CardOptions,
): string | number {
  return card_data.icon_back_rotation || options.default_icon_back_rotation || '';
}

export function card_data_back_image(card_data: Card, options: CardOptions): string {
  return card_data.background_image || options.default_background_image || '';
}

export function card_data_split_params(value: string): string[] {
  return value.split('|').map((str) => str.trim());
}

export function card_element_class(card_data: Card, options: CardOptions): string {
  const card_font_size_class = card_size_class(card_data, options);
  return 'card-element card-description-line' + card_font_size_class;
}

export function card_size_class(card_data: Card, options: CardOptions): string {
  const card_font_size = card_data.card_font_size || options.default_card_font_size || '';
  return card_font_size !== '' && card_font_size !== 'inherit'
    ? ' card-font-size-' + card_font_size
    : '';
}
