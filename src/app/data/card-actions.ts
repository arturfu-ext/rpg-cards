/**
 * Card action (content directive) documentation.
 *
 * STATIC port of the legacy runtime JSDoc parser (generator/js/doc_parser.js).
 * Extracted from the JSDoc comments of the `card_element_*` functions in
 * generator/js/cards.js on 2026-06-12. Entry order matches the order the
 * functions appear in cards.js (the legacy for-in iteration order).
 *
 * To regenerate, run the same regex extraction the legacy parser used:
 *
 *   node -e "
 *     const fs = require('fs');
 *     const text = fs.readFileSync('generator/js/cards.js', 'utf8');
 *     const regex = /\/\*\*([\s\S]*?)\*\/[\s\n]*function\s+(card_element_\w+)/g;
 *     const out = {};
 *     let m;
 *     while ((m = regex.exec(text)) !== null) {
 *       const doc = m[1];
 *       const summary = doc.match(/@summary (.*)/);
 *       const description = doc.match(/@description (.*)/);
 *       const example = doc.match(/@example (.*)/);
 *       const category = doc.match(/@category (.*)/);
 *       if (summary && example) {
 *         out[m[2]] = {
 *           summary: summary[1].trim(),
 *           description: description ? description[1].trim() : '',
 *           example: example[1].trim(),
 *           category: category ? category[1].trim() : 'Basic',
 *         };
 *       }
 *     }
 *     console.log(JSON.stringify(out, null, 2));
 *   "
 */

export interface CardActionInfo {
  /** One-line summary, shown as the button tooltip. */
  summary: string;
  /** Longer description (used by the documentation page). */
  description: string;
  /** Example line; the first word is the directive name. */
  example: string;
  /** Group header in the actions toolbar. */
  category: string;
}

export const card_action_info: Readonly<Record<string, CardActionInfo>> = {
  card_element_pills_start: {
    summary: 'Starts a pill section.',
    description: 'Starts a pill section. Must be closed with `pills_end`.',
    example: 'pills_start',
    category: 'Pills',
  },
  card_element_pill: {
    summary: 'A pill.',
    description: 'Displays a pill.',
    example: 'pill | text | html-color',
    category: 'Pills',
  },
  card_element_pills_end: {
    summary: 'Ends a pill section.',
    description: 'Ends a pill section.',
    example: 'pills_end',
    category: 'Pills',
  },
  card_element_italic: {
    summary: 'A paragraph of italic text.',
    description: 'Creates a paragraph of italic text.',
    example: 'italic | text',
    category: 'Basic',
  },
  card_element_table_start: {
    summary: 'Start a new table finish with table_end',
    description: 'Starts a new table. Must be closed with `table_end`.',
    example: 'table_start',
    category: 'Table',
  },
  card_element_table_head: {
    summary: 'Add a table heading row',
    description: 'Adds a header row to the table.',
    example: 'table_head | heading1 | heading2 | heading3 | … | headingN',
    category: 'Table',
  },
  card_element_table_row: {
    summary: 'Add a table row',
    description: 'Adds a row to the table.',
    example: 'table_row | value1 | value2 | value3 | … | valueN',
    category: 'Table',
  },
  card_element_table_end: {
    summary: 'End a table started with table_start',
    description: 'Ends a table started with `table_start`.',
    example: 'table_end',
    category: 'Table',
  },
  card_element_html: {
    summary: 'Input raw HTML.',
    description: 'Inserts raw HTML into the card.',
    example: 'html | html',
    category: 'Basic',
  },
  card_element_rawhtml: {
    summary: 'Input raw HTML affected by some extra formatting but wrapped by a DIV container.',
    description: 'Inserts raw HTML into the card.',
    example: 'rawhtml | html',
    category: 'Basic',
  },
  card_element_subtitle: {
    summary: 'A subtitle.',
    description:
      'Adds a subtitle to the card. The second parameter is optional and will be right-aligned. Supports multiple subtitles.',
    example: 'subtitle | text | right-aligned-text',
    category: 'Basic',
  },
  card_element_inline_icon: {
    summary: 'An inline icon.',
    description: 'Displays an icon. The size and alignment are optional.',
    example: 'icon | icon-name | size | alignment',
    category: 'Layout',
  },
  card_element_footer: {
    summary: 'A card footer with optional separated parts.',
    description:
      'Displays a footer at the bottom of the card. If multiple parameters are provided, each is shown as a separate part with increasing font weight and separated by a ▹ symbol.',
    example: 'footer | text1 | text2 | text3 | ... | textN',
    category: 'Layout',
  },
  card_element_picture: {
    summary: 'An inline picture.',
    description: 'Displays a picture from a URL.',
    example: 'picture | url | height',
    category: 'Layout',
  },
  card_element_ruler: {
    summary: 'A horizontal ruler.',
    description: 'Displays a horizontal ruler.',
    example: 'ruler',
    category: 'Layout',
  },
  card_element_p2e_ruler: {
    summary: 'A Pathfinder 2nd Edition horizontal ruler.',
    description: 'Displays a horizontal ruler with the Pathfinder 2nd Edition style.',
    example: 'p2e_ruler',
    category: 'Pathfinder 2e',
  },
  card_element_boxes: {
    summary: 'A line of empty boxes.',
    description: 'Displays a number of empty boxes. The size and text are optional.',
    example: 'boxes | number | size | text',
    category: 'Layout',
  },
  card_element_property: {
    summary: 'A property line.',
    description: 'Displays a property with a name and a value.',
    example: 'property | name | value',
    category: 'Basic',
  },
  card_element_description: {
    summary: 'A description line.',
    description: 'Displays a description with a name and a value.',
    example: 'description | name | value',
    category: 'Basic',
  },
  card_element_text: {
    summary: 'A paragraph of text.',
    description: 'Displays a paragraph of text.',
    example: 'text | text',
    category: 'Basic',
  },
  card_element_center: {
    summary: 'A centered paragraph of text.',
    description: 'Displays a centered paragraph of text.',
    example: 'center | text',
    category: 'Basic',
  },
  card_element_justify: {
    summary: 'A justified paragraph of text.',
    description: 'Displays a justified paragraph of text.',
    example: 'justify | text',
    category: 'Basic',
  },
  card_element_divider: {
    summary: 'A grey divider bar.',
    description:
      'Adds a grey divider bar with optional centered text. Useful for visually separating sections within a card.',
    example: 'divider | text',
    category: 'Layout',
  },
  card_element_dndstats: {
    summary: 'A D&D stat block.',
    description: 'Displays a D&D 5e stat block.',
    example: 'dndstats | STR | DEX | CON | INT | WIS | CHA',
    category: 'DnD',
  },
  card_element_sr6spell: {
    summary: 'A Shadowrun 6th Edition spell block.',
    description: 'Displays a Shadowrun 6th Edition spell block.',
    example: 'sr6spell | Range | Type | Duration | Drain | Damage',
    category: 'Shadowrun 6e',
  },
  card_element_p2e_stats: {
    summary: 'A Pathfinder 2nd Edition stat block.',
    description: 'Displays a Pathfinder 2nd Edition stat block.',
    example: 'p2e_stats | STR | DEX | CON | INT | WIS | CHA | AC | Fort | Ref | Will | HP',
    category: 'Pathfinder 2e',
  },
  card_element_start_p2e_trait: {
    summary: 'Starts a Pathfinder 2nd Edition trait section.',
    description:
      'Starts a Pathfinder 2nd Edition trait section. Must be closed with `p2e_end_trait_section`.',
    example: 'p2e_start_trait_section',
    category: 'Pathfinder 2e',
  },
  card_element_end_p2e_trait: {
    summary: 'Ends a Pathfinder 2nd Edition trait section.',
    description: 'Ends a Pathfinder 2nd Edition trait section.',
    example: 'p2e_end_trait_section',
    category: 'Pathfinder 2e',
  },
  card_element_p2e_trait: {
    summary: 'A Pathfinder 2nd Edition trait.',
    description: 'Displays a Pathfinder 2nd Edition trait.',
    example: 'p2e_trait | rarity | text',
    category: 'Pathfinder 2e',
  },
  card_element_p2e_activity: {
    summary: 'A Pathfinder 2nd Edition activity.',
    description: 'Displays a Pathfinder 2nd Edition activity.',
    example: 'p2e_activity | name | actions | description',
    category: 'Pathfinder 2e',
  },
  card_element_swstats: {
    summary: 'A Savage Worlds stat block.',
    description: 'Displays a Savage Worlds stat block.',
    example:
      'swstats | Agility | Smarts | Spirit | Strength | Vigor | Pace | Parry | Toughness | Loot',
    category: 'Savage Worlds',
  },
  card_element_bullet: {
    summary: 'A bulleted list item.',
    description: 'Displays a bulleted list item.',
    example: 'bullet | text',
    category: 'Basic',
  },
  card_element_section: {
    summary: 'A section header.',
    description:
      'Displays a section header. The second parameter is optional and will be right-aligned.',
    example: 'section | title | right-aligned-text',
    category: 'Basic',
  },
  card_element_fill: {
    summary: 'A flexible vertical space.',
    description: 'Adds a flexible vertical space that fills the available space.',
    example: 'fill | flex-grow',
    category: 'Layout',
  },
};
