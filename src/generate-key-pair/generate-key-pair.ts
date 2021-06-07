import { arrayBufferToBase64 } from "arraybuffer-fns";
import { from, Observable, zip } from "rxjs";
import { map, switchMap } from "rxjs/operators";

import { DEFAULT_RSA_KEY_CONFIG } from "./params";

export interface CryptoKeyPairBase64 {
  private: string;
  public: string;
}

const crypto = window.crypto.subtle;

export function generateKeyPair(
  params: RsaHashedKeyGenParams | EcKeyGenParams | DhKeyGenParams = DEFAULT_RSA_KEY_CONFIG,
  extractable: boolean = true,
): Observable<CryptoKeyPair> {
  return from(crypto.generateKey(params, extractable, ["wrapKey", "unwrapKey"]));
}

export function generateKeyPairBase64(
  params: RsaHashedKeyGenParams | EcKeyGenParams | DhKeyGenParams = DEFAULT_RSA_KEY_CONFIG,
  extractable: boolean = true,
): Observable<CryptoKeyPairBase64> {
  return generateKeyPair(params, extractable).pipe(
    switchMap((kp: CryptoKeyPair) => zip(exportPrivateKeyAsPkcs8(kp.privateKey), exportPublicKeyAsSpki(kp.publicKey))),
    map(([pkcs8, spki]) => ({
      private: arrayBufferToBase64(pkcs8),
      public: arrayBufferToBase64(spki),
    })),
  );
}

// Utility functions
function exportPrivateKeyAsPkcs8(key: CryptoKey): Observable<ArrayBuffer> {
  return from(crypto.exportKey("pkcs8", key));
}

function exportPublicKeyAsSpki(key: CryptoKey): Observable<ArrayBuffer> {
  return from(crypto.exportKey("spki", key));
}
