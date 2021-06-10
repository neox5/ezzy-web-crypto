import { arrayBufferToBase64, base64ToArrayBuffer } from "arraybuffer-fns";
import { from, Observable, of } from "rxjs";
import { map, switchMap } from "rxjs/operators";

const crypto = window.crypto.subtle;

export const DEFAULT_AES_KEY_CONFIG = {
  name: "AES-GCM",
  length: 256,
  tagLength: 128,
};

export function generateAesKey(
  params:
    | AesKeyGenParams
    | HmacKeyGenParams
    | Pbkdf2Params = DEFAULT_AES_KEY_CONFIG,
  extractable: boolean = true,
): Observable<CryptoKey> {
  return from(crypto.generateKey(params, extractable, ["encrypt", "decrypt"]));
}

export function generateAesKeyBase64(
  params:
    | AesKeyGenParams
    | HmacKeyGenParams
    | Pbkdf2Params = DEFAULT_AES_KEY_CONFIG,
  extractable: boolean = true,
): Observable<string> {
  return generateAesKey(params, extractable).pipe(
    switchMap((k: CryptoKey) => crypto.exportKey("raw", k)),
    map((raw: ArrayBuffer) => arrayBufferToBase64(raw)),
  );
}

/**
 * 
 * @param aesKey instance of CryptoKey or in base64 format
 * @param importParams (optional) defaults to AES-GCM
 * @returns Observable of aes key as CryptoKey
 */
export function aesKeyToCryptoKey(
  aesKey: CryptoKey | string,
  importParams: AlgorithmIdentifier = { name: "AES-GCM" },
): Observable<CryptoKey> {
  if (aesKey instanceof CryptoKey) {
    return of(aesKey)
  }

  return from(
    crypto.importKey(
      "raw",
      base64ToArrayBuffer(aesKey),
      importParams,
      false,
      ["encrypt", "decrypt"],
    ),
  );
}
