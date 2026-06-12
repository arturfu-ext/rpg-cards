import { card_data_color_front, card_element_class, card_size_class } from './options';
import type { Card, CardOptions, ElementGenerator } from './types';

/**
 * @summary Starts a pill section.
 * @description Starts a pill section. Must be closed with `pills_end`.
 * @example pills_start
 * @category Pills
 */
export function card_element_pills_start() {
  return '<div class="card-pills">';
}

/**
 * @summary A pill.
 * @description Displays a pill.
 * @example pill | text | html-color
 * @category Pills
 */
export function card_element_pill(params: string[], card_data: Card, options: CardOptions) {
  const text = params[0];
  const color = params[1] || card_data_color_front(card_data, options);

  let result = '';
  result += '<span class="card-pill label label-default" style="background-color:' + color + ';">';
  result += text;
  result += '</span>';
  return result;
}

/**
 * @summary Ends a pill section.
 * @description Ends a pill section.
 * @example pills_end
 * @category Pills
 */
export function card_element_pills_end() {
  return '</div>';
}

/**
 * @summary A paragraph of italic text.
 * @description Creates a paragraph of italic text.
 * @example italic | text
 * @category Basic
 */
export function card_element_italic(params: string[], card_data: Card, options: CardOptions) {
  const element_class = card_element_class(card_data, options);

  let result = '';
  result += '<div class="' + element_class + '">';
  result += '   <p class="card-p card-description-text"><i>' + params[0] + '</i></p>';
  result += '</div>';
  return result;
}

/**
 * @summary Start a new table finish with table_end
 * @description Starts a new table. Must be closed with `table_end`.
 * @example table_start
 * @category Table
 */
export function card_element_table_start() {
  return '<!-- table_start --><table class="card-stats"><tbody>';
}

/**
 * @summary Add a table heading row
 * @description Adds a header row to the table.
 * @example table_head | heading1 | heading2 | heading3 | … | headingN
 * @category Table
 */
export function card_element_table_head(params: string[]) {
  let result = '<!-- table_head --><tr>';
  for (let i = 0; i < params.length; ++i) {
    result += '<th class="card-stats-header">' + params[i] + '</th>';
  }
  result += '</tr>';
  return result;
}

/**
 * @summary Add a table row
 * @description Adds a row to the table.
 * @example table_row | value1 | value2 | value3 | … | valueN
 * @category Table
 */
export function card_element_table_row(params: string[]) {
  let result = '<!-- table_row --><tr>';
  for (let i = 0; i < params.length; ++i) {
    result += '<td class="card-stats-cell">' + params[i] + '</td>';
  }
  result += '</tr>';
  return result;
}

/**
 * @summary End a table started with table_start
 * @description Ends a table started with `table_start`.
 * @example table_end
 * @category Table
 */
export function card_element_table_end() {
  return '<!-- table_end --></tbody></table>';
}

/**
 * @summary Input raw HTML.
 * @description Inserts raw HTML into the card.
 * @example html | html
 * @category Basic
 */
export function card_element_html(params: string[]) {
  // cards.js:303-305 — `?? ""`: the legacy undefined return is coerced to "" by join("\n") in card_generate_contents
  return params[0] ?? '';
}

/**
 * @summary Input raw HTML affected by some extra formatting but wrapped by a DIV container.
 * @description Inserts raw HTML into the card.
 * @example rawhtml | html
 * @category Basic
 */
export function card_element_rawhtml(params: string[], card_data: Card, options: CardOptions) {
  const element_class = card_element_class(card_data, options);

  let result = '';
  result += '<div class="' + element_class + '">';
  result += params[0];
  result += '</div>';
  return result;
}

/**
 * @summary A subtitle.
 * @description Adds a subtitle to the card. The second parameter is optional and will be right-aligned. Supports multiple subtitles.
 * @example subtitle | text | right-aligned-text
 * @category Basic
 */
export function card_element_subtitle(params: string[]) {
  let result = '<div class="card-element card-subtitle">';
  if (params?.length) {
    result += params.map((text) => `<div>${text.trim()}</div>`).join('');
  }
  result += '</div>';
  return result;
}

/**
 * @summary An inline icon.
 * @description Displays an icon. The size and alignment are optional.
 * @example icon | icon-name | size | alignment
 * @category Layout
 */
export function card_element_inline_icon(params: string[], card_data: Card, options: CardOptions) {
  const icon = params[0] || '';
  const size = params[1] || '40';
  const align = params[2] || 'center';
  const color = card_data_color_front(card_data, options);
  return (
    '<div class="card-element card-inline-icon align-' +
    align +
    ' icon-' +
    icon +
    '" style ="height:' +
    size +
    'px;min-height:' +
    size +
    'px;width: ' +
    size +
    'px;background-color: ' +
    color +
    '"></div>'
  );
}

/**
 * @summary A card footer with optional separated parts.
 * @description Displays a footer at the bottom of the card. If multiple parameters are provided, each is shown as a separate part with increasing font weight and separated by a ▹ symbol.
 * @example footer | text1 | text2 | text3 | ... | textN
 * @category Layout
 */
export function card_element_footer(params: string[], card_data: Card, options: CardOptions) {
  let footer_text = params[0] || '';
  const color = card_data_color_front(card_data, options);
  // If there are multiple parameters, join them with separators
  if (params.length > 1) {
    const footer_parts = [];
    for (let i = 0; i < params.length; i++) {
      const oppositeLength = params.length - i - 1;
      const fontWeight = 200 + oppositeLength * 200;
      if (params[i] && params[i]!.trim() !== '') {
        footer_parts.push(
          '<span class="footer-part" style="font-weight: ' +
            fontWeight +
            ';">' +
            params[i]!.trim() +
            '</span>',
        );
      }
    }
    footer_text = footer_parts.join('<span class="footer-separator"> ▹ </span>');
  }
  return (
    '<div class="card-footer" style="background-color: ' +
    color +
    ';"><p class="card-footer-text">' +
    footer_text +
    '</p></div>'
  );
}

/**
 * @summary An inline picture.
 * @description Displays a picture from a URL.
 * @example picture | url | height
 * @category Layout
 */
export function card_element_picture(params: string[]) {
  const url = params[0] || '';
  const height = params[1] || '';
  return (
    '<div class="card-element card-picture" style ="background-image: url(&quot;' +
    url +
    '&quot;); background-size: contain; background-position: center;background-repeat: no-repeat; height:' +
    height +
    'px"></div>'
  );
}

/**
 * @summary A horizontal ruler.
 * @description Displays a horizontal ruler.
 * @example ruler
 * @category Layout
 */
export function card_element_ruler(_params: string[], card_data: Card, options: CardOptions) {
  const color = card_data_color_front(card_data, options);
  const fill = 'fill="' + color + '"';
  // cards.js:431 — unused `stroke` local dropped (noUnusedLocals)
  const card_font_size_class = card_size_class(card_data, options);

  let result = '';
  result +=
    '<svg class="card-ruler' +
    card_font_size_class +
    '" height="1" width="100" viewbox="0 0 100 1" preserveaspectratio="none" xmlns="http://www.w3.org/2000/svg">';
  result += '    <polyline points="0,0 100,0.5 0,1" ' + fill + '></polyline>';
  result += '</svg>';
  return result;
}

/**
 * @summary A Pathfinder 2nd Edition horizontal ruler.
 * @description Displays a horizontal ruler with the Pathfinder 2nd Edition style.
 * @example p2e_ruler
 * @category Pathfinder 2e
 */
export function card_element_p2e_ruler(_params: string[], card_data: Card, options: CardOptions) {
  const color = card_data_color_front(card_data, options);
  const fill = 'fill="' + color + '"';
  // cards.js:453 — unused `stroke` local dropped (noUnusedLocals)
  const card_font_size_class = card_size_class(card_data, options);

  let result = '';
  result +=
    '<svg class="card-p2e-ruler' +
    card_font_size_class +
    '" height="1" width="100" viewbox="0 0 100 5" preserveaspectratio="none" xmlns="http://www.w3.org/2000/svg">';
  result += '    <polyline points="0,0 100,0.5 0,1" ' + fill + '></polyline>';
  result += '</svg>';
  return result;
}

/**
 * @summary A line of empty boxes.
 * @description Displays a number of empty boxes. The size and text are optional.
 * @example boxes | number | size | text
 * @category Layout
 */
export function card_element_boxes(params: string[], card_data: Card, options: CardOptions) {
  const color = card_data_color_front(card_data, options);
  const fill = ' fill="none"';
  const stroke = ' stroke="' + color + '"';
  const count = params[0] || 1;
  const size = params[1] || 3;
  const additional_text = params[2] || '';
  const style = 'style="width:' + size + 'em;height:' + size + 'em"';
  const element_class = card_element_class(card_data, options);

  let result = '';
  result += '<div class="' + element_class + '">';
  // cards.js:484 — explicit Number(): the legacy `i < count` coerces the string param numerically
  for (let i = 0; i < Number(count); ++i) {
    result +=
      '<svg class="card-box" height="100" width="100" viewbox="0 0 100 100" preserveaspectratio="none" xmlns="http://www.w3.org/2000/svg" ' +
      style +
      '>';
    result +=
      '    <rect x="5" y="5" width="90" height="90" ' + fill + stroke + ' style="stroke-width:10">';
    result += '</svg>';
  }
  result += additional_text + '</div>';
  return result;
}

/**
 * @summary A property line.
 * @description Displays a property with a name and a value.
 * @example property | name | value
 * @category Basic
 */
export function card_element_property(params: string[], card_data: Card, options: CardOptions) {
  const card_font_size_class = card_size_class(card_data, options);

  let result = '';
  result += '<div class="card-element card-property-line' + card_font_size_class + '">';
  result += '   <h4 class="card-property-name">' + params[0] + '</h4>';
  result += '   <p class="card-p card-property-text">' + params[1] + '</p>';
  if (params[2]) {
    result += '   <div style="float:right">';
    result += '       <h4 class="card-property-name">' + params[2] + '</h4>';
    result += '       <p class="card-p card-property-text">' + params[3] + '</p>';
    result += '   </div>';
  }
  result += '</div>';
  return result;
}

/**
 * @summary A description line.
 * @description Displays a description with a name and a value.
 * @example description | name | value
 */
export function card_element_description(params: string[], card_data: Card, options: CardOptions) {
  const element_class = card_element_class(card_data, options);

  let result = '';
  result += '<div class="' + element_class + '">';
  result += '   <h4 class="card-description-name">' + params[0] + '</h4>';
  result += '   <p class="card-p card-description-text">' + params[1] + '</p>';
  result += '</div>';
  return result;
}

/**
 * @summary A paragraph of text.
 * @description Displays a paragraph of text.
 * @example text | text
 * @category Basic
 */
export function card_element_text(params: string[], card_data: Card, options: CardOptions) {
  const element_class = card_element_class(card_data, options);

  let result = '';
  result += '<div class="' + element_class + '">';
  result += '   <p class="card-p card-description-text">' + params[0] + '</p>';
  result += '</div>';
  return result;
}

/**
 * @summary A centered paragraph of text.
 * @description Displays a centered paragraph of text.
 * @example center | text
 * @category Basic
 */
export function card_element_center(params: string[], card_data: Card, options: CardOptions) {
  const element_class = card_element_class(card_data, options);

  let result = '';
  result += '<div class="' + element_class + '" style="text-align: center">';
  result += '   <p class="card-p card-description-text">' + params[0] + '</p>';
  result += '</div>';
  return result;
}

/**
 * @summary A justified paragraph of text.
 * @description Displays a justified paragraph of text.
 * @example justify | text
 * @category Basic
 */
export function card_element_justify(params: string[], card_data: Card, options: CardOptions) {
  const element_class = card_element_class(card_data, options);

  let result = '';
  result += '<div class="' + element_class + '" style="text-align: justify; hyphens: auto">';
  result += '   <p class="card-p card-description-text">' + params[0] + '</p>';
  result += '</div>';
  return result;
}

/**
 * @summary A grey divider bar.
 * @description Adds a grey divider bar with optional centered text. Useful for visually separating sections within a card.
 * @example divider | text
 * @category Layout
 */
export function card_element_divider(params: string[]) {
  let result = '';
  result +=
    '<div class="card-element card-description-line" style="text-align: center; background-color: lightgray">';
  result += '   <p class="card-p card-description-text">' + (params[0] || '&nbsp;') + '</p>';
  result += '</div>';
  return result;
}

/**
 * @summary A D&D stat block.
 * @description Displays a D&D 5e stat block.
 * @example dndstats | STR | DEX | CON | INT | WIS | CHA
 * @category DnD
 */
export function card_element_dndstats(params: string[], card_data: Card, options: CardOptions) {
  const stats = [10, 10, 10, 10, 10, 10];
  const mods: (string | number)[] = [0, 0, 0, 0, 0, 0];
  for (let i = 0; i < 6; ++i) {
    // cards.js:620 — explicit String(): parseInt applies ToString to the possibly-undefined param
    stats[i] = parseInt(String(params[i]), 10) || 0;
    let mod: string | number = Math.floor((stats[i]! - 10) / 2);
    if (mod >= 0) {
      mod = '+' + mod;
    } else {
      mod = '' + mod;
    }
    mods[i] = '&nbsp;(' + mod + ')';
  }
  const card_font_size_class = card_size_class(card_data, options);

  let result = '';
  result += '<table class="card-stats' + card_font_size_class + '">';
  result += '    <tbody><tr>';
  result += '      <th class="card-stats-header">STR</th>';
  result += '      <th class="card-stats-header">DEX</th>';
  result += '      <th class="card-stats-header">CON</th>';
  result += '      <th class="card-stats-header">INT</th>';
  result += '      <th class="card-stats-header">WIS</th>';
  result += '      <th class="card-stats-header">CHA</th>';
  result += '    </tr>';
  result += '    <tr>';
  result += '      <td class="card-stats-cell">' + stats[0] + mods[0] + '</td>';
  result += '      <td class="card-stats-cell">' + stats[1] + mods[1] + '</td>';
  result += '      <td class="card-stats-cell">' + stats[2] + mods[2] + '</td>';
  result += '      <td class="card-stats-cell">' + stats[3] + mods[3] + '</td>';
  result += '      <td class="card-stats-cell">' + stats[4] + mods[4] + '</td>';
  result += '      <td class="card-stats-cell">' + stats[5] + mods[5] + '</td>';
  result += '    </tr>';
  result += '  </tbody>';
  result += '</table>';
  return result;
}

/**
 * @summary A Shadowrun 6th Edition spell block.
 * @description Displays a Shadowrun 6th Edition spell block.
 * @example sr6spell | Range | Type | Duration | Drain | Damage
 * @category Shadowrun 6e
 */
export function card_element_sr6spell(params: string[], card_data: Card, options: CardOptions) {
  const stats: string[] = [];
  for (let i = 0; i < 5; ++i) {
    stats[i] = params[i] || '';
  }
  const card_font_size_class = card_size_class(card_data, options);

  let result = '';
  result += '<table class="card-stats' + card_font_size_class + '">';
  result += '    <tbody><tr>';
  result += '      <th class="card-stats-header">Range</th>';
  result += '      <th class="card-stats-header">Type</th>';
  result += '      <th class="card-stats-header">Duration</th>';
  result += '      <th class="card-stats-header">Drain</th>';
  result += '      <th class="card-stats-header">Damage</th>';
  result += '    </tr>';
  result += '    <tr>';
  result += '      <td class="card-stats-cell">' + stats[0] + '</td>';
  result += '      <td class="card-stats-cell">' + stats[1] + '</td>';
  result += '      <td class="card-stats-cell">' + stats[2] + '</td>';
  result += '      <td class="card-stats-cell">' + stats[3] + '</td>';
  result += '      <td class="card-stats-cell">' + stats[4] + '</td>';
  result += '    </tr>';
  result += '  </tbody>';
  result += '</table>';
  return result;
}

/**
 * @summary A Pathfinder 2nd Edition stat block.
 * @description Displays a Pathfinder 2nd Edition stat block.
 * @example p2e_stats | STR | DEX | CON | INT | WIS | CHA | AC | Fort | Ref | Will | HP
 * @category Pathfinder 2e
 */
export function card_element_p2e_stats(params: string[], card_data: Card, options: CardOptions) {
  let result = '';
  result += '<div class="card-p2e-attribute-line">';
  result += '   <p class="card-p2e-attributes-text">';
  result +=
    '       <b>Str</b> ' +
    params[0] +
    ', <b>Dex</b> ' +
    params[1] +
    ', <b>Con</b> ' +
    params[2] +
    ', <b>Int</b> ' +
    params[3] +
    ', <b>Wis</b> ' +
    params[4] +
    ', <b>Cha</b> ' +
    params[5];
  result += '   </p>';
  result += '</div>';
  result += card_element_p2e_ruler(params, card_data, options);
  result += '<div class="card-p2e-attribute-line">';
  result += '   <p class="card-p2e-attributes-text">';
  result +=
    '       <b>AC </b> ' +
    params[6] +
    '; <b>Fort</b> ' +
    params[7] +
    '; <b>Ref</b> ' +
    params[8] +
    '; <b>Will</b> ' +
    params[9];
  result += '   </p>';
  result += '   <p class="card-p2e-attributes-text">';
  result += '       <b>HP </b> ' + params[10];
  result += '   </p>';
  result += '</div>';
  return result;
}

/**
 * @summary Starts a Pathfinder 2nd Edition trait section.
 * @description Starts a Pathfinder 2nd Edition trait section. Must be closed with `p2e_end_trait_section`.
 * @example p2e_start_trait_section
 * @category Pathfinder 2e
 */
export function card_element_start_p2e_trait() {
  return '<div class="card-p2e-trait-container">';
}

/**
 * @summary Ends a Pathfinder 2nd Edition trait section.
 * @description Ends a Pathfinder 2nd Edition trait section.
 * @example p2e_end_trait_section
 * @category Pathfinder 2e
 */
export function card_element_end_p2e_trait() {
  return '</div>';
}

/**
 * @summary A Pathfinder 2nd Edition trait.
 * @description Displays a Pathfinder 2nd Edition trait.
 * @example p2e_trait | rarity | text
 * @category Pathfinder 2e
 */
export function card_element_p2e_trait(params: string[], card_data: Card, options: CardOptions) {
  const card_font_size_class = card_size_class(card_data, options);
  const badge_type = ' card-p2e-trait-' + params[0];

  let result = '';
  result += '<span class="card-p2e-trait' + badge_type + card_font_size_class + '">';
  result += params[1];
  result += '</span>';
  return result;
}

/**
 * @summary A Pathfinder 2nd Edition activity.
 * @description Displays a Pathfinder 2nd Edition activity.
 * @example p2e_activity | name | actions | description
 * @category Pathfinder 2e
 */
export function card_element_p2e_activity(params: string[], card_data: Card, options: CardOptions) {
  const card_font_size_class = card_size_class(card_data, options);

  let activity_icon: string | undefined;
  if (params[1] === '0') {
    activity_icon = 'icon-p2e-free-action';
  } else if (params[1] === '1') {
    activity_icon = 'icon-p2e-1-action';
  } else if (params[1] === '2') {
    activity_icon = 'icon-p2e-2-actions';
  } else if (params[1] === '3') {
    activity_icon = 'icon-p2e-3-actions';
  } else if (params[1] === 'R') {
    activity_icon = 'icon-p2e-reaction';
  }

  let result = '';
  result += '<div class="card-element card-property-line' + card_font_size_class + '">';
  result += '   <h4 class="card-property-name">' + params[0] + '</h4>';
  result +=
    '   <div class="card-inline-icon ' +
    activity_icon +
    '" style="display: inline-block; vertical-align: middle; height: 10px; min-height: 10px; width: 10px; background-color: black;"></div>';
  result += '   <p class="card-p card-property-text">' + params[2] + '</p>';
  result += '</div>';
  return result;
}

/**
 * @summary A Savage Worlds stat block.
 * @description Displays a Savage Worlds stat block.
 * @example swstats | Agility | Smarts | Spirit | Strength | Vigor | Pace | Parry | Toughness | Loot
 * @category Savage Worlds
 */
export function card_element_swstats(params: string[], card_data: Card, options: CardOptions) {
  const stats: string[] = [];
  for (let i = 0; i < 9; ++i) {
    stats[i] = params[i] || '-';
  }
  const card_font_size_class = card_size_class(card_data, options);

  let result = '';
  result += '<table class="card-stats' + card_font_size_class + '">';
  result += '    <tbody><tr>';
  result += '      <th class="card-stats-header">Agility</th>';
  result += '      <th class="card-stats-header">Smarts</th>';
  result += '      <th class="card-stats-header">Spirit</th>';
  result += '      <th class="card-stats-header">Strength</th>';
  result += '      <th class="card-stats-header">Vigor</th>';
  result += '    </tr>';
  result += '    <tr>';
  result += '      <td class="card-stats-cell">d' + stats[0] + '</td>';
  result += '      <td class="card-stats-cell">d' + stats[1] + '</td>';
  result += '      <td class="card-stats-cell">d' + stats[2] + '</td>';
  result += '      <td class="card-stats-cell">d' + stats[3] + '</td>';
  result += '      <td class="card-stats-cell">d' + stats[4] + '</td>';
  result += '    </tr>';
  result += '  </tbody>';
  result += '</table>';
  result += '<p class="card-stats-sw-derived">';
  result += ' <b>Pace</b> ' + stats[5];
  result += ' <b>Parry</b> ' + stats[6];
  result += ' <b>Toughness</b> ' + stats[7];
  result += stats[8] ? ' <b>Loot</b> ' + stats[8] : '';
  result += '</p>';
  return result;
}

/**
 * @summary A bulleted list item.
 * @description Displays a bulleted list item.
 * @example bullet | text
 * @category Basic
 */
export function card_element_bullet(params: string[], card_data: Card, options: CardOptions) {
  const card_font_size_class = card_size_class(card_data, options);

  let result = '';
  result += '<ul class="card-element card-bullet-line' + card_font_size_class + '">';
  result += '   <li class="card-bullet">' + params[0] + '</li>';
  result += '</ul>';
  return result;
}

/**
 * @summary A section header.
 * @description Displays a section header. The second parameter is optional and will be right-aligned.
 * @example section | title | right-aligned-text
 * @category Basic
 */
export function card_element_section(params: string[], card_data: Card, options: CardOptions) {
  const color = card_data_color_front(card_data, options);
  const section = params[0] || '';

  let result = '<h3 class="card-section" style="color:' + color + '">';
  if (params[1]) {
    result += '<div style="float:right">' + params[1] + '</div>';
  }
  result += '<div>' + section + '</div>';
  result += '</h3>';

  return result;
}

/**
 * @summary A flexible vertical space.
 * @description Adds a flexible vertical space that fills the available space.
 * @example fill | flex-grow
 * @category Layout
 */
export function card_element_fill(params: string[]) {
  const flex = params[0] || '1';
  return '<span class="card-fill" style="flex:' + flex + '"></span>';
}

export function card_element_unknown(params: string[]) {
  return '<div>Unknown element: ' + params.join('<br />') + '</div>';
}

export function card_element_empty() {
  return '';
}

export const card_element_generators: Record<string, ElementGenerator> = {
  subtitle: card_element_subtitle,
  property: card_element_property,
  rule: card_element_ruler,
  ruler: card_element_ruler,
  p2e_rule: card_element_p2e_ruler,
  p2e_ruler: card_element_p2e_ruler,
  boxes: card_element_boxes,
  description: card_element_description,
  dndstats: card_element_dndstats,
  p2e_stats: card_element_p2e_stats,
  p2e_start_trait_section: card_element_start_p2e_trait,
  p2e_trait: card_element_p2e_trait,
  p2e_end_trait_section: card_element_end_p2e_trait,
  p2e_activity: card_element_p2e_activity,
  pills_start: card_element_pills_start,
  pill: card_element_pill,
  pills_end: card_element_pills_end,
  table_start: card_element_table_start,
  table_head: card_element_table_head,
  table_row: card_element_table_row,
  table_end: card_element_table_end,
  swstats: card_element_swstats,
  sr6spell: card_element_sr6spell,
  text: card_element_text,
  italic: card_element_italic,
  html: card_element_html,
  rawhtml: card_element_rawhtml,
  center: card_element_center,
  justify: card_element_justify,
  divider: card_element_divider,
  bullet: card_element_bullet,
  fill: card_element_fill,
  section: card_element_section,
  disabled: card_element_empty,
  picture: card_element_picture,
  icon: card_element_inline_icon,
  footer: card_element_footer,
};
