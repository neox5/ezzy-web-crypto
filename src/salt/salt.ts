import { arrayBufferToBase64 } from "arraybuffer-fns";

export function createSalt(): ArrayBuffer {
  return window.crypto.getRandomValues(new Uint8Array(16)) as ArrayBuffer;
}

export function saltToBase64(salt: ArrayBuffer): string {
  return arrayBufferToBase64(salt);
}
