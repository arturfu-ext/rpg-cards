import type { CardOptions } from './types';

export function mapIndex_rowReverse(i: number, colCount: number): number {
  const row = Math.floor(i / colCount);
  const col = i % colCount;

  return row * colCount + (colCount - 1 - col);
}

export function sortByFlexVisualOrder(
  _arr: ArrayLike<Element>,
  direction: string,
  colOrRowCount: number,
): Element[] {
  const arr = Array.from(_arr);

  function mapIndex(i: number): number {
    switch (direction) {
      case 'row':
        return i;
      case 'row-reverse':
        return mapIndex_rowReverse(i, colOrRowCount);
      default:
        return i;
    }
  }

  return [...arr].sort((a, b) => {
    const ai = mapIndex(arr.indexOf(a));
    const bi = mapIndex(arr.indexOf(b));
    return ai - bi;
  });
}

export function showCropMark(mark: string, card: Element): void {
  // output.js:97 — selector always matches in generated card HTML
  card.querySelector(`.crop-mark-${mark}`)!.classList.remove('hide');
}

export function cropMarks(container: ParentNode, pageCount: number, options: CardOptions): void {
  // output.js:101 — legacy received the pages array and used pages.length
  const pagesLen = pageCount;
  const cols = Number(options.page_columns);
  const rows = Number(options.page_rows);
  const r_first = 0;
  const c_first = 0;
  const r_last = rows - 1;
  const c_last = cols - 1;
  for (let p = 0; p < pagesLen; p++) {
    let i = 0;
    const pag = {
      isBack: options.card_arrangement === 'doublesided' && p % 2 === 1,
      bleedWidth: options.back_bleed_width,
      bleedHeight: options.back_bleed_height,
    };

    const collapseCropsCols = !parseFloat(pag.bleedWidth);
    const collapseCropsRows = !parseFloat(pag.bleedHeight);

    const cards = pag.isBack
      ? sortByFlexVisualOrder(
          container.querySelectorAll(`page:nth-of-type(${p + 1}) .card`),
          'row-reverse',
          cols,
        )
      : [...container.querySelectorAll(`page:nth-of-type(${p + 1}) .card`)];

    for (let r = 0; r < rows; r++) {
      // output.js:128 — legacy declared an unused implicit-global nc counter
      for (let c = 0, _nc = cols - 1; c < cols; c++, _nc--) {
        // output.js:129 — every page is generated with rows*cols cards
        const card = cards[i]!;
        // vertical crop marks
        if (r_first === r) {
          if (!collapseCropsCols || c === c_first) showCropMark('top-left-v', card);
          showCropMark('top-right-v', card);
        } else if (r_last === r) {
          if (!collapseCropsCols || c === c_first) showCropMark('bottom-left-v', card);
          showCropMark('bottom-right-v', card);
        }
        // horizontal crop marks
        if (c_first === c) {
          if (!collapseCropsRows || r === r_first) showCropMark('top-left-h', card);
          showCropMark('bottom-left-h', card);
        } else if (c_last === c) {
          if (!collapseCropsCols || r === r_first) showCropMark('top-right-h', card);
          showCropMark('bottom-right-h', card);
        }
        i++;
      }
    }
  }
}
