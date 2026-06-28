import { z } from 'zod';

export type FieldType =
  | 'text'
  | 'number'
  | 'boolean'
  | 'select'
  | 'multiselect'
  | 'date'
  | 'time'
  | 'slider'
  | 'email'
  | 'url'
  | 'phone'
  | 'color'
  | 'richtext'
  | 'rating'
  | 'incrementer'
  | 'image'
  | 'audio'
  | 'video';

type Base = { id: string; name: string; required: boolean };

export type FieldDef =
  | (Base & { type: 'text' | 'number' | 'date' | 'time' | 'email' | 'url' | 'phone' | 'color' | 'richtext' | 'image' | 'audio' | 'video' })
  | (Base & { type: 'boolean' })
  | (Base & { type: 'select' | 'multiselect'; options: string[] })
  | (Base & { type: 'slider'; min: number; max: number; step: number })
  | (Base & { type: 'rating'; max?: number })
  | (Base & {
      type: 'incrementer';
      incType: 'number' | 'character' | 'date' | 'sequence';
      startChar?: string;
      startDate?: string;
      dateStep?: number;
      sequence?: string;
    });

export type LogValue = string | number | boolean | string[] | { value: string; rawDate?: string; step?: number };
export type LogValues = Record<string, LogValue>;

export function newFieldId(): string {
  return 'f_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export const fieldDefSchema = z.discriminatedUnion('type', [
  z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    required: z.boolean(),
    type: z.enum(['text', 'number', 'date', 'time', 'email', 'url', 'phone', 'color', 'richtext', 'image', 'audio', 'video']),
  }),
  z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    required: z.boolean(),
    type: z.literal('boolean'),
  }),
  z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    required: z.boolean(),
    type: z.enum(['select', 'multiselect']),
    options: z.array(z.string().min(1)).min(1),
  }),
  z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    required: z.boolean(),
    type: z.literal('slider'),
    min: z.number(),
    max: z.number(),
    step: z.number().positive(),
  }),
  z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    required: z.boolean(),
    type: z.literal('rating'),
    max: z.number().optional(),
  }),
  z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    required: z.boolean(),
    type: z.literal('incrementer'),
    incType: z.enum(['number', 'character', 'date', 'sequence']),
    startChar: z.string().optional(),
    startDate: z.string().optional(),
    dateStep: z.number().optional(),
    sequence: z.string().optional(),
  }),
]);

export type ValidationResult = { ok: true } | { ok: false; error: string };

export function validateFieldDef(def: FieldDef): ValidationResult {
  const trimmedName = def.name.trim();
  if (!trimmedName) return { ok: false, error: 'Name is required' };
  const probe = { ...def, name: trimmedName };
  const r = fieldDefSchema.safeParse(probe);
  if (!r.success) return { ok: false, error: r.error.issues[0]?.message ?? 'Invalid field' };
  if (probe.type === 'slider' && probe.min >= probe.max) {
    return { ok: false, error: 'min must be less than max' };
  }
  if (probe.type === 'incrementer') {
    if (probe.incType === 'character') {
      const char = (probe.startChar || '').trim();
      if (char.length !== 1 || !/[a-zA-Z]/.test(char)) {
        return { ok: false, error: 'Character incrementer must start with a single letter (a-z or A-Z)' };
      }
    }
    if (probe.incType === 'date' && probe.startDate) {
      const dateStr = probe.startDate.trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr) || isNaN(Date.parse(dateStr))) {
        return { ok: false, error: 'Start date must be in YYYY-MM-DD format' };
      }
    }
    if (probe.incType === 'sequence') {
      const seq = (probe.sequence || '').trim();
      if (!seq) {
        return { ok: false, error: 'Sequence definition is required (e.g. ant-> rabbit-> potato)' };
      }
    }
  }
  return { ok: true };
}

export function validateFieldDefs(defs: FieldDef[]): ValidationResult {
  const seen = new Set<string>();
  for (const d of defs) {
    const key = d.name.trim().toLowerCase();
    if (seen.has(key)) return { ok: false, error: `Duplicate field name: "${d.name}"` };
    seen.add(key);
    const r = validateFieldDef(d);
    if (!r.ok) return r;
  }
  return { ok: true };
}
