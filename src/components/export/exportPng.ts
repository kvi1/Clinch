import { toBlob } from 'html-to-image';

/** Captures `node` as a PNG; shares it via the Web Share API on mobile, otherwise downloads it. */
export async function exportPng(node: HTMLElement, filename: string): Promise<void> {
  const blob = await toBlob(node, { pixelRatio: 2, cacheBust: true });
  if (!blob) throw new Error('Image capture failed');
  const file = new File([blob], filename, { type: 'image/png' });
  const isTouch = window.matchMedia('(pointer: coarse)').matches;
  if (isTouch && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'My NFL playoff projection' });
      return;
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
