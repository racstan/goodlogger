import type { FieldDef } from './schema';

export type IncrementerSubtype = 'number' | 'character' | 'date' | 'sequence';

export type IncrementerValue = {
  value: string;
  rawDate?: string;
  step?: number;
};

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function parseLocalDate(dateStr: string): Date {
  const parts = dateStr.split('-');
  const y = Number(parts[0]);
  const m = Number(parts[1]) - 1;
  const d = Number(parts[2]);
  return new Date(y, m, d);
}

function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseSequence(seqStr: string | undefined): string[] {
  if (!seqStr) return [];
  // Split by arrows ->, commas, or newlines
  return seqStr
    .split(/->|,|\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function getNextIncrementerValue(
  field: FieldDef & { type: 'incrementer' },
  lastLoggedValue: any
): IncrementerValue {
  // Extract values if stored as an object or fallback to string/number
  let lastValStr = '';
  let lastRawDate = '';
  let lastStep = field.dateStep ?? 1;

  if (lastLoggedValue !== undefined && lastLoggedValue !== null) {
    if (typeof lastLoggedValue === 'object') {
      lastValStr = String(lastLoggedValue.value ?? '');
      lastRawDate = String(lastLoggedValue.rawDate ?? '');
      lastStep = typeof lastLoggedValue.step === 'number' ? lastLoggedValue.step : (field.dateStep ?? 1);
    } else {
      lastValStr = String(lastLoggedValue);
    }
  }

  const incType = field.incType;

  if (incType === 'number') {
    if (!lastValStr) {
      return { value: '0' };
    }
    const num = parseInt(lastValStr, 10);
    const nextNum = isNaN(num) ? 0 : num + 1;
    return { value: String(nextNum) };
  }

  if (incType === 'character') {
    const startChar = (field.startChar || 'a').trim();
    if (!lastValStr) {
      return { value: startChar || 'a' };
    }
    const code = lastValStr.charCodeAt(0);
    let nextCode = code;
    if (code >= 97 && code <= 122) {
      // Lowercase a-z
      nextCode = code + 1;
      if (nextCode > 122) nextCode = 97;
    } else if (code >= 65 && code <= 90) {
      // Uppercase A-Z
      nextCode = code + 1;
      if (nextCode > 90) nextCode = 65;
    } else {
      nextCode = 97; // Fallback to 'a'
    }
    return { value: String.fromCharCode(nextCode) };
  }

  if (incType === 'date') {
    const defaultStep = field.dateStep ?? 1;
    if (!lastLoggedValue) {
      // First log: use the configured start date, or today
      let startDateStr = field.startDate ? field.startDate.trim() : '';
      if (!startDateStr) {
        startDateStr = formatLocalDate(new Date());
      }
      try {
        const d = parseLocalDate(startDateStr);
        const dayName = DAYS[d.getDay()];
        return {
          value: `${startDateStr} (${dayName})`,
          rawDate: startDateStr,
          step: defaultStep,
        };
      } catch {
        const todayStr = formatLocalDate(new Date());
        const d = new Date();
        return {
          value: `${todayStr} (${DAYS[d.getDay()]})`,
          rawDate: todayStr,
          step: defaultStep,
        };
      }
    }

    // Subsequent logs: increment using the step specified in the previous log entry
    const baseDateStr = lastRawDate || lastValStr.split(' ')[0] || '';
    let nextDate: Date;
    try {
      nextDate = parseLocalDate(baseDateStr);
      // Increment by the step logged in the last entry
      nextDate.setDate(nextDate.getDate() + lastStep);
    } catch {
      nextDate = new Date();
    }

    const nextDateStr = formatLocalDate(nextDate);
    const dayName = DAYS[nextDate.getDay()];
    return {
      value: `${nextDateStr} (${dayName})`,
      rawDate: nextDateStr,
      step: defaultStep, // Prefill the form with default template step for the next increment
    };
  }

  if (incType === 'sequence') {
    const seq = parseSequence(field.sequence);
    if (seq.length === 0) {
      return { value: '' };
    }
    if (!lastValStr) {
      return { value: seq[0] };
    }
    const idx = seq.indexOf(lastValStr);
    if (idx === -1) {
      return { value: seq[0] };
    }
    const nextIdx = (idx + 1) % seq.length;
    return { value: seq[nextIdx] };
  }

  return { value: '' };
}
