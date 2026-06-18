import { describe, it, expect } from 'vitest';
import { validateFieldDef, validateFieldDefs, newFieldId, type FieldDef } from '../schema';

const baseField = (overrides: Partial<FieldDef>): FieldDef =>
  ({ id: newFieldId(), name: 'x', type: 'text', required: true, ...overrides } as unknown as FieldDef);

describe('validateFieldDef', () => {
  it('accepts a text field', () => {
    expect(validateFieldDef(baseField({ type: 'text' }))).toEqual({ ok: true });
  });

  it('accepts a slider with valid range', () => {
    expect(validateFieldDef(baseField({ type: 'slider', min: 0, max: 10, step: 1 } as unknown as Partial<FieldDef>))).toEqual({ ok: true });
  });

  it('rejects slider when min >= max', () => {
    const r = validateFieldDef(baseField({ type: 'slider', min: 5, max: 5, step: 1 } as unknown as Partial<FieldDef>));
    expect(r.ok).toBe(false);
  });

  it('rejects slider when step <= 0', () => {
    const r = validateFieldDef(baseField({ type: 'slider', min: 0, max: 10, step: 0 } as unknown as Partial<FieldDef>));
    expect(r.ok).toBe(false);
  });

  it('rejects select with no options', () => {
    const r = validateFieldDef(baseField({ type: 'select', options: [] } as unknown as Partial<FieldDef>));
    expect(r.ok).toBe(false);
  });

  it('rejects empty name', () => {
    const r = validateFieldDef(baseField({ name: '  ' }));
    expect(r.ok).toBe(false);
  });
});

describe('validateFieldDefs', () => {
  it('rejects duplicate names (case-insensitive)', () => {
    const a = baseField({ id: 'a', name: 'Mood' });
    const b = baseField({ id: 'b', name: 'mood' });
    const r = validateFieldDefs([a, b]);
    expect(r.ok).toBe(false);
  });

  it('accepts distinct names', () => {
    const a = baseField({ id: 'a', name: 'Mood' });
    const b = baseField({ id: 'b', name: 'Energy' });
    expect(validateFieldDefs([a, b])).toEqual({ ok: true });
  });
});

describe('newFieldId', () => {
  it('returns unique ids', () => {
    const ids = new Set([newFieldId(), newFieldId(), newFieldId()]);
    expect(ids.size).toBe(3);
  });

  it('starts with "f_"', () => {
    expect(newFieldId().startsWith('f_')).toBe(true);
  });
});
