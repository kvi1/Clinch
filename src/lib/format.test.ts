import { describe, expect, it } from 'vitest';
import { fmtRecord, possessive } from './format';

describe('format', () => {
  it('formats records, showing ties only when present', () => {
    expect(fmtRecord(9, 7, 1)).toBe('9-7-1');
    expect(fmtRecord(12, 5, 0)).toBe('12-5');
  });

  it('makes names possessive', () => {
    expect(possessive('Kartik')).toBe("Kartik's");
    expect(possessive('James')).toBe("James'");
    expect(possessive('@giantsfan')).toBe("@giantsfan's");
  });
});
