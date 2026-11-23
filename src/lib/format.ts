export const fmtRecord = (w: number, l: number, t: number) => `${w}-${l}${t ? `-${t}` : ''}`;

export const MAX_NAME_LENGTH = 24;

/** "Kartik" → "Kartik's", "James" → "James'", blank → "My". */
export function ownerLabel(name: string | undefined): string {
  const n = (name ?? '').trim().slice(0, MAX_NAME_LENGTH);
  if (!n) return 'My';
  return /s$/i.test(n) ? `${n}'` : `${n}'s`;
}
