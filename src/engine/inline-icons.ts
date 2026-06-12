export function forEachMatch(
  regexp: RegExp,
  str: string,
  func: (m: RegExpExecArray, i: number) => void,
): void {
  // common.js:197-202 — assignment-in-condition unrolled (biome noAssignInExpressions)
  let m = regexp.exec(str);
  let i = 0;
  while (m !== null) {
    if (m.index === regexp.lastIndex) regexp.lastIndex++; // avoid infinite loops with zero-width matches
    func(m, i);
    i++;
    m = regexp.exec(str);
  }
}

export function replace_inline_icons(html: string): string {
  const tagNames = ['icon'];

  tagNames.forEach((tagName) => {
    const tagRegExp = new RegExp(`<${tagName}[^>]*>`, 'g');
    const attrRegExp = /([\w-]+)="([^"]+)"/g;

    const matches: RegExpExecArray[] = [];
    forEachMatch(tagRegExp, html, (m) => {
      matches.push(m);
    });
    // cards.js:973 — legacy `return null` from the forEach callback; bare return is identical
    if (!matches.length) return;

    const tagResults = new Array<string>(matches.length);
    matches.forEach((match, i) => {
      if (tagName === 'icon') {
        const attrs: Record<string, string> = {};
        forEachMatch(attrRegExp, match[0], (m) => {
          const [attrName, attrValue] = m.splice(1);
          if (attrName === 'name') {
            if (!attrs.class) attrs.class = '';
            attrs.class += 'game-icon game-icon-' + attrValue;
          } else if (attrName === 'size') {
            if (!attrs.style) attrs.style = '';
            if (Number.isFinite(Number(attrValue))) attrs.style += 'font-size:' + attrValue + 'pt;';
            else attrs.style += 'font-size:' + attrValue + ';';
          } else if (attrName === 'color') {
            if (!attrs.style) attrs.style = '';
            attrs.style += 'color:' + attrValue + ';';
          }
        });
        forEachMatch(attrRegExp, match[0], (m) => {
          const attrName = m[1];
          const attrValue = m[2];
          if (attrName === 'style') {
            if (!attrs.style) attrs.style = '';
            attrs.style += attrValue;
          }
        });
        let tagResult = '<i';
        Object.keys(attrs).forEach((k) => {
          tagResult += ' ' + k + '="' + attrs[k] + '"';
        });
        tagResult += '></i>';
        tagResults[i] = tagResult;
      }
    });

    html = html.replace(tagRegExp, () => {
      // cards.js:1010-1012 — explicit String(): replace() applies ToString to the legacy shift() result
      return String(tagResults.shift());
    });
  });

  return html;
}
