import { describe, it, expect } from 'vitest';
import { buildLogValueSchema, validateLogValues } from '../validate';
import type { FieldDef } from '../schema';

const fid = (i: number) => `f${i}`;

const defs: FieldDef[] = [
  { id: fid(1), name: 'Mood',     type: 'select',      required: true,  options: ['A', 'B'] },
  { id: fid(2), name: 'Slept?',   type: 'boolean',     required: true },
  { id: fid(3), name: 'Energy',   type: 'slider',      required: true,  min: 1, max: 10, step: 1 },
  { id: fid(4), name: 'Blockers', type: 'multiselect', required: false, options: ['None', 'People', 'Tools'] },
  { id: fid(5), name: 'Start',    type: 'time',        required: true },
  { id: fid(6), name: 'Note',     type: 'text',        required: false },
  { id: fid(7), name: 'Count',    type: 'number',      required: true },
];

const validValues = () => ({
  [fid(1)]: 'A', [fid(2)]: true, [fid(3)]: 7, [fid(4)]: ['People', 'Tools'],
  [fid(5)]: '09:00', [fid(6)]: 'ok', [fid(7)]: 3,
});

describe('buildLogValueSchema', () => {
  it('accepts a fully valid log', () => {
    expect(buildLogValueSchema(defs).safeParse(validValues()).success).toBe(true);
  });

  it('rejects out-of-range slider', () => {
    const r = buildLogValueSchema(defs).safeParse({
      [fid(1)]: 'A', [fid(2)]: true, [fid(3)]: 99,
      [fid(5)]: '09:00', [fid(7)]: 3,
    });
    expect(r.success).toBe(false);
  });

  it('rejects non-number for number field', () => {
    const r = buildLogValueSchema(defs).safeParse({
      [fid(1)]: 'A', [fid(2)]: true, [fid(3)]: 5,
      [fid(5)]: '09:00', [fid(7)]: 'three',
    });
    expect(r.success).toBe(false);
  });

  it('rejects missing required field', () => {
    const r = buildLogValueSchema(defs).safeParse({
      [fid(1)]: 'A', [fid(3)]: 5, [fid(5)]: '09:00', [fid(7)]: 1,
    });
    expect(r.success).toBe(false);
  });

  it('accepts empty multiselect when not required', () => {
    const r = buildLogValueSchema(defs).safeParse({
      [fid(1)]: 'A', [fid(2)]: true, [fid(3)]: 5,
      [fid(4)]: [], [fid(5)]: '09:00', [fid(7)]: 1,
    });
    expect(r.success).toBe(true);
  });

  it('rejects multiselect with option not in list', () => {
    const r = buildLogValueSchema(defs).safeParse({
      [fid(1)]: 'A', [fid(2)]: true, [fid(3)]: 5,
      [fid(4)]: ['Bogus'], [fid(5)]: '09:00', [fid(7)]: 1,
    });
    expect(r.success).toBe(false);
  });

  it('rejects text with empty string when required', () => {
    const requiredTextDefs: FieldDef[] = [
      { id: 't', name: 'T', type: 'text', required: true },
    ];
    const r = buildLogValueSchema(requiredTextDefs).safeParse({ t: '   ' });
    expect(r.success).toBe(false);
  });
});

describe('validateLogValues', () => {
  it('returns success for valid input', () => {
    const r = validateLogValues(defs, validValues());
    expect(r.success).toBe(true);
  });

  it('returns issues for invalid input', () => {
    const r = validateLogValues(defs, {});
    expect(r.success).toBe(false);
  });
});
