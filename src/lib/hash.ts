export async function sha256Hex(data: BufferSource): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function sha256Blob(file: Blob): Promise<string> {
  return sha256Hex(await file.arrayBuffer());
}

export const SHA256 = /^[a-f0-9]{64}$/;
