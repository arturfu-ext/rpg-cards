const PIXEL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

/**
 * Safely evaluates a mathematical expression using MathJS.
 *
 * ⚠️ Important:
 * To ensure correct unit simplification, **arrange terms so that unit cancellation happens first**.
 * MathJS may produce incorrect results if units are multiplied/divided in the wrong order.
 *
 * Error Handling:
 * - If the expression is invalid (syntax error, incompatible units, or other runtime error), 
 *   the function returns `null` instead of throwing an exception.
 *
 * Example of incorrect usage:
 *   math_eval("63mm * 100 / 210mm") 
 *   // Returns: '30 mm^2' (incorrect)
 *
 * Correct usage with proper unit cancellation:
 *   math_eval("63mm / 210mm * 100") 
 *   // Returns: 30
 *
 * @param {string} x - A string containing the expression to evaluate. Units must be compatible if used.
 * @returns {number | math.Unit | null} The evaluated result (number or MathJS Unit) or `null` if invalid.
 */
function math_eval(x) {
  try {
    return math.evaluate(x);
  } catch {
    return null;
  }
}

/**
 * Determines whether a given expression is valid and can be safely evaluated by MathJS.
 *
 * This function first checks whether the input is a non-empty string,
 * then attempts to evaluate it using `math.evaluate()`.  
 * If evaluation succeeds without throwing an error, the expression is considered valid.  
 * Otherwise, it is invalid — for example, due to syntax errors, incompatible units, or undefined symbols.
 *
 * ✅ Features:
 * - Validates both numeric and unit-based expressions (e.g. `"2 + 3"`, `"5mm + 2cm"`).
 * - Safely catches syntax and runtime errors without throwing exceptions.
 * - Returns `false` for empty, blank, or invalid inputs.
 * - Designed for simple expression validation before actual evaluation.
 *
 * ⚠️ Notes:
 * - This function **does not** return the evaluated result — only whether it is valid.
 * - For diagnostic use cases (e.g. returning the specific error message), 
 *   you can extend this by capturing the error inside the `catch` block.
 *
 * @param {string} expr - The mathematical expression to validate. May include numbers, operators, functions, or compatible units.
 * @returns {boolean} `true` if the expression is non-empty and can be evaluated by MathJS; otherwise `false`.
 *
 * @example
 * math_valid("2mm");          // true
 * math_valid("2 + 3");        // true
 * math_valid("5mm + 3cm");    // true
 * math_valid("5mm + 3kg");    // false (incompatible units)
 * math_valid("2 +");          // false (syntax error)
 * math_valid("");             // false (empty input)
 * math_valid("   ");          // false (whitespace only)
 */
function math_valid(expr) {
  if (!String(expr).trim()) return false;
  try {
    math.evaluate(expr);
    return true;
  } catch {
    return false;
  }
}

/**
 * Formats a number, BigNumber, unit, or unit-like string into a concise, human-readable string.
 *
 * Features:
 * - Rounds numeric values to 2 decimal places by default.
 * - Removes unnecessary trailing zeros (e.g., `2.50` → `2.5`, `3.00` → `3`).
 * - For MathJS units, formats the numeric part while preserving the unit, removing all spaces.
 * - Handles strings containing numbers, units, or unit expressions.
 *
 * Examples:
 *   math_format(math.bignumber(2.5000))         // "2.5"
 *   math_format(3)                               // "3"
 *   math_format(math.unit('63 mm'))             // "63mm"
 *   math_format('100 cm')                        // "100cm"
 *   math_format('2.5000 kg')                     // "2.5kg"
 *
 * Notes:
 * - Uses high precision internally (precision: 20) to avoid rounding issues with units.
 * - All spaces in the formatted string are removed.
 * - Accepts numbers, MathJS BigNumber, MathJS Unit, or strings representing numbers/units.
 * - If x is falsy, the function returns x
 *
 * @param {number | math.BigNumber | math.Unit | string} x - The value to format.
 * @returns {string} A formatted string with rounded numeric part and cleaned-up units.
 */
function math_format(x) {
  if (!x) return x;
  const t = math.typeOf(x);

  // Helper: round numeric part and remove trailing zeros
  const roundAndTrim = (num, decimals = 2) => {
    const rounded = math.round(math.bignumber(num), decimals);
    let s = rounded.toString();
    if (s.includes('.')) s = s.replace(/\.?0+$/, '');
    return s;
  };

  if (t === 'Unit') {
    const formatted = x.format({ notation: 'fixed', precision: 20 }); // high precision to avoid rounding issues
    const match = formatted.match(/^([+-]?\d*\.?\d+)(.*)$/);
    if (match) {
      const value = roundAndTrim(match[1], 2);
      const unit = match[2];
      return `${value}${unit}`.replace(/\s+/g, ''); // remove all spaces
    }
    return formatted.replace(/\s+/g, '');
  }

  if (t === 'BigNumber' || t === 'number') {
    return roundAndTrim(x);
  }

  if (typeof x === 'string') {
    if (/[a-zA-Z]/.test(x)) {
      const unit = math.unit(x);
      const formatted = unit.format({ notation: 'fixed', precision: 20 });
      const match = formatted.match(/^([+-]?\d*\.?\d+)(.*)$/);
      if (match) {
        const value = roundAndTrim(match[1], 2);
        const unitStr = match[2];
        return `${value}${unitStr}`.replace(/\s+/g, '');
      }
      return formatted.replace(/\s+/g, '');
    } else {
      return roundAndTrim(x);
    }
  }

  return String(x).replace(/\s+/g, '');
}

/**
 * Determines whether the given dimensions represent a landscape or portrait orientation.
 *
 * Accepts both numeric values and unit strings (e.g. "100mm", "10cm", "4in").
 * Automatically converts compatible units before comparison.
 * Falls back to 'portrait' if inputs are invalid or non-comparable.
 *
 * @param {number|string|math.Unit} cssWidth  - The width value, may include units (mm, cm, in, etc.).
 * @param {number|string|math.Unit} cssHeight - The height value, may include units (mm, cm, in, etc.).
 * @returns {'landscape'|'portrait'} Returns 'landscape' if width > height; otherwise 'portrait'.
 *
 * @example
 * getOrientation('100mm', '50mm');  // 'landscape'
 * getOrientation('5cm', '2in');     // 'landscape' (converted automatically)
 * getOrientation('2in', '20cm');    // 'portrait'
 * getOrientation(500, 300);         // 'landscape'
 * getOrientation(null, 300);        // 'portrait'
 */
function getOrientation(cssWidth, cssHeight) {
  try {
    // Convert inputs to MathJS units if they contain unit symbols
    const parseUnit = (value) => {
      if (value == null || value === '') return math.unit(0, 'mm');
      if (typeof value === 'number') return math.unit(value, 'mm'); // assume mm for plain numbers
      if (typeof value === 'string') {
        // If it contains a recognized unit, parse as unit; otherwise, treat as number in mm
        const hasUnit = /[a-zA-Z]/.test(value);
        return hasUnit ? math.unit(value) : math.unit(parseFloat(value) || 0, 'mm');
      }
      if (math.typeOf(value) === 'Unit') return value;
      return math.unit(0, 'mm');
    };

    const w = parseUnit(cssWidth);
    const h = parseUnit(cssHeight);

    // Convert both to a common base unit (mm)
    const wVal = w.toNumber('mm');
    const hVal = h.toNumber('mm');

    return wVal > hVal ? 'landscape' : 'portrait';
  } catch (err) {
    console.warn('getOrientation: invalid input', err);
    return 'portrait';
  }
}

function isLandscape(width, height) {
    return getOrientation(width || 0, height || 0) === 'landscape';
}

function forEachMatch(regexp, str, func){
    var m = null, i = 0;
    while ((m = regexp.exec(str)) !== null) {
        if (m.index === regexp.lastIndex) regexp.lastIndex++; // avoid infinite loops with zero-width matches
        func(m, i);
        i++;
    }
}

function insertTextAtCursor(textarea, text) {
  textarea.focus();

  const value = textarea.value;
  const selStart = textarea.selectionStart;
  const selEnd = textarea.selectionEnd;

  const before = value.slice(0, selStart);
  const after = value.slice(selEnd);

  const lineStart = value.lastIndexOf('\n', selStart - 1) + 1;
  const lineEndIndex = value.indexOf('\n', selEnd);
  const lineEnd = lineEndIndex === -1 ? value.length : lineEndIndex;

  const isAtLineStart = selStart === lineStart;
  const isAtLineEnd = selEnd === lineEnd;

  let toInsert = '';

  if (isAtLineStart) {
    // Case: at beginning of line
    toInsert = text + '\n';
  } else if (isAtLineEnd) {
    // Case: at end of line
    toInsert = '\n' + text;
  } else {
    // Case: in middle of line
    toInsert = '\n' + text + '\n';
  }

  // Special rule: if user selected text and selection ends at end of line, avoid extra '\n' at end
  if (selStart !== selEnd && isAtLineEnd) {
    toInsert = '\n' + text;
  }

  insertTextWithUndo(textarea, toInsert, selStart, selEnd);
}

// Uses execCommand to ensure undo support
function insertTextWithUndo(textarea, text, start, end) {
  textarea.setSelectionRange(start, end);
  textarea.focus();

  const success = document.execCommand('insertText', false, text);

  if (!success) {
    // Fallback: manual insert (no undo)
    const value = textarea.value;
    textarea.value = value.slice(0, start) + text + value.slice(end);
    const newPos = start + text.length;
    textarea.selectionStart = textarea.selectionEnd = newPos;
  }
}

// Returns true if the variable is null or undefined.
//
// NOTE:
// If you need to also check whether a variable is undeclared, instead of isNil use:
//   typeof undeclaredVariable === 'undefined' || undeclaredVariable === null
//
// It is not possible to check an undeclared variable by calling:
//   isNil(undeclaredVariable)
//
// This is because JavaScript evaluates function arguments before calling the function,
// so passing an undeclared variable throws a ReferenceError,
// even if typeof is used inside isNil.
function isNil(q) {
  // Using loose equality on purpose, because "== null" matches only null and undefined.
  return q == null;
}

function debounce(fn, delay) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}
