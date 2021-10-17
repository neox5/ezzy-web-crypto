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

// *****************************************************************************
// KEY GENERATION
// *****************************************************************************
export const DEFAULT_AES_KEY_CONFIG = {
  name: "AES-GCM",
  length: 256,
  tagLength: 128,
};

/**
 *
 * @param params (optional) defaults to DEFAULT_AES_KEY_CONFIG
 * @param extractable (optional) defaults to true
 * @returns observable of AES CryptoKey
 */
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

/**
 *
 * @param params (optional) defaults to DEFAULT_AES_KEY_CONFIG
 * @param extractable (optional) defautls to true
 * @returns observable of AES Key in base64 format
 */
export function generateAesKeyBase64(
  params:
    | AesKeyGenParams
    | HmacKeyGenParams
    | Pbkdf2Params = DEFAULT_AES_KEY_CONFIG,
  extractable: boolean = true,
): Observable<string> {
  return generateAesKey(params, extractable).pipe(
    switchMap((k: CryptoKey) => aesCryptoKeyToBase64(k)),
    map((aes: string) => aes), // Workaround for SwitchMap (rxjs v6.6.7) issue with TypeScript; fixed with rxjs v7.X.X
  );
}

// *****************************************************************************
// KEY CONVERSION
// *****************************************************************************
export function aesCryptoKeyToRaw(aesKey: CryptoKey): Observable<ArrayBuffer> {
  return fromPromise(crypto.exportKey("raw", aesKey));
}

export function aesCryptoKeyToBase64(aesKey: CryptoKey): Observable<string> {
  return aesCryptoKeyToRaw(aesKey).pipe(
    map((raw: ArrayBuffer) => arrayBufferToBase64(raw)),
  );
}

/**
 * Returns an AES CryptoKey from either a CryptoKey instance
 * or a base64 encoded string.
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

// *****************************************************************************
// GENERIC USECASE
// *****************************************************************************
export const DEFAULT_AES_ENCRYPT_PARAMS = DEFAULT_AES_KEY_CONFIG;

/**
 *
 * @param aesKey instance of CryptoKey or base64 encoded string
 * @param data data to encrypt as ArrayBuffer
 * @param encryptParams (optional) default to DEFAULT_AES_KEY_CONFIG
 * @returns observable of encrypted data prefixed with iv as ArrayBuffer
 */
export function encryptWithAes(
  aesKey: CryptoKey | string,
  data: ArrayBuffer,
  encryptParams:
    | RsaOaepParams
    | AesCtrParams
    | AesCbcParams
    | AesGcmParams = DEFAULT_AES_ENCRYPT_PARAMS,
): Observable<ArrayBuffer> {
  const iv = window.crypto.getRandomValues(new Uint8Array(16));

  encryptParams = { ...encryptParams, iv };

  return aesKeyToCryptoKey(aesKey).pipe(
    switchMap((aes: CryptoKey) =>
      fromPromise(crypto.encrypt(encryptParams, aes, data)),
    ),
    map((buf: ArrayBuffer) => appendArrayBuffer(iv, buf)),
  );
}

export const DEFAULT_AES_DECRYPT_PARAMS = DEFAULT_AES_KEY_CONFIG;

/**
 *
 * @param aesKey instance of CryptoKey or in base64 format
 * @param encData iv (first 16 bytes) with encrypted string as base64
 * @param decryptParams (optional) defaults to DEFAULT_AES_KEY_CONFIG
 * @returns Observable of decrypted string
 *
 */
export function decryptWithAes(
  aesKey: CryptoKey | string,
  encData: ArrayBuffer,
  decryptParams:
    | RsaOaepParams
    | AesCtrParams
    | AesCbcParams
    | AesGcmParams = DEFAULT_AES_DECRYPT_PARAMS,
): Observable<ArrayBuffer> {
  const { buf1, buf2 } = splitArrayBufferAt(encData, 16); // first 16 bytes are the iv
  decryptParams = { ...decryptParams, iv: buf1 };

  return aesKeyToCryptoKey(aesKey).pipe(
    switchMap((aes: CryptoKey) =>
      fromPromise(crypto.decrypt(decryptParams, aes, buf2)),
    ),
    map((buf: ArrayBuffer) => buf), // Workaround for SwitchMap (rxjs v6.6.7) issue with TypeScript; fixed with rxjs v7.X.X
  );
}

// *****************************************************************************
// STRING SPECIFIC USECASE
// *****************************************************************************
/**
 *
 * @param aesKey instance of CryptoKey or in base64 format
 * @param data data to encrypt; Arraybuffer or string.
 * @param encryptParams (optional) defaults to DEFAULT_AES_KEY_CONFIG.
 * @returns encrypted string with prefixed iv as base64
 */
export function encryptStringWithAes(
  aesKey: CryptoKey | string,
  str: string,
  encryptParams:
    | RsaOaepParams
    | AesCtrParams
    | AesCbcParams
    | AesGcmParams = DEFAULT_AES_ENCRYPT_PARAMS,
): Observable<string> {
  const stringAsBuf = stringToArrayBuffer(str);

  return encryptWithAes(aesKey, stringAsBuf, encryptParams).pipe(
    map((buf: ArrayBuffer) => arrayBufferToBase64(buf)),
  );
}

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
    | AesGcmParams = DEFAULT_AES_DECRYPT_PARAMS,
): Observable<string> {
  return decryptWithAes(
    aesKey,
    base64ToArrayBuffer(encData),
    decryptParams,
  ).pipe(map((buf: ArrayBuffer) => arrayBufferToString(buf)));
}
