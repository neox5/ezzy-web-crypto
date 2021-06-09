import { arrayBufferToBase64, base64ToArrayBuffer } from "arraybuffer-fns";
import { from, Observable, zip } from "rxjs";
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

export function pubKeyBase64ToCryptoKey(
  pubBase64: string,
  importParams:
    | AlgorithmIdentifier
    | RsaHashedImportParams
    | EcKeyImportParams
    | HmacImportParams
    | DhImportKeyParams
    | AesKeyAlgorithm = { name: "RSA-OAEP", hash: "SHA-256" },
): Observable<CryptoKey> {
  return from(
    crypto.importKey(
      "spki",
      base64ToArrayBuffer(pubBase64),
      importParams,
      true,
      ["wrapKey"],
    ),
  );
}

export function secKeyBase64ToCryptoKey(
  secBase64: string,
  importParams:
    | AlgorithmIdentifier
    | RsaHashedImportParams
    | EcKeyImportParams
    | HmacImportParams
    | DhImportKeyParams
    | AesKeyAlgorithm = { name: "RSA-OAEP", hash: "SHA-256" },
): Observable<CryptoKey> {
  return from(
    crypto.importKey(
      "pkcs8",
      base64ToArrayBuffer(secBase64),
      importParams,
      true,
      ["unwrapKey"],
    ),
  );
}
