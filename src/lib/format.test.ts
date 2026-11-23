import { describe, expect, it } from 'vitest';
import { fmtRecord, ownerLabel } from './format';

describe('format', () => {
  it('formats records, showing ties only when present', () => {
    expect(fmtRecord(9, 7, 1)).toBe('9-7-1');
    expect(fmtRecord(12, 5, 0)).toBe('12-5');
  });

  it('builds the card owner label', () => {
    expect(ownerLabel('')).toBe('My');
    expect(ownerLabel('   ')).toBe('My');
    expect(ownerLabel(undefined)).toBe('My');
    expect(ownerLabel(' Kartik ')).toBe("Kartik's");
    expect(ownerLabel('James')).toBe("James'");
    expect(ownerLabel('@giantsfan')).toBe("@giantsfan's");
  });
});
