/** Scale (w, h) so the longer side is at most `max`. Never upscales. */
export function fitSize(w: number, h: number, max: number): { w: number; h: number } {
  const long = Math.max(w, h);
  if (long <= max) return { w, h };
  const k = max / long;
  return { w: Math.round(w * k), h: Math.round(h * k) };
}

async function decode(file: Blob): Promise<{ src: CanvasImageSource; w: number; h: number; done: () => void }> {
  if (typeof createImageBitmap === "function") {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions);
      return { src: bmp, w: bmp.width, h: bmp.height, done: () => bmp.close() };
    } catch { /* fall back to <img> */ }
  }
  const url = URL.createObjectURL(file);
  const img = new Image();
  try {
    await new Promise<void>((ok, fail) => { img.onload = () => ok(); img.onerror = () => fail(new Error("Can't read this photo")); img.src = url; });
  } catch (e) { URL.revokeObjectURL(url); throw e; }
  return { src: img, w: img.naturalWidth, h: img.naturalHeight, done: () => URL.revokeObjectURL(url) };
}

/** Resize a photo to a JPEG whose longer side is <= max. Returns base64 without the data: prefix. */
export async function resizePhoto(file: Blob, max = 1280, quality = 0.8): Promise<string> {
  const { src, w, h, done } = await decode(file);
  try {
    const size = fitSize(w, h, max);
    const canvas = document.createElement("canvas");
    canvas.width = size.w; canvas.height = size.h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Can't process this photo");
    ctx.drawImage(src, 0, 0, size.w, size.h);
    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    return dataUrl.slice(dataUrl.indexOf(",") + 1);
  } finally { done(); }
}
