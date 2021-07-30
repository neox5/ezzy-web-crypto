import {
  arrayBufferToBase64,
  arrayBufferToString,
  base64ToArrayBuffer,
  stringToArrayBuffer,
} from "arraybuffer-fns";
import { Observable } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { publicKeyToCryptoKey, privateKeyToCryptoKey } from "../key-pair";
import { fromPromise } from "../util/from-promise";

const crypto = window.crypto.subtle;

export const DEFAULT_PUBLICKEY_ENCRYPT_CONFIG = {
  name: "RSA-OAEP",
};

/**
 *
 * @param pubkey as CryptoKey
 * @param data  as ArrayBuffer
 * @param encryptParams defaults to DEFAULT_PUBLICKEY_ENCRYPT_CONFIG
 * @returns observable of encrypted data as ArrayBuffer
 */
export function encryptWithPublicKey(
  pubkey: CryptoKey | string,
  data: ArrayBuffer,
  encryptParams:
    | AlgorithmIdentifier
    | RsaOaepParams
    | AesCtrParams
    | AesCbcParams
    | AesCmacParams
    | AesGcmParams
    | AesCfbParams = DEFAULT_PUBLICKEY_ENCRYPT_CONFIG,
): Observable<ArrayBuffer> {
  return publicKeyToCryptoKey(pubkey).pipe(
    switchMap((pub: CryptoKey) =>
      fromPromise(crypto.encrypt(encryptParams, pub, data)),
    ),
    map((buf: ArrayBuffer) => buf), // Workaround for SwitchMap (rxjs v6.6.7) issue with TypeScript; fixed with rxjs v7.X.X
  );
}

/**
 *
 * @param pubkey as CryptoKey or base64 encoded string
 * @param data as string
 * @param encryptParams defaults to DEFAULT_PUBLICKEY_ENCRYPT_CONFIG
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
    | AesCfbParams = DEFAULT_PUBLICKEY_ENCRYPT_CONFIG,
): Observable<string> {
  return encryptWithPublicKey(
    pubkey,
    stringToArrayBuffer(data),
    encryptParams,
  ).pipe(map((buf: ArrayBuffer) => arrayBufferToBase64(buf)));
}

export const DEFAULT_PRIVATEKEY_DECRYPT_CONFIG = {
  name: "RSA-OAEP",
};

/**
 *
 * @param privateKey as CryptoKey
 * @param encData as ArrayBuffer
 * @param decryptParams defaults to DEFAULT_PRIVATEKEY_DECRYPT_CONFIG
 * @returns observable of decrypted ArrayBuffer
 */
export function decryptWithPrivateKey(
  privateKey: CryptoKey | string,
  encData: ArrayBuffer,
  decryptParams:
    | AlgorithmIdentifier
    | RsaOaepParams
    | AesCtrParams
    | AesCbcParams
    | AesCmacParams
    | AesGcmParams
    | AesCfbParams = DEFAULT_PRIVATEKEY_DECRYPT_CONFIG,
): Observable<ArrayBuffer> {
  return privateKeyToCryptoKey(privateKey).pipe(
    switchMap((priv: CryptoKey) =>
      fromPromise(crypto.decrypt(decryptParams, priv, encData)),
    ),
    map((buf: ArrayBuffer) => buf), // Workaround for SwitchMap (rxjs v6.6.7) issue with TypeScript; fixed with rxjs v7.X.X
  );
}

/**
 *
 * @param privateKey as CryptoKey or base64 encoded string
 * @param encData as base64 encoded string
 * @param decryptParams defautls to DEFAULT_PRIVATEKEY_DECRYPT_CONFIG
 * @returns observable of decrypted string
 */
export function decryptStringWithPrivateKey(
  privateKey: CryptoKey | string,
  encData: string,
  decryptParams:
    | AlgorithmIdentifier
    | RsaOaepParams
    | AesCtrParams
    | AesCbcParams
    | AesCmacParams
    | AesGcmParams
    | AesCfbParams = DEFAULT_PRIVATEKEY_DECRYPT_CONFIG,
): Observable<string> {
  return decryptWithPrivateKey(
    privateKey,
    base64ToArrayBuffer(encData),
    decryptParams,
  ).pipe(map((buf: ArrayBuffer) => arrayBufferToString(buf)));
}
