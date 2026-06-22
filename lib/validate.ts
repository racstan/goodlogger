import { z } from 'zod';
import type { FieldDef, LogValues } from './schema';

const optEnum = (opts: string[]) => z.enum(opts as [string, ...string[]]);

const valueSchemaFor = (def: FieldDef): z.ZodTypeAny => {
  switch (def.type) {
    case 'text':
    case 'richtext':
      return def.required
        ? z.string().refine((s) => s.trim().length > 0, { message: 'cannot be empty' })
        : z.string().optional();
    case 'number':
      return def.required ? z.number() : z.number().optional();
    case 'boolean':
      return z.boolean();
    case 'date':
      return def.required
        ? z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
        : z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD').optional();
    case 'time':
      return def.required
        ? z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Use HH:MM')
        : z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Use HH:MM').optional();
    case 'email':
      return def.required
        ? z.string().email('Invalid email')
        : z.string().email('Invalid email').optional();
    case 'url':
      return def.required
        ? z.string().url('Invalid URL')
        : z.string().url('Invalid URL').optional();
    case 'phone':
      return def.required
        ? z.string().min(1, 'Phone is required')
        : z.string().optional();
    case 'color':
      return def.required
        ? z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Use #RRGGBB format')
        : z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Use #RRGGBB format').optional();
    case 'select':
      return def.required
        ? z.string().refine((s) => s.trim().length > 0, { message: 'cannot be empty' })
        : z.string().optional();
    case 'multiselect': {
      const arr = z.array(z.string());
      return def.required ? arr.min(1) : arr.optional();
    }
    case 'slider': {
      const n = z.number().refine((v) => Number.isFinite(v), { message: 'must be a number' })
        .refine((v) => v >= def.min && v <= def.max, { message: `must be between ${def.min} and ${def.max}` });
      return def.required ? n : n.optional();
    }
    case 'rating': {
      const max = def.max ?? 5;
      const n = z.number().min(0).max(max, { message: `must be between 0 and ${max}` });
      return def.required ? n : n.optional();
    }
    case 'incrementer':
      return z.union([
        z.string(),
        z.object({
          value: z.string(),
          rawDate: z.string().optional(),
          step: z.number().optional(),
        })
      ]);
  }
};

export function buildLogValueSchema(defs: FieldDef[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const d of defs) shape[d.id] = valueSchemaFor(d);
  return z.object(shape);
}

export function validateLogValues(defs: FieldDef[], values: LogValues) {
  return buildLogValueSchema(defs).safeParse(values);
}
