import { arrayBufferToBase64 } from "arraybuffer-fns";
import { Base64 } from "../model/base64";

export function createSalt(): ArrayBuffer {
  return window.crypto.getRandomValues(new Uint8Array(16)) as ArrayBuffer;
}

export function saltToBase64(salt: ArrayBuffer): Base64 {
  return arrayBufferToBase64(salt);
}
