export const fmtRecord = (w: number, l: number, t: number) => `${w}-${l}${t ? `-${t}` : ''}`;

export const MAX_NAME_LENGTH = 24;

/** "Kartik" → "Kartik's", "James" → "James'". */
export const possessive = (name: string) => (/s$/i.test(name) ? `${name}'` : `${name}'s`);
