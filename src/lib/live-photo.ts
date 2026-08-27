/** Build an iPhone Live Photo pair: still JPEG + MOV with a shared asset id. */

const ENC = new TextEncoder();

export function liveAssetId(): string {
  return crypto.randomUUID().toUpperCase();
}

export function injectLiveJpeg(jpeg: Uint8Array, assetId: string): Uint8Array {
  if (jpeg.length < 4 || jpeg[0] !== 0xff || jpeg[1] !== 0xd8) return jpeg;
  const xmp = `<?xpacket begin="\ufeff" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about=""
    xmlns:Apple="http://ns.apple.com/livephotos/"
    Apple:ContentIdentifier="${assetId}"
    Apple:StillImageTime="0"/>
 </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
  const payload = concat(ENC.encode("http://ns.adobe.com/xap/1.0/\0"), ENC.encode(xmp));
  let insertAt = 2;
  if (jpeg[2] === 0xff && jpeg[3] === 0xe0) {
    insertAt = 4 + ((jpeg[4] << 8) | jpeg[5]);
  }
  const seg = new Uint8Array(4 + payload.length);
  seg[0] = 0xff;
  seg[1] = 0xe1;
  const len = payload.length + 2;
  seg[2] = (len >> 8) & 0xff;
  seg[3] = len & 0xff;
  seg.set(payload, 4);
  return concat(jpeg.subarray(0, insertAt), seg, jpeg.subarray(insertAt));
}

export function injectLiveMov(mp4: Uint8Array, assetId: string): Uint8Array {
  try {
    const top = readBoxes(mp4, 0, mp4.length);
    const moov = top.find((b) => b.type === "moov");
    const mdat = top.find((b) => b.type === "mdat");
    const ftyp = top.find((b) => b.type === "ftyp");
    if (!moov || !mdat || !ftyp) return mp4;
    const grown = appendMeta(sliceBox(mp4, moov), assetId);
    const rest = top.filter((b) => b.type !== "moov" && b.type !== "free" && b.type !== "skip");
    const mdatIndex = rest.findIndex((b) => b.type === "mdat");
    const before = rest.slice(0, mdatIndex);
    const after = rest.slice(mdatIndex);
    const beforeLen = before.reduce((n, b) => n + b.size, 0);
    const newMdatStart = beforeLen + grown.length;
    const patched = patchChunkOffsets(grown, newMdatStart - mdat.start);
    return concat(...before.map((b) => mp4.subarray(b.start, b.start + b.size)), patched, ...after.map((b) => mp4.subarray(b.start, b.start + b.size)));
  } catch {
    return mp4;
  }
}

export function zipStore(files: { name: string; data: Uint8Array }[]): Uint8Array {
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;
  for (const file of files) {
    const name = ENC.encode(file.name);
    const crc = crc32(file.data);
    const local = concat(
      u32(0x04034b50),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(file.data.length),
      u32(file.data.length),
      u16(name.length),
      u16(0),
      name,
      file.data,
    );
    const central = concat(
      u32(0x02014b50),
      u16(20),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(file.data.length),
      u32(file.data.length),
      u16(name.length),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(offset),
      name,
    );
    locals.push(local);
    centrals.push(central);
    offset += local.length;
  }
  const center = concat(...centrals);
  const eocd = concat(
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(files.length),
    u16(files.length),
    u32(center.length),
    u32(offset),
    u16(0),
  );
  return concat(...locals, center, eocd);
}

type Box = { type: string; start: number; size: number; header: number };

function readBoxes(buf: Uint8Array, start: number, end: number): Box[] {
  const out: Box[] = [];
  let off = start;
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  while (off + 8 <= end) {
    let size = view.getUint32(off);
    const type = String.fromCharCode(buf[off + 4], buf[off + 5], buf[off + 6], buf[off + 7]);
    let header = 8;
    if (size === 1 && off + 16 <= end) {
      const hi = view.getUint32(off + 8);
      const lo = view.getUint32(off + 12);
      size = hi * 2 ** 32 + lo;
      header = 16;
    } else if (size === 0) {
      size = end - off;
    }
    if (size < header || off + size > end) break;
    out.push({ type, start: off, size, header });
    off += size;
  }
  return out;
}

function sliceBox(buf: Uint8Array, box: Box): Uint8Array {
  return buf.subarray(box.start, box.start + box.size);
}

function appendMeta(moovBox: Uint8Array, assetId: string): Uint8Array {
  const header = moovBox[4] === 109 && moovBox[5] === 111 && moovBox[6] === 111 && moovBox[7] === 118 ? 8 : 8;
  const kids = readBoxes(moovBox, header, moovBox.length);
  const udta = kids.find((b) => b.type === "udta");
  const meta = makeMetaBox(assetId);
  if (udta) {
    const inner = moovBox.subarray(udta.start + udta.header, udta.start + udta.size);
    const newUdta = wrap("udta", concat(inner, meta));
    const before = moovBox.subarray(header, udta.start);
    const after = moovBox.subarray(udta.start + udta.size);
    return wrap("moov", concat(before, newUdta, after));
  }
  return wrap("moov", concat(moovBox.subarray(header), wrap("udta", meta)));
}

function wrap(type: string, payload: Uint8Array): Uint8Array {
  return concat(be32(8 + payload.length), ENC.encode(type), payload);
}

function wrapFull(type: string, version: number, payload: Uint8Array): Uint8Array {
  const vf = new Uint8Array(4);
  vf[0] = version;
  return wrap(type, concat(vf, payload));
}

function wrapIndex(index: number, dataBox: Uint8Array): Uint8Array {
  const size = 8 + dataBox.length;
  return concat(be32(size), be32(index), dataBox);
}

function dataUtf8(text: string): Uint8Array {
  return wrap("data", concat(be32(1), be32(0), ENC.encode(text)));
}

function dataInt(n: number): Uint8Array {
  return wrap("data", concat(be32(0x15), be32(0), be32(n)));
}

function makeMetaBox(assetId: string): Uint8Array {
  const names = [
    "com.apple.quicktime.content.identifier",
    "com.apple.quicktime.still-image-time",
    "com.apple.quicktime.live-photo.auto",
  ];
  const keyEntries = names.map((k) => {
    const body = ENC.encode(k);
    return concat(be32(8 + body.length), ENC.encode("mdta"), body);
  });
  const keysBox = wrapFull("keys", 0, concat(be32(names.length), ...keyEntries));
  const ilst = wrap(
    "ilst",
    concat(wrapIndex(1, dataUtf8(assetId)), wrapIndex(2, dataInt(0)), wrapIndex(3, dataInt(1))),
  );
  const hdlr = wrapFull(
    "hdlr",
    0,
    concat(be32(0), ENC.encode("mdir"), ENC.encode("appl"), be32(0), be32(0), be32(0), new Uint8Array([0])),
  );
  return wrapFull("meta", 0, concat(hdlr, keysBox, ilst));
}

function be32(n: number): Uint8Array {
  return new Uint8Array([(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff]);
}

function patchChunkOffsets(moovBox: Uint8Array, delta: number): Uint8Array {
  if (!delta) return moovBox;
  const out = new Uint8Array(moovBox);
  walk(out, 8, out.length);
  function walk(buf: Uint8Array, start: number, end: number) {
    for (const b of readBoxes(buf, start, end)) {
      if (b.type === "stco" || b.type === "co64") {
        const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
        const countOff = b.start + b.header + 4;
        const count = view.getUint32(countOff);
        let p = countOff + 4;
        if (b.type === "stco") {
          for (let i = 0; i < count && p + 4 <= b.start + b.size; i += 1, p += 4) {
            view.setUint32(p, view.getUint32(p) + delta);
          }
        } else {
          for (let i = 0; i < count && p + 8 <= b.start + b.size; i += 1, p += 8) {
            const hi = view.getUint32(p);
            const lo = view.getUint32(p + 4);
            let v = hi * 2 ** 32 + lo + delta;
            view.setUint32(p, Math.floor(v / 2 ** 32));
            view.setUint32(p + 4, v >>> 0);
          }
        }
      } else if (["trak", "mdia", "minf", "stbl", "edts"].includes(b.type)) {
        walk(buf, b.start + b.header, b.start + b.size);
      }
    }
  }
  return out;
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const len = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(len);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

function u16(n: number): Uint8Array {
  return new Uint8Array([n & 0xff, (n >> 8) & 0xff]);
}

function u32(n: number): Uint8Array {
  return new Uint8Array([n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >>> 24) & 0xff]);
}

const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i += 1) {
  let c = i;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[i] = c >>> 0;
}

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
