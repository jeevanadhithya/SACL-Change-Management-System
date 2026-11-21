/**
 * Sakthi Auto PCMS — 8-Point Spacing System Utilities
 *
 * Base grid unit: 8px (0.5rem).
 * In Tailwind CSS v4 (1 spacing unit = 4px / 0.25rem), valid 8-point scale
 * utilities use even integer steps: 0 (0px), 2 (8px), 4 (16px), 6 (24px),
 * 8 (32px), 10 (40px), 12 (48px), 14 (56px), 16 (64px), 20 (80px), 24 (96px).
 */

export const SPACE_BASE_PX = 8;

export const SPACE_SCALE = {
  0: 0,
  1: 8,
  2: 16,
  3: 24,
  4: 32,
  5: 40,
  6: 48,
  7: 56,
  8: 64,
  10: 80,
  12: 96,
} as const;

export type SpaceStep = keyof typeof SPACE_SCALE;

export function isMultipleOf8(px: number): boolean {
  if (!Number.isFinite(px) || px < 0) return false;
  return px % SPACE_BASE_PX === 0;
}

export function snapTo8pt(px: number): number {
  if (!Number.isFinite(px) || px <= 0) return 0;
  return Math.round(px / SPACE_BASE_PX) * SPACE_BASE_PX;
}

export function tailwindUnitToPx(unit: number): number {
  return unit * 4;
}

export function isTailwindUnit8pt(unit: number): boolean {
  return isMultipleOf8(tailwindUnitToPx(unit));
}

const SPACING_UTILITY_REGEX =
  /\b(?:(?:sm|md|lg|xl|2xl|hover|focus|focus-visible|disabled):)*-?(?:p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap|gap-x|gap-y|space-x|space-y)-(\d+(?:\.\d+)?|\[[^\]]+\])\b/g;

/**
 * Scans a JSX/TSX source string and returns any spacing utility tokens
 * (padding, margin, gap, space-x/y) that do not land on an 8px multiple.
 */
export function findOff8ptSpacingClasses(source: string): string[] {
  const violations: string[] = [];
  let match: RegExpExecArray | null;
  SPACING_UTILITY_REGEX.lastIndex = 0;

  while ((match = SPACING_UTILITY_REGEX.exec(source)) !== null) {
    const fullClass = match[0];
    const rawValue = match[1];

    if (rawValue.startsWith('[') && rawValue.endsWith(']')) {
      const inner = rawValue.slice(1, -1).trim();
      const pxMatch = /^(-?\d+(?:\.\d+)?)px$/.exec(inner);
      if (pxMatch) {
        const px = Math.abs(Number(pxMatch[1]));
        if (!isMultipleOf8(px)) {
          violations.push(fullClass);
        }
      } else {
        violations.push(fullClass);
      }
      continue;
    }

    const numericUnit = Number(rawValue);
    if (Number.isNaN(numericUnit) || !isTailwindUnit8pt(numericUnit)) {
      violations.push(fullClass);
    }
  }

  return violations;
}
