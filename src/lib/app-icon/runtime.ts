import { Buffer } from "node:buffer";
import { deflateSync, inflateSync } from "node:zlib";
import { APP_ICON_CHUNK_0 } from "@/lib/app-icon/chunk-0";
import { APP_ICON_CHUNK_1 } from "@/lib/app-icon/chunk-1";
import { APP_ICON_CHUNK_2 } from "@/lib/app-icon/chunk-2";
import { APP_ICON_CHUNK_3 } from "@/lib/app-icon/chunk-3";
import { APP_ICON_CHUNK_4 } from "@/lib/app-icon/chunk-4";
import { APP_ICON_CHUNK_5 } from "@/lib/app-icon/chunk-5";
import { APP_ICON_CHUNK_6 } from "@/lib/app-icon/chunk-6";
import { APP_ICON_CHUNK_7 } from "@/lib/app-icon/chunk-7";

const SOURCE_PNG = Buffer.from(
  APP_ICON_CHUNK_0 +
    APP_ICON_CHUNK_1 +
    APP_ICON_CHUNK_2 +
    APP_ICON_CHUNK_3 +
    APP_ICON_CHUNK_4 +
    APP_ICON_CHUNK_5 +
    APP_ICON_CHUNK_6 +
    APP_ICON_CHUNK_7,
  "base64",
);

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const CACHE = new Map<number, Buffer>();

let crcTable: Uint32Array | null = null;
function getCrcTable() {
  if (crcTable) return crcTable;
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  crcTable = table;
  return table;
}

function crc32(input: Buffer) {
  const table = getCrcTable();
  let c = 0xffffffff;
  for (const byte of input) c = table[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data = Buffer.alloc(0)) {
  const typeBytes = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 0);
  return Buffer.concat([length, typeBytes, data, crc]);
}

function paeth(a: number, b: number, c: number) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function decodeIndexedPng(source: Buffer) {
  if (!source.subarray(0, 8).equals(PNG_SIGNATURE)) throw new Error("Invalid PNG signature");

  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  let palette: Buffer | null = null;
  const idat: Buffer[] = [];

  while (offset + 12 <= source.length) {
    const length = source.readUInt32BE(offset);
    const type = source.toString("ascii", offset + 4, offset + 8);
    const data = source.subarray(offset + 8, offset + 8 + length);
    offset += 12 + length;

    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === "PLTE") {
      palette = Buffer.from(data);
    } else if (type === "IDAT") {
      idat.push(Buffer.from(data));
    } else if (type === "IEND") {
      break;
    }
  }

  if (!width || !height || bitDepth !== 8 || colorType !== 3 || !palette || !idat.length) {
    throw new Error("Unsupported app icon PNG format");
  }

  const packed = inflateSync(Buffer.concat(idat));
  const stride = width;
  const indices = Buffer.alloc(width * height);
  let read = 0;

  for (let y = 0; y < height; y += 1) {
    const filter = packed[read++];
    const row = y * stride;
    const previous = row - stride;
    for (let x = 0; x < stride; x += 1) {
      const raw = packed[read++];
      const left = x > 0 ? indices[row + x - 1] : 0;
      const up = y > 0 ? indices[previous + x] : 0;
      const upLeft = x > 0 && y > 0 ? indices[previous + x - 1] : 0;
      let predictor = 0;
      if (filter === 1) predictor = left;
      else if (filter === 2) predictor = up;
      else if (filter === 3) predictor = Math.floor((left + up) / 2);
      else if (filter === 4) predictor = paeth(left, up, upLeft);
      else if (filter !== 0) throw new Error(`Unsupported PNG filter ${filter}`);
      indices[row + x] = (raw + predictor) & 0xff;
    }
  }

  const rgb = Buffer.alloc(width * height * 3);
  for (let i = 0; i < indices.length; i += 1) {
    const paletteOffset = indices[i] * 3;
    const rgbOffset = i * 3;
    rgb[rgbOffset] = palette[paletteOffset] ?? 0;
    rgb[rgbOffset + 1] = palette[paletteOffset + 1] ?? 0;
    rgb[rgbOffset + 2] = palette[paletteOffset + 2] ?? 0;
  }
  return { width, height, rgb };
}

const SOURCE = decodeIndexedPng(SOURCE_PNG);

function scaleRgb(target: number) {
  const { width, height, rgb } = SOURCE;
  if (target === width && target === height) return Buffer.from(rgb);

  const out = Buffer.alloc(target * target * 3);
  for (let y = 0; y < target; y += 1) {
    const sy = ((y + 0.5) * height) / target - 0.5;
    const y0 = Math.max(0, Math.min(height - 1, Math.floor(sy)));
    const y1 = Math.max(0, Math.min(height - 1, y0 + 1));
    const fy = Math.max(0, Math.min(1, sy - Math.floor(sy)));
    for (let x = 0; x < target; x += 1) {
      const sx = ((x + 0.5) * width) / target - 0.5;
      const x0 = Math.max(0, Math.min(width - 1, Math.floor(sx)));
      const x1 = Math.max(0, Math.min(width - 1, x0 + 1));
      const fx = Math.max(0, Math.min(1, sx - Math.floor(sx)));
      const dst = (y * target + x) * 3;
      const a = (y0 * width + x0) * 3;
      const b = (y0 * width + x1) * 3;
      const c = (y1 * width + x0) * 3;
      const d = (y1 * width + x1) * 3;
      for (let channel = 0; channel < 3; channel += 1) {
        const top = rgb[a + channel] * (1 - fx) + rgb[b + channel] * fx;
        const bottom = rgb[c + channel] * (1 - fx) + rgb[d + channel] * fx;
        out[dst + channel] = Math.round(top * (1 - fy) + bottom * fy);
      }
    }
  }
  return out;
}

function encodeRgbPng(size: number, rgb: Buffer) {
  const scanlines = Buffer.alloc(size * (1 + size * 3));
  for (let y = 0; y < size; y += 1) {
    const rowStart = y * (1 + size * 3);
    scanlines[rowStart] = 0;
    rgb.copy(scanlines, rowStart + 1, y * size * 3, (y + 1) * size * 3);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    PNG_SIGNATURE,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", deflateSync(scanlines, { level: 9 })),
    pngChunk("IEND"),
  ]);
}

export function getAppIconPng(size: 32 | 180 | 192 | 512) {
  const cached = CACHE.get(size);
  if (cached) return cached;
  const png = encodeRgbPng(size, scaleRgb(size));
  CACHE.set(size, png);
  return png;
}

export function appIconResponse(size: 32 | 180 | 192 | 512) {
  const bytes = getAppIconPng(size);
  return new Response(bytes, {
    headers: {
      "content-type": "image/png",
      "content-length": String(bytes.byteLength),
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
