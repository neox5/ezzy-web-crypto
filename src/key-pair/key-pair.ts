import { arrayBufferToBase64, base64ToArrayBuffer } from "arraybuffer-fns";
import { Observable, of, zip } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { fromPromise } from "../util/from-promise";

export const DEFAULT_RSA_KEY_CONFIG = {
  name: "RSA-OAEP",
  modulusLength: 4096,
  publicExponent: new Uint8Array([1, 0, 1]),
  hash: { name: "SHA-256" },
};

export interface CryptoKeyPairBase64 {
  private: string;
  public: string;
}

const crypto = window.crypto.subtle;

export function generateKeyPair(
  params:
    | RsaHashedKeyGenParams
    | EcKeyGenParams
    | DhKeyGenParams = DEFAULT_RSA_KEY_CONFIG,
  extractable: boolean = true,
): Observable<CryptoKeyPair> {
  return fromPromise(
    crypto.generateKey(params, extractable, ["wrapKey", "unwrapKey"]),
  );
}

export function generateKeyPairBase64(
  params:
    | RsaHashedKeyGenParams
    | EcKeyGenParams
    | DhKeyGenParams = DEFAULT_RSA_KEY_CONFIG,
  extractable: boolean = true,
): Observable<CryptoKeyPairBase64> {
  return generateKeyPair(params, extractable).pipe(
    switchMap((kp: CryptoKeyPair) =>
      zip(
        exportPrivateKeyAsPkcs8(kp.privateKey),
        exportPublicKeyAsSpki(kp.publicKey),
      ),
    ),
    map(([pkcs8, spki]) => ({
      private: arrayBufferToBase64(pkcs8),
      public: arrayBufferToBase64(spki),
    })),
  );
}

// Utility functions
export function exportPrivateKeyAsPkcs8(
  key: CryptoKey,
): Observable<ArrayBuffer> {
  return fromPromise(crypto.exportKey("pkcs8", key));
}

export function exportPublicKeyAsSpki(key: CryptoKey): Observable<ArrayBuffer> {
  return fromPromise(crypto.exportKey("spki", key));
}

/**
 *
 * @param pubkey instance of CryptoKey or in base64 format
 * @param importParams (optional) defaults to RSA-OAEP with SHA-256
 * @returns Observable of public key as CryptoKey
 */
export function pubkeyToCryptoKey(
  pubkey: CryptoKey | string,
  importParams:
    | AlgorithmIdentifier
    | RsaHashedImportParams
    | EcKeyImportParams
    | HmacImportParams
    | DhImportKeyParams
    | AesKeyAlgorithm = { name: "RSA-OAEP", hash: "SHA-256" },
): Observable<CryptoKey> {
  if (pubkey instanceof CryptoKey) {
    return of(pubkey);
  }

  return fromPromise(
    crypto.importKey("spki", base64ToArrayBuffer(pubkey), importParams, true, [
      "wrapKey",
    ]),
  );
}

/**
 *
 * @param secKey instance of CryptoKey or in base64 format
 * @param importParams (optional) defaults to RSA-OAEP with SHA-256
 * @returns Observable of secret/private key as CryptoKey
 */
export function secKeyToCryptoKey(
  secKey: CryptoKey | string,
  importParams:
    | AlgorithmIdentifier
    | RsaHashedImportParams
    | EcKeyImportParams
    | HmacImportParams
    | DhImportKeyParams
    | AesKeyAlgorithm = { name: "RSA-OAEP", hash: "SHA-256" },
): Observable<CryptoKey> {
  if (secKey instanceof CryptoKey) {
    return of(secKey);
  }

  return fromPromise(
    crypto.importKey("pkcs8", base64ToArrayBuffer(secKey), importParams, true, [
      "unwrapKey",
    ]),
  );
}
