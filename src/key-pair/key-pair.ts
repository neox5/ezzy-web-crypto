import { arrayBufferToBase64, base64ToArrayBuffer } from "arraybuffer-fns";
import { from, Observable, of, zip } from "rxjs";
import { map, switchMap } from "rxjs/operators";

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
  return from(
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
  return from(crypto.exportKey("pkcs8", key));
}

export function exportPublicKeyAsSpki(key: CryptoKey): Observable<ArrayBuffer> {
  return from(crypto.exportKey("spki", key));
}

/**
 * 
 * @param pubKey instance of CryptoKey or in base64 format
 * @param importParams (optional) defaults to RSA-OAEP with SHA-256
 * @returns Observable of public key as CryptoKey
 */
export function pubKeyToCryptoKey(
  pubKey: CryptoKey | string,
  importParams:
    | AlgorithmIdentifier
    | RsaHashedImportParams
    | EcKeyImportParams
    | HmacImportParams
    | DhImportKeyParams
    | AesKeyAlgorithm = { name: "RSA-OAEP", hash: "SHA-256" },
): Observable<CryptoKey> {
  if (pubKey instanceof CryptoKey) {
    return of(pubKey);
  }

  return from(
    crypto.importKey("spki", base64ToArrayBuffer(pubKey), importParams, true, [
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
    return of(secKey)
  }

  return from(
    crypto.importKey(
      "pkcs8",
      base64ToArrayBuffer(secKey),
      importParams,
      true,
      ["unwrapKey"],
    ),
  );
}
