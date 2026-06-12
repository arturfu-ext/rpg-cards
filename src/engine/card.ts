import { card_element_generators, card_element_unknown } from './directives';
import { replace_inline_icons } from './inline-icons';
import {
  card_data_color_back,
  card_data_color_front,
  card_data_icon_back,
  card_data_icon_back_container,
  card_data_icon_back_rotation,
  card_data_icon_front,
  card_data_split_params,
} from './options';
import type { Card, CardOptions, EngineContext } from './types';

export function card_element_title(card_data: Card, options: CardOptions): string {
  const title = card_data.title_display || card_data.title || '';
  const title_size = card_data.title_size || options.default_title_size || 'normal';
  const title_color = card_data.title_color || options.default_title_color || '';
  return (
    '<div class="card-title card-title-' +
    title_size +
    '" style="color: ' +
    title_color +
    '">' +
    title +
    '</div>'
  );
}

export function card_element_type(card_data: Card, options: CardOptions): string {
  const type = card_data.card_type || '';
  const title_color = card_data.title_color || options.default_title_color || '';
  return type
    ? '<div class="card-type card-title card-title-10" style="color: ' +
        title_color +
        '">' +
        type +
        '</div>'
    : '';
}

export function card_element_icon(
  card_data: Card,
  options: CardOptions,
  ctx: EngineContext,
): string {
  const icons = card_data_icon_front(card_data, options)
    .split(/[\s\uFEFF\xA0]+/)
    .filter((icon) => icon);
  const icon_color = card_data.icon_front_color || '';
  let classname = 'icon';
  if (options.icon_inline) {
    classname = 'inlineicon';
  }
  let result = `<div class="card-title-${classname}-container">`;
  result += icons
    .map((icon) => {
      // ctx.iconUrl replaces the hidden <img> computed-style lookup (cards.js:167-175)
      let imgUrl: string | null = ctx.iconUrl(icon);
      // sanitize url
      const u = new URL(String(imgUrl)); // String(null) === 'null' throws in new URL exactly like legacy (cards.js:177)
      imgUrl = ['http:', 'https:'].includes(u.protocol) ? u.href : ''; // u.href is percent encoded
      // colorize
      const style = icon_color
        ? `mask:url('${imgUrl}') no-repeat center / contain;background-color:${icon_color};background-image:none;`
        : '';
      // return html
      return `<span class="card-title-${classname} icon-${icon}" data-onload="fix-icon-size" data-src="${imgUrl}" style="${style}"></span>`;
    })
    .join('');
  result += `</div>`;
  return result;
}

// ============================================================================
// Card generating functions
// ============================================================================

export function card_generate_contents(
  card_data: Card,
  options: CardOptions,
  ctx: EngineContext,
): string {
  let result = '';
  const contents = card_data.contents;

  let html = contents
    .map((value) => {
      const [element_name, ...element_params] = card_data_split_params(value);
      // element_name! — split() always yields at least one element (cards.js:952)
      const element_generator = card_element_generators[element_name!];
      if (element_generator) {
        return element_generator(element_params, card_data, options, ctx);
      }
      if (element_name!.length > 0) {
        // ported card_element_unknown drops the unused card_data/options params (cards.js:894,958)
        return card_element_unknown(element_params);
      }
      // explicit undefined for the legacy fall-through; join() renders it as '' (cards.js:957-960)
      return undefined;
    })
    .join('\n');

  // replace_inline_icons is the extracted <icon> tag rewrite block (cards.js:963-1013)
  html = replace_inline_icons(html);

  result += `<div class="card-content-container">${html}</div>`;
  return result;
}

export function card_repeat(card: string, count: number): string[] {
  const result = [];
  for (let i = 0; i < count; ++i) {
    result.push(card);
  }
  return result;
}

export function card_generate_crop_marks(
  _card_data: Card,
  options: CardOptions,
  params: { isPreview?: boolean } = {},
): string {
  const { isPreview } = params;

  const bleed_width_half = `calc(${options.back_bleed_width} / 2)`;
  const bleed_height_half = `calc(${options.back_bleed_height} / 2)`;

  if (!options.crop_marks || isPreview) return '';

  return `
      <div class="crop-mark crop-mark-top-left-v hide" style="left:${bleed_width_half};"></div>
      <div class="crop-mark crop-mark-top-right-v hide" style="right:${bleed_width_half};"></div>
      <div class="crop-mark crop-mark-bottom-left-v hide" style="left:${bleed_width_half};"></div>
      <div class="crop-mark crop-mark-bottom-right-v hide" style="right:${bleed_width_half};"></div>
      <div class="crop-mark crop-mark-top-left-h hide" style="top:${bleed_height_half};"></div>
      <div class="crop-mark crop-mark-bottom-left-h hide" style="bottom:${bleed_height_half};"></div>
      <div class="crop-mark crop-mark-top-right-h hide" style="top:${bleed_height_half};"></div>
      <div class="crop-mark crop-mark-bottom-right-h hide" style="bottom:${bleed_height_half};"></div>
  `;
}

export function card_generate_color_front_style(
  color: string,
  _data: unknown = {},
  _options: unknown = {},
): string {
  return `style="color:${color};border-color:${color};background-color:${color}"`;
}

export function card_generate_color_back_style(
  color: string,
  _data: unknown = {},
  _options: unknown = {},
): string {
  return `style="color:${color};background-color:${color}"`;
}

export function card_generate_back_icon_style(
  _color: string,
  data: Card,
  options: CardOptions,
): string {
  const rotation = card_data_icon_back_rotation(data, options);
  let bgStyle = '';
  if (data.icon_back_container !== 'none') {
    bgStyle = `background-repeat: no-repeat; transform: rotate(${rotation}deg);`;
  }
  return `style="${bgStyle}"`;
}

export function card_generate_back_icon_container_style(
  color: string,
  data: Card,
  _options: CardOptions,
): string {
  let bgStyle = '';
  if (data.icon_back_container !== 'none') {
    bgStyle = `border-color:${color}; background-color:${color}; display: flex; justify-content: center; align-items: center;`;
  }
  return `style="${bgStyle}"`;
}

export function card_generate_color_gradient_style(color: string, _options: CardOptions): string {
  return `style="background: radial-gradient(ellipse at center, white 20%, ${color} 120%);"`;
}

export function add_to_style(style = ' style=""', css: Record<string, string>): string {
  // style string example ----> `style="color:red;"`
  const finalQuote = style.slice(-1) === '"' ? '"' : '';
  let result = finalQuote ? style.slice(0, -1) : style;
  const lastChar = result.slice(-1);
  if (lastChar !== ';' && lastChar !== '"') {
    result += ';';
  }
  for (const [key, value] of Object.entries(css)) {
    result += `${key}:${value};`;
  }
  result += finalQuote;
  return result;
}

export function add_size_to_style(style: string, width: string, height: string): string {
  return add_to_style(style, { width, height });
}

// options parameter replaces the legacy global card_options (cards.js:1097-1099)
export function add_bleed_to_style(style: string | undefined, options: CardOptions): string {
  return add_to_style(style, {
    padding: `calc(${options.back_bleed_height}/2) calc(${options.back_bleed_width}/2)`,
  });
}

export function card_generate_front(
  data: Card,
  options: CardOptions,
  { isPreview }: { isPreview: boolean },
  ctx: EngineContext,
): string {
  const color = card_data_color_front(data, options);
  const style_color = card_generate_color_front_style(color, data, options);

  const width = options.card_width;
  const height = options.card_height;

  const back_bleed_width = options.back_bleed_width;
  const back_bleed_height = options.back_bleed_height;

  const card_width = 'calc(' + width + ' + ' + back_bleed_width + ')';
  const card_height = 'calc(' + height + ' + ' + back_bleed_height + ')';

  const card_style = isPreview
    ? add_size_to_style(style_color, width, height)
    : add_size_to_style(style_color, card_width, card_height);
  // legacy calls add_bleed_to_style() with no args, relying on the global (cards.js:1116)
  const card_content_style = isPreview ? '' : add_bleed_to_style(undefined, options);

  const cardClasses = ['card'];
  if (options.rounded_corners) cardClasses.push('rounded-corners');
  if (data.vertical_alignment_reference === 'content-area')
    cardClasses.push('valignref-content-area');

  return `<div class="${cardClasses.join(' ')}" ${card_style}>
    <div class="card-content" ${card_content_style}>
      ${
        data.header_show === 'none'
          ? ''
          : `<div class="card-header">
        ${card_element_title(data, options)}
        ${card_element_type(data, options)}
        ${card_element_icon(data, options, ctx)}
      </div>`
      }
      ${card_generate_contents(data, options, ctx)}
    </div>
    <div>
      ${card_generate_crop_marks(data, options, { isPreview })}
    </div>
  </div>`;
}

export function card_generate_back_html({
  renderInner = true,
  card_style = '',
  corners_class = '',
  card_content_style = '',
  card_background_style = '',
  icon_container,
  icon_container_style,
  icon,
  icon_style,
  crop_marks = '',
}: {
  renderInner?: boolean;
  card_style?: string;
  corners_class?: string;
  card_content_style?: string;
  card_background_style?: string;
  // url is accepted (and ignored) to keep the legacy call shape (cards.js:1223)
  url?: string;
  icon_container?: string;
  icon_container_style?: string;
  icon?: string;
  icon_style?: string;
  crop_marks?: string;
}): string {
  let card = `<div class="card ${corners_class}" ${card_style}>`;

  card += `<div class="card-content" ${card_content_style}>`;
  card += `<div class="card-back" ${card_background_style}>`;

  if (renderInner) {
    card += `
      <div class="card-back-inner">
        <div class="card-back-icon card-back-icon-${icon_container}" ${icon_container_style}>
          <div class="icon-${icon}" ${icon_style}></div>
        </div>
      </div>
    `;
  }

  card += `</div>`;
  card += `</div>`;

  if (crop_marks) {
    card += `<div>${crop_marks}</div>`;
  }

  card += `</div>`;

  return card;
}

export function card_generate_back(
  data: Card,
  options: CardOptions,
  { isPreview }: { isPreview: boolean },
  ctx: EngineContext,
): string {
  const color = card_data_color_back(data, options);
  const style_color = card_generate_color_back_style(color, data, options);

  const width = options.card_width;
  const height = options.card_height;

  const back_bleed_width = options.back_bleed_width;
  const back_bleed_height = options.back_bleed_height;

  const card_width = 'calc(' + width + ' + ' + back_bleed_width + ')';
  const card_height = 'calc(' + height + ' + ' + back_bleed_height + ')';

  const card_style = isPreview
    ? add_size_to_style(style_color, width, height)
    : add_size_to_style(style_color, card_width, card_height);

  // ctx.measureBackInner replaces the jQuery temp-card measurement (cards.js:1192-1200)
  const { width: innerWidth, height: innerHeight } = ctx.measureBackInner(
    card_generate_back_html({ card_style }),
  );
  const iconContainerSize = Math.min(innerWidth, innerHeight) / 2;

  const url = data.background_image;
  let card_background_style = '';
  if (url) {
    card_background_style = `style="background-image: url(&quot;${url}&quot;); background-size: contain; background-position: center; background-repeat: no-repeat;"`;
  } else {
    card_background_style = card_generate_color_gradient_style(color, options);
  }
  const icon = card_data_icon_back(data, options);
  const icon_container = card_data_icon_back_container(data, options);

  const icon_container_style = add_size_to_style(
    card_generate_back_icon_container_style(color, data, options),
    `${iconContainerSize}px`,
    `${iconContainerSize}px`,
  );
  const icon_style = card_generate_back_icon_style(color, data, options);

  // legacy calls add_bleed_to_style() with no args, relying on the global (cards.js:1215)
  const card_content_style = add_bleed_to_style(undefined, options);

  return card_generate_back_html({
    renderInner: !url,
    card_style,
    corners_class: options.rounded_corners ? 'rounded-corners' : '',
    card_content_style,
    card_background_style,
    url,
    icon_container,
    icon_container_style,
    icon,
    icon_style,
    crop_marks: card_generate_crop_marks(data, options, { isPreview }),
  });
}

export function card_generate_empty(
  count: number,
  options: CardOptions,
  is_back: boolean,
): string[] {
  let card_width = options.card_width;
  let card_height = options.card_height;

  const style_color = card_generate_color_back_style('white');
  const back_bleed_width = options.back_bleed_width;
  const back_bleed_height = options.back_bleed_height;
  card_width = 'calc(' + card_width + ' + ' + back_bleed_width + ')';
  card_height = 'calc(' + card_height + ' + ' + back_bleed_height + ')';

  const card_style = add_size_to_style(style_color, card_width, card_height);
  let result = '';
  const back_front_class = is_back ? 'back' : 'front';
  result += '<div class="card empty ' + back_front_class + '" ' + card_style + '>';
  // legacy passes a bare {} card and no third param (cards.js:1247)
  result += card_generate_crop_marks({} as unknown as Card, options);
  result += '</div>';

  return card_repeat(result, count);
}
