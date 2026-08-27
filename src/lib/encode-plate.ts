import { MAX_ORIGINAL_BYTES } from "@/lib/upload-limit";

export { MAX_ORIGINAL_BYTES };

export type EncodedPlate = {
  file: File;
  previewBlob: Blob;
  thumbBlob: Blob;
  previewDataUrl: string;
  width: number;
  height: number;
  bytes: number;
  mime: string;
  live: boolean;
};

const IMAGE_TYPE = /^image\/(jpeg|png|webp)$/i;
const VIDEO_TYPE = /^video\/(mp4|quicktime|webm)$/i;
const IMAGE_NAME = /\.(jpe?g|png|webp)$/i;
const VIDEO_NAME = /\.(mp4|mov|m4v|webm)$/i;

export async function encodePlate(
  file: File,
): Promise<{ ok: true; plate: EncodedPlate } | { ok: false; error: "type" | "size" | "ratio" }> {
  const isVideo = VIDEO_TYPE.test(file.type) || VIDEO_NAME.test(file.name);
  const isImage = IMAGE_TYPE.test(file.type) || IMAGE_NAME.test(file.name);
  if (isVideo || !isImage) return { ok: false, error: "type" };
  if (file.size > MAX_ORIGINAL_BYTES) return { ok: false, error: "size" };
  return encodeImage(file);
}

async function encodeImage(file: File): Promise<{ ok: true; plate: EncodedPlate } | { ok: false; error: "ratio" }> {
  const bmp = await createImageBitmap(file);
  const width = bmp.width;
  const height = bmp.height;
  if (width < 8 || height < 8) {
    bmp.close();
    return { ok: false, error: "ratio" };
  }
  const longEdge = Math.max(width, height);
  const preview = await drawJpeg(bmp, Math.min(1280, longEdge), 0.84);
  const thumb = await drawJpeg(bmp, Math.min(480, longEdge), 0.72);
  bmp.close();
  return {
    ok: true,
    plate: {
      file,
      previewBlob: preview.blob,
      thumbBlob: thumb.blob,
      previewDataUrl: preview.dataUrl,
      width,
      height,
      bytes: file.size,
      mime: file.type || "image/jpeg",
      live: false,
    },
  };
}

export async function drawJpeg(bmp: ImageBitmap, longEdge: number, quality: number) {
  const srcLong = Math.max(bmp.width, bmp.height);
  const scale = longEdge / srcLong;
  const w = Math.max(1, Math.round(bmp.width * scale));
  const h = Math.max(1, Math.round(bmp.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(bmp, 0, 0, w, h);
  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  const blob = await canvasToJpeg(canvas, quality);
  return { blob, dataUrl, w, h };
}

export async function capToMax(file: File, max = MAX_ORIGINAL_BYTES): Promise<File> {
  if (file.size <= max) return file;
  const bmp = await createImageBitmap(file);
  let quality = 0.88;
  let long = Math.min(2560, Math.max(bmp.width, bmp.height));
  let out = file;
  try {
    for (let i = 0; i < 6; i += 1) {
      const drawn = await drawJpeg(bmp, long, quality);
      out = new File([drawn.blob], `${file.name.replace(/\.[^.]+$/, "")}.jpg`, { type: "image/jpeg" });
      if (out.size <= max) break;
      quality = Math.max(0.6, quality - 0.08);
      long = Math.max(1080, Math.round(long * 0.88));
    }
  } finally {
    bmp.close();
  }
  return out;
}

export function aspectFromSize(w: number, h: number): string {
  if (!w || !h) return "1:1";
  const r = w / h;
  const presets: [number, string][] = [
    [9 / 16, "9:16"],
    [9 / 19.5, "9:19.5"],
    [9 / 20, "9:20"],
    [16 / 9, "16:9"],
    [1, "1:1"],
    [4 / 3, "4:3"],
    [3 / 4, "3:4"],
    [3 / 2, "3:2"],
    [2 / 3, "2:3"],
    [21 / 9, "21:9"],
    [9 / 21, "9:21"],
  ];
  const hit = presets.find(([v]) => Math.abs(r - v) < 0.045);
  if (hit) return hit[1];
  const g = (a: number, b: number): number => (b ? g(b, a % b) : a);
  const d = g(Math.round(w), Math.round(h)) || 1;
  return `${Math.round(w / d)}:${Math.round(h / d)}`;
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("blob"))), "image/jpeg", quality);
  });
}

/** Downscale for the Imagine edit request — keep payload small, let the model output 2K. */
export async function prepareEnhanceSource(file: File): Promise<{ blob: Blob; aspect: string }> {
  const bmp = await createImageBitmap(file);
  const aspect = aspectFromSize(bmp.width, bmp.height);
  const long = Math.max(bmp.width, bmp.height);
  const out = await drawJpeg(bmp, Math.min(1280, long), 0.84);
  bmp.close();
  return { blob: out.blob, aspect };
}

/** Local polish when Imagine is unavailable — contrast, color, light sharpen. */
export async function enhanceLocalFile(file: File): Promise<File> {
  const bmp = await createImageBitmap(file);
  const srcLong = Math.max(bmp.width, bmp.height);
  const scale = srcLong > 2560 ? 2560 / srcLong : 1;
  const w = Math.max(1, Math.round(bmp.width * scale));
  const h = Math.max(1, Math.round(bmp.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bmp.close();
    throw new Error("canvas");
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.filter = "contrast(1.12) saturate(1.14) brightness(1.03)";
  ctx.drawImage(bmp, 0, 0, w, h);
  ctx.filter = "none";
  sharpenCanvas(ctx, w, h);
  bmp.close();
  const blob = await canvasToJpeg(canvas, 0.92);
  return capToMax(new File([blob], "enhanced.jpg", { type: "image/jpeg" }));
}

function sharpenCanvas(ctx: CanvasRenderingContext2D, w: number, h: number) {
  if (w * h > 4_000_000) return;
  const src = ctx.getImageData(0, 0, w, h);
  const out = ctx.createImageData(w, h);
  const s = src.data;
  const d = out.data;
  const mix = 0.28;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = (y * w + x) * 4;
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) {
        d[i] = s[i];
        d[i + 1] = s[i + 1];
        d[i + 2] = s[i + 2];
        d[i + 3] = s[i + 3];
        continue;
      }
      for (let c = 0; c < 3; c += 1) {
        const center = s[i + c];
        const sharp =
          center * 5 -
          s[i - 4 + c] -
          s[i + 4 + c] -
          s[i - w * 4 + c] -
          s[i + w * 4 + c];
        d[i + c] = Math.max(0, Math.min(255, center * (1 - mix) + sharp * mix));
      }
      d[i + 3] = s[i + 3];
    }
  }
  ctx.putImageData(out, 0, 0);
}

export function fileFromB64(b64: string, mime: string, name: string): File {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return new File([bytes], name, { type: mime || "image/jpeg" });
}
