import { arrayBufferToBase64, base64ToArrayBuffer } from "arraybuffer-fns";
import { from, Observable } from "rxjs";
import { map, switchMap } from "rxjs/operators";

const crypto = window.crypto.subtle;

export const DEFAULT_AES_KEY_CONFIG = {
  name: "AES-GCM",
  length: 256,
  tagLength: 128,
};

export function generateAesKey(
  params: AesKeyGenParams | HmacKeyGenParams | Pbkdf2Params = DEFAULT_AES_KEY_CONFIG,
  extractable: boolean = true,
): Observable<CryptoKey> {
  return from(crypto.generateKey(params, extractable, ["encrypt", "decrypt"]));
}

export function generateAesKeyBase64(
  params: AesKeyGenParams | HmacKeyGenParams | Pbkdf2Params = DEFAULT_AES_KEY_CONFIG,
  extractable: boolean = true,
): Observable<string> {
  return generateAesKey(params, extractable).pipe(
    switchMap((k: CryptoKey) => crypto.exportKey("raw", k)),
    map((raw: ArrayBuffer) => arrayBufferToBase64(raw)),
  );
}

export function aesKeyBase64ToCryptoKey(
  aesBase64: string,
  importParams: AlgorithmIdentifier = { name: "AES-GCM" },
): Observable<CryptoKey> {
  return from(crypto.importKey("raw", base64ToArrayBuffer(aesBase64), importParams, false, ["encrypt", "decrypt"]));
}
