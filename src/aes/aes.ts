import {
  arrayBufferToBase64,
  arrayBufferToString,
  base64ToArrayBuffer,
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
  return fromPromise(crypto.generateKey(params, extractable, ["encrypt", "decrypt"]));
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
 * @param aesKey instance of CryptoKey or in base64 format.
 * @param data data to encrypt; Arraybuffer or string.
 * @param encryptParams (optional) defaults to DEFAULT_AES_KEY_CONFIG.
 * @returns Observable with encrypted data and initialization
 *   vector in base64 format.
 */
export function encryptWithAes(
  aesKey: CryptoKey | string,
  data: ArrayBuffer | string,
  encryptParams:
    | RsaOaepParams
    | AesCtrParams
    | AesCbcParams
    | AesCmacParams
    | AesGcmParams
    | AesCfbParams = DEFAULT_ENCRYPT_PARAMS,
): Observable<{ enc64: string; iv: string }> {
  if (typeof data === "string") {
    data = stringToArrayBuffer(data);
  }

  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  encryptParams = { ...encryptParams, iv };

  return aesKeyToCryptoKey(aesKey).pipe(
    switchMap((aes: CryptoKey) =>
      fromPromise(crypto.encrypt(encryptParams, aes, data as ArrayBuffer)),
    ),
    map((buf: ArrayBuffer) => arrayBufferToBase64(buf)),
    map((base64: string) => ({
      enc64: base64,
      iv: arrayBufferToBase64(iv),
    })),
  );
}

export const DEFAULT_DECRYPT_PARAMS = DEFAULT_AES_KEY_CONFIG;

/**
 *
 * @param aesKey instance of CryptoKey or in base64 format.
 * @param encData data to decrypt; ArrayBuffer of base64 string
 * @param iv initialization vector which was used for encryption
 * @param decryptParams (optional) defaults to DEFAULT_AES_KEY_CONFIG
 * @returns Observable of decrypted data as string.
 *
 *   NOTE: The focus of this libary is currently onyl on string en-/decryption.
 *   If you want to use this libary for file encryption as well, please raise an
 *   issue and I will implement the necessary API for that.
 */
export function decryptWithAes(
  aesKey: CryptoKey | string,
  encData: ArrayBuffer | string,
  iv: string,
  decryptParams:
    | RsaOaepParams
    | AesCtrParams
    | AesCbcParams
    | AesCmacParams
    | AesGcmParams
    | AesCfbParams = DEFAULT_DECRYPT_PARAMS,
): Observable<string> {
  if (typeof encData === "string") {
    encData = base64ToArrayBuffer(encData);
  }

  const ivBuf = base64ToArrayBuffer(iv);
  decryptParams = { ...decryptParams, iv: ivBuf };

  return aesKeyToCryptoKey(aesKey).pipe(
    switchMap((aes: CryptoKey) =>
      fromPromise(crypto.decrypt(decryptParams, aes, encData as ArrayBuffer)),
    ),
    map((buf: ArrayBuffer) => arrayBufferToString(buf)),
  );
}
