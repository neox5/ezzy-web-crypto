import { arrayBufferToBase64, base64ToArrayBuffer } from "arraybuffer-fns";
import { combineLatest, from, Observable } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { aesKeyToCryptoKey, DEFAULT_AES_KEY_CONFIG } from "../aes";
import {
  DEFAULT_RSA_KEY_CONFIG,
  pubKeyToCryptoKey,
  secKeyToCryptoKey,
} from "../key-pair";

const crypto = window.crypto.subtle;

export const DEFAULT_WRAP_PARAMS = DEFAULT_RSA_KEY_CONFIG;

/**
 *
 * @param pubKey instance of CryptoKey or in base64 formate.
 * @param aesKey instance of CryptoKey or in base64 formate.
 * @param wrapParams (optional) if not specified DEFAULT_RSA_KEY_CONFIG is used
 *   as default.
 * @returns Observable of wrapped key in base64 format.
 */
export function wrapEnvelope(
  pubKey: CryptoKey | string,
  aesKey: CryptoKey | string,
  wrapParams:
    | AlgorithmIdentifier
    | RsaOaepParams
    | AesCtrParams
    | AesCbcParams
    | AesCmacParams
    | AesGcmParams
    | AesCfbParams = DEFAULT_WRAP_PARAMS,
): Observable<string> {
  const pub$ = pubKeyToCryptoKey(pubKey);
  const aes$ = aesKeyToCryptoKey(aesKey);

  return combineLatest([pub$, aes$]).pipe(
    switchMap(([pub, aes]) =>
      from(crypto.wrapKey("raw", aes, pub, wrapParams)),
    ),
    map((raw: ArrayBuffer) => arrayBufferToBase64(raw)),
  );
}

export const DEFAULT_UNWRAP_PARAMS = DEFAULT_RSA_KEY_CONFIG;
export const DEFAULT_UNWRAP_KEY_PARAMS = DEFAULT_AES_KEY_CONFIG;

/**
 *
 * @param envelope wrapped aes key in base64 format
 * @param secKey unwrapping key; instance of CryptoKey or in base64 format
 * @param unwrapParams (optional) defaults to DEFAULT_RSA_KEY_CONFIG
 * @param unwrappedKeyParams (optional) defaults to DEFAULT_AES_KEY_CONFIG
 * @returns
 */
export function unwrapEnvelope(
  envelope: string,
  secKey: CryptoKey | string,
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
    | AesKeyAlgorithm = DEFAULT_UNWRAP_KEY_PARAMS,
): Observable<CryptoKey> {
  return secKeyToCryptoKey(secKey).pipe(
    switchMap((sec: CryptoKey) =>
      from(
        crypto.unwrapKey(
          "raw",
          base64ToArrayBuffer(envelope),
          sec,
          unwrapParams,
          unwrappedKeyParams,
          true,
          ["decrypt", "encrypt"],
        ),
      ),
    ),
  );
}
