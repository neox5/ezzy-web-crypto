import {
  arrayBufferToBase64,
  base64ToArrayBuffer,
  stringToArrayBuffer,
} from "arraybuffer-fns";
import { Observable } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { fromPromise } from "../util/from-promise";

const crypto = window.crypto.subtle;

/**
 *
 * @param pass passowrd from which a key will be created
 * @param keyUsages list of keyUsage
 * @returns Observable of CryptoKey with de
 */
export function cryptoKeyFromPassword(
  pass: string,
  keyUsages: KeyUsage[],
): Observable<CryptoKey> {
  return fromPromise(
    crypto.importKey(
      "raw",
      stringToArrayBuffer(pass),
      "PBKDF2",
      false,
      keyUsages,
    ),
  );
}

export function createSaltBase64(): string {
  const salt = window.crypto.getRandomValues(new Uint8Array(16)) as ArrayBuffer;
  return arrayBufferToBase64(salt);
}

export function aesFromPassword(
  pass: string,
  saltBase64?: string,
): Observable<{ aesBase64: string; saltBase64: string }> {
  let salt = base64ToArrayBuffer(createSaltBase64());

  if (saltBase64) {
    salt = base64ToArrayBuffer(saltBase64);
  }

  const derivationConfig = {
    name: "PBKDF2",
    salt,
    iterations: 250000,
    hash: "SHA-256",
  };

  return cryptoKeyFromPassword(pass, ["deriveKey"]).pipe(
    switchMap((key: CryptoKey) =>
      fromPromise(
        crypto.deriveKey(
          derivationConfig,
          key,
          { name: "AES-GCM", length: 256 },
          false,
          ["encrypt", "decrypt"],
        ),
      ),
    ),
    switchMap((aes: CryptoKey) => fromPromise(crypto.exportKey("raw", aes))),
    map((raw: ArrayBuffer) => arrayBufferToBase64(raw)),
    map((aesBase64: string) => ({
      aesBase64,
      saltBase64: arrayBufferToBase64(salt),
    })),
  );
}
