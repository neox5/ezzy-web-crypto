import {
  appendArrayBuffer,
  arrayBufferToBase64,
  arrayBufferToString,
  base64ToArrayBuffer,
  splitArrayBufferAt,
  stringToArrayBuffer,
} from "arraybuffer-fns";
import { Observable, of } from "rxjs";
import { map, switchMap } from "rxjs/operators";

import { fromPromise } from "../util/from-promise";

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
  return fromPromise(
    crypto.generateKey(params, extractable, ["encrypt", "decrypt"]),
  );
}

export function generateAesKeyBase64(
  params:
    | AesKeyGenParams
    | HmacKeyGenParams
    | Pbkdf2Params = DEFAULT_AES_KEY_CONFIG,
  extractable: boolean = true,
): Observable<string> {
  return generateAesKey(params, extractable).pipe(
    switchMap((k: CryptoKey) => fromPromise(crypto.exportKey("raw", k))),
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
    return of(aesKey);
  }

  return fromPromise(
    crypto.importKey("raw", base64ToArrayBuffer(aesKey), importParams, false, [
      "encrypt",
      "decrypt",
    ]),
  );
}

export const DEFAULT_ENCRYPT_PARAMS = DEFAULT_AES_KEY_CONFIG;

/**
 *
 * @param aesKey instance of CryptoKey or in base64 format
 * @param data data to encrypt; Arraybuffer or string.
 * @param encryptParams (optional) defaults to DEFAULT_AES_KEY_CONFIG.
 * @returns encrypted string with prefixed iv as base64
 */
export function encryptStringWithAes(
  aesKey: CryptoKey | string,
  data: ArrayBuffer | string,
  encryptParams:
    | RsaOaepParams
    | AesCtrParams
    | AesCbcParams
    | AesCmacParams
    | AesGcmParams
    | AesCfbParams = DEFAULT_ENCRYPT_PARAMS,
): Observable<string> {
  if (typeof data === "string") {
    data = stringToArrayBuffer(data);
  }

  const iv = window.crypto.getRandomValues(new Uint8Array(16));

  encryptParams = { ...encryptParams, iv };

  return aesKeyToCryptoKey(aesKey).pipe(
    switchMap((aes: CryptoKey) =>
      fromPromise(crypto.encrypt(encryptParams, aes, data as ArrayBuffer)),
    ),
    map((buf: ArrayBuffer) => appendArrayBuffer(iv, buf)),
    map((buf: ArrayBuffer) => arrayBufferToBase64(buf)),
  );
}

export const DEFAULT_DECRYPT_PARAMS = DEFAULT_AES_KEY_CONFIG;

/**
 *
 * @param aesKey instance of CryptoKey or in base64 format
 * @param encData iv (first 16 bytes) with encrypted string as base64
 * @param decryptParams (optional) defaults to DEFAULT_AES_KEY_CONFIG
 * @returns Observable of decrypted string
 *
 */
export function decryptStringWithAes(
  aesKey: CryptoKey | string,
  encData: string,
  decryptParams:
    | RsaOaepParams
    | AesCtrParams
    | AesCbcParams
    | AesCmacParams
    | AesGcmParams
    | AesCfbParams = DEFAULT_DECRYPT_PARAMS,
): Observable<string> {
  const buf = base64ToArrayBuffer(encData);
  const { buf1, buf2 } = splitArrayBufferAt(buf, 16); // first 16 bytes are the iv
  decryptParams = { ...decryptParams, iv: buf1 };

  return aesKeyToCryptoKey(aesKey).pipe(
    switchMap((aes: CryptoKey) =>
      fromPromise(crypto.decrypt(decryptParams, aes, buf2)),
    ),
    map((buf: ArrayBuffer) => arrayBufferToString(buf)),
  );
}
