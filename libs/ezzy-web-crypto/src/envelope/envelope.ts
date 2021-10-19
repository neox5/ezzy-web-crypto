import { arrayBufferToBase64, base64ToArrayBuffer } from "arraybuffer-fns";
import { combineLatest, Observable } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { aesKeyToCryptoKey, DEFAULT_AES_KEY_CONFIG } from "../aes";
import {
  DEFAULT_RSA_KEY_CONFIG,
  publicKeyToCryptoKey,
  privateKeyToCryptoKey,
} from "../key-pair";
import { fromPromise } from "../util/from-promise";

const crypto = window.crypto.subtle;

// *****************************************************************************
// GENERIC USECASE
// *****************************************************************************
export const DEFAULT_WRAP_PARAMS = DEFAULT_RSA_KEY_CONFIG;

/**
 *
 * @param publicKey instance of CryptoKey or in base64 formate.
 * @param aesKey instance of CryptoKey or in base64 formate.
 * @param wrapParams (optional) if not specified DEFAULT_RSA_KEY_CONFIG is used
 *   as default.
 * @returns Observable of wrapped AES key as ArrayBuffer.
 */
export function wrapAesInEnvelope(
  publicKey: CryptoKey | string,
  aesKey: CryptoKey | string,
  wrapParams:
    | AlgorithmIdentifier
    | RsaOaepParams
    | AesCtrParams
    | AesCbcParams
    | AesCmacParams
    | AesGcmParams
    | AesCfbParams = DEFAULT_WRAP_PARAMS
): Observable<ArrayBuffer> {
  const pub$ = publicKeyToCryptoKey(publicKey);
  const aes$ = aesKeyToCryptoKey(aesKey);

  return combineLatest([pub$, aes$]).pipe(
    switchMap(([pub, aes]) =>
      fromPromise(
        crypto.wrapKey("raw", aes as CryptoKey, pub as CryptoKey, wrapParams)
      )
    ),
    map((raw: ArrayBuffer) => raw) // Workaround for SwitchMap (rxjs v6.6.7) issue with TypeScript; fixed with rxjs v7.X.X
    // map((raw: ArrayBuffer) => arrayBufferToBase64(raw)),
  );
}

export const DEFAULT_UNWRAP_PARAMS = DEFAULT_RSA_KEY_CONFIG;
export const DEFAULT_UNWRAP_KEY_PARAMS = DEFAULT_AES_KEY_CONFIG;

/**
 *
 * @param envelope wrapped AES envelope as ArrayBuffer
 * @param privateKey unwrapping key; instance of CryptoKey or in base64 format
 * @param unwrapParams (optional) defaults to DEFAULT_RSA_KEY_CONFIG
 * @param unwrappedKeyParams (optional) defaults to DEFAULT_AES_KEY_CONFIG
 * @returns observable of initially wrapped AES CryptoKey
 */
export function unwrapEnvelope(
  envelope: ArrayBuffer,
  privateKey: CryptoKey | string,
  unwrapParams:
    | AlgorithmIdentifier
    | RsaOaepParams
    | AesCtrParams
    | AesCbcParams
    | AesCmacParams
    | AesGcmParams
    | AesCfbParams = DEFAULT_UNWRAP_PARAMS,
  unwrappedKeyParams:
    | AlgorithmIdentifier
    | RsaHashedImportParams
    | EcKeyImportParams
    | HmacImportParams
    | DhImportKeyParams
    | AesKeyAlgorithm = DEFAULT_UNWRAP_KEY_PARAMS
): Observable<CryptoKey> {
  return privateKeyToCryptoKey(privateKey).pipe(
    switchMap((sec: CryptoKey) =>
      fromPromise(
        crypto.unwrapKey(
          "raw",
          envelope,
          sec,
          unwrapParams,
          unwrappedKeyParams,
          true,
          ["decrypt", "encrypt"]
        )
      )
    ),
    map((value: CryptoKey) => value) // Workaround for SwitchMap (rxjs v6.6.7) issue with TypeScript; fixed with rxjs v7.X.X
  );
}

// *****************************************************************************
// ENVELOPE AS BASE64 STRING
// *****************************************************************************
/**
 *
 * @param publicKey instance of CryptoKey or in base64 formate.
 * @param aesKey instance of CryptoKey or in base64 formate.
 * @param wrapParams (optional) if not specified DEFAULT_RSA_KEY_CONFIG is used
 *   as default.
 * @returns Observable of wrapped key in base64 format.
 */
export function wrapAesInBase64Envelope(
  publicKey: CryptoKey | string,
  aesKey: CryptoKey | string,
  wrapParams:
    | AlgorithmIdentifier
    | RsaOaepParams
    | AesCtrParams
    | AesCbcParams
    | AesCmacParams
    | AesGcmParams
    | AesCfbParams = DEFAULT_WRAP_PARAMS
): Observable<string> {
  return wrapAesInEnvelope(publicKey, aesKey, wrapParams).pipe(
    map((envelope: ArrayBuffer) => arrayBufferToBase64(envelope))
  );
}

/**
 *
 * @param envelope wrapped aes key in base64 format
 * @param privateKey unwrapping key; instance of CryptoKey or in base64 format
 * @param unwrapParams (optional) defaults to DEFAULT_RSA_KEY_CONFIG
 * @param unwrappedKeyParams (optional) defaults to DEFAULT_AES_KEY_CONFIG
 * @returns observable of initially wrapped AES CryptoKey
 */
export function unwrapBase64Envelope(
  envelope: string,
  privateKey: CryptoKey | string,
  unwrapParams:
    | AlgorithmIdentifier
    | RsaOaepParams
    | AesCtrParams
    | AesCbcParams
    | AesCmacParams
    | AesGcmParams
    | AesCfbParams = DEFAULT_UNWRAP_PARAMS,
  unwrappedKeyParams:
    | AlgorithmIdentifier
    | RsaHashedImportParams
    | EcKeyImportParams
    | HmacImportParams
    | DhImportKeyParams
    | AesKeyAlgorithm = DEFAULT_UNWRAP_KEY_PARAMS
): Observable<CryptoKey> {
  return unwrapEnvelope(
    base64ToArrayBuffer(envelope),
    privateKey,
    unwrapParams,
    unwrappedKeyParams
  );
}
