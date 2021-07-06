import {
  arrayBufferToBase64,
  arrayBufferToString,
  stringToArrayBuffer,
} from "arraybuffer-fns";
import { Observable } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { pubkeyToCryptoKey, secKeyToCryptoKey } from "../key-pair";
import { fromPromise } from "../util/from-promise";

const crypto = window.crypto.subtle;

export const DEFAULT_PUBKEY_ENCRYPT_CONFIG = {
  name: "RSA-OAEP",
};

/**
 * 
 * @param pubkey as CryptoKey
 * @param data  as ArrayBuffer
 * @param encryptParams defaults to DEFAULT_PUBKEY_ENCRYPT_CONFIG
 * @returns observable of encrypted data as ArrayBuffer
 */
export function encryptWithPublicKey(
  pubkey: CryptoKey,
  data: ArrayBuffer,
  encryptParams:
    | AlgorithmIdentifier
    | RsaOaepParams
    | AesCtrParams
    | AesCbcParams
    | AesCmacParams
    | AesGcmParams
    | AesCfbParams = DEFAULT_PUBKEY_ENCRYPT_CONFIG,
): Observable<ArrayBuffer> {
  return fromPromise(crypto.encrypt(encryptParams, pubkey, data));
}

/**
 * 
 * @param pubkey as CryptoKey or base64 encoded string
 * @param data as string
 * @param encryptParams defaults to DEFAULT_PUBKEY_ENCRYPT_CONFIG
 * @returns observable of encrypted string
 */
export function encryptStringWithPublicKey(
  pubkey: CryptoKey | string,
  data: string,
  encryptParams:
    | AlgorithmIdentifier
    | RsaOaepParams
    | AesCtrParams
    | AesCbcParams
    | AesCmacParams
    | AesGcmParams
    | AesCfbParams = DEFAULT_PUBKEY_ENCRYPT_CONFIG,
): Observable<string> {
  return pubkeyToCryptoKey(pubkey).pipe(
    switchMap((pub: CryptoKey) =>
      encryptWithPublicKey(pub, stringToArrayBuffer(data), encryptParams),
    ),
    map((buf: ArrayBuffer) => arrayBufferToBase64(buf)),
  );
}

export const DEFAULT_SECKEY_DECRYPT_CONFIG = {
  name: "RSA_OAEP",
};

/**
 * 
 * @param seckey as CryptoKey
 * @param encData as ArrayBuffer
 * @param decryptParams defaults to DEFAULT_SECKEY_DECRYPT_CONFIG
 * @returns observable of decrypted ArrayBuffer
 */
export function decryptWithSecretKey(
  seckey: CryptoKey,
  encData: ArrayBuffer,
  decryptParams:
    | AlgorithmIdentifier
    | RsaOaepParams
    | AesCtrParams
    | AesCbcParams
    | AesCmacParams
    | AesGcmParams
    | AesCfbParams = DEFAULT_SECKEY_DECRYPT_CONFIG,
): Observable<ArrayBuffer> {
  return fromPromise(crypto.decrypt(decryptParams, seckey, encData));
}

/**
 * 
 * @param seckey as CryptoKey or base64 encoded string
 * @param encData as base64 encoded string
 * @param decryptParams defautls to DEFAULT_SECKEY_DECRYPT_CONFIG
 * @returns observable of decrypted string
 */
export function decryptStringWithSecretKey(
  seckey: CryptoKey | string,
  encData: string,
  decryptParams:
    | AlgorithmIdentifier
    | RsaOaepParams
    | AesCtrParams
    | AesCbcParams
    | AesCmacParams
    | AesGcmParams
    | AesCfbParams = DEFAULT_SECKEY_DECRYPT_CONFIG,
): Observable<string> {
  return secKeyToCryptoKey(seckey).pipe(
    switchMap((sec: CryptoKey) =>
      decryptWithSecretKey(sec, stringToArrayBuffer(encData), decryptParams),
    ),
    map((buf: ArrayBuffer) => arrayBufferToString(buf)),
  );
}
