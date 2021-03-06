import { arrayBufferToBase64, base64ToArrayBuffer } from "arraybuffer-fns";
import { Observable, of, zip } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { fromPromise } from "../util/from-promise";
import { Base64 } from "../model/base64";

const crypto = window.crypto.subtle;

// *****************************************************************************
// INTERFACE
// *****************************************************************************
export interface CryptoKeyPairBase64 {
  private: Base64;
  public: Base64;
}

// *****************************************************************************
// KEY GENERATION
// *****************************************************************************
export const DEFAULT_RSA_KEY_CONFIG = {
  name: "RSA-OAEP",
  modulusLength: 4096,
  publicExponent: new Uint8Array([1, 0, 1]),
  hash: { name: "SHA-256" },
};

export function generateKeyPair(
  params: RsaHashedKeyGenParams | EcKeyGenParams = DEFAULT_RSA_KEY_CONFIG,
  extractable = true
): Observable<CryptoKeyPair> {
  return fromPromise(
    crypto.generateKey(params, extractable, [
      "wrapKey",
      "unwrapKey",
      "encrypt",
      "decrypt",
    ])
  );
}

export function generateKeyPairBase64(
  params: RsaHashedKeyGenParams | EcKeyGenParams = DEFAULT_RSA_KEY_CONFIG,
  extractable = true
): Observable<CryptoKeyPairBase64> {
  return generateKeyPair(params, extractable).pipe(
    switchMap((kp: CryptoKeyPair) =>
      zip(
        exportPrivateKeyAsPkcs8(kp.privateKey),
        exportPublicKeyAsSpki(kp.publicKey)
      )
    ),
    map(([pkcs8, spki]) => ({
      private: arrayBufferToBase64(pkcs8),
      public: arrayBufferToBase64(spki),
    }))
  );
}

// *****************************************************************************
// KEY EXPORT
// *****************************************************************************
export function exportPrivateKeyAsPkcs8(
  key: CryptoKey
): Observable<ArrayBuffer> {
  return fromPromise(crypto.exportKey("pkcs8", key));
}

export function exportPublicKeyAsSpki(key: CryptoKey): Observable<ArrayBuffer> {
  return fromPromise(crypto.exportKey("spki", key));
}

// *****************************************************************************
// KEY CONVERSION
// *****************************************************************************
/**
 *
 * @param publicKey instance of CryptoKey or in base64 format
 * @param importParams (optional) defaults to RSA-OAEP with SHA-256
 * @returns Observable of public key as CryptoKey
 */
export function publicKeyToCryptoKey(
  publicKey: CryptoKey | Base64,
  importParams:
    | AlgorithmIdentifier
    | RsaHashedImportParams
    | EcKeyImportParams
    | HmacImportParams
    | AesKeyAlgorithm = { name: "RSA-OAEP", hash: "SHA-256" }
): Observable<CryptoKey> {
  if (publicKey instanceof CryptoKey) {
    return of(publicKey);
  }

  return fromPromise(
    crypto.importKey(
      "spki",
      base64ToArrayBuffer(publicKey),
      importParams,
      true,
      ["wrapKey", "encrypt"]
    )
  );
}

/**
 *
 * @param privateKey instance of CryptoKey or in base64 format
 * @param importParams (optional) defaults to RSA-OAEP with SHA-256
 * @returns Observable of secret/private key as CryptoKey
 */
export function privateKeyToCryptoKey(
  privateKey: CryptoKey | Base64,
  importParams:
    | AlgorithmIdentifier
    | RsaHashedImportParams
    | EcKeyImportParams
    | HmacImportParams
    | AesKeyAlgorithm = { name: "RSA-OAEP", hash: "SHA-256" }
): Observable<CryptoKey> {
  if (privateKey instanceof CryptoKey) {
    return of(privateKey);
  }

  return fromPromise(
    crypto.importKey(
      "pkcs8",
      base64ToArrayBuffer(privateKey),
      importParams,
      true,
      ["unwrapKey", "decrypt"]
    )
  );
}
