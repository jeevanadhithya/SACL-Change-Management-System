import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  SPACE_SCALE,
  findOff8ptSpacingClasses,
  isMultipleOf8,
  isTailwindUnit8pt,
  snapTo8pt,
} from './spacingSystem';

function collectInteractiveTsxFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      // Preserve exact A4 PDF print formatting in components/print
      if (entry === 'print') continue;
      collectInteractiveTsxFiles(fullPath, acc);
    } else if (entry.endsWith('.tsx')) {
      acc.push(fullPath);
    }
  }
  return acc;
}

test('8-point spacing scale helpers validate and snap pixel values accurately', () => {
  assert.equal(SPACE_SCALE[1], 8);
  assert.equal(SPACE_SCALE[2], 16);
  assert.equal(SPACE_SCALE[3], 24);
  assert.equal(SPACE_SCALE[8], 64);

  assert.equal(isMultipleOf8(0), true);
  assert.equal(isMultipleOf8(8), true);
  assert.equal(isMultipleOf8(24), true);
  assert.equal(isMultipleOf8(4), false);
  assert.equal(isMultipleOf8(12), false);
  assert.equal(isMultipleOf8(-8), false);

  assert.equal(snapTo8pt(0), 0);
  assert.equal(snapTo8pt(6), 8);
  assert.equal(snapTo8pt(10), 8);
  assert.equal(snapTo8pt(12), 16);
  assert.equal(snapTo8pt(20), 24);

  assert.equal(isTailwindUnit8pt(0), true);
  assert.equal(isTailwindUnit8pt(2), true);
  assert.equal(isTailwindUnit8pt(4), true);
  assert.equal(isTailwindUnit8pt(6), true);
  assert.equal(isTailwindUnit8pt(1), false);
  assert.equal(isTailwindUnit8pt(3), false);
  assert.equal(isTailwindUnit8pt(5), false);
});

test('findOff8ptSpacingClasses flags off-grid spacing classes and accepts 8pt utilities', () => {
  const valid = 'className="p-4 sm:p-6 px-4 py-2 gap-4 space-y-6 mt-2 mb-8 pl-10 pr-12"';
  assert.deepEqual(findOff8ptSpacingClasses(valid), []);

  const invalid = 'className="p-5 px-3 py-2.5 gap-1.5 mb-1 mt-[10px]"';
  assert.deepEqual(findOff8ptSpacingClasses(invalid), [
    'p-5',
    'px-3',
    'py-2.5',
    'gap-1.5',
    'mb-1',
    'mt-[10px]',
  ]);
});

test('all interactive UI TSX files strictly conform to the 8-point spacing system', () => {
  const srcRoot = path.resolve(process.cwd(), 'frontend/src');
  const files = collectInteractiveTsxFiles(srcRoot);
  assert.ok(files.length > 0, 'Expected interactive TSX files to audit');

  const violationsByFile: Record<string, string[]> = {};
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const violations = findOff8ptSpacingClasses(content);
    if (violations.length > 0) {
      violationsByFile[path.relative(srcRoot, file)] = Array.from(new Set(violations));
    }
  }

  assert.deepEqual(
    violationsByFile,
    {},
    `Found off-8pt spacing classes: ${JSON.stringify(violationsByFile, null, 2)}`,
  );
});
