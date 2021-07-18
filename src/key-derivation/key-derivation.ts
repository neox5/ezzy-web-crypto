// REFERENCE: https://bradyjoslin.com/blog/encryption-webcrypto/

import {
  arrayBufferToBase64,
  base64ToArrayBuffer,
  stringToArrayBuffer,
} from "arraybuffer-fns";
import { Observable } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { aesCryptoKeyToBase64 } from "../aes";
import { createSalt } from "../salt/salt";
import { fromPromise } from "../util/from-promise";

const crypto = window.crypto.subtle;

// *****************************************************************************
// KEY DERIVATION
// *****************************************************************************
/**
 * (internal) use with caution
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

/**
 *
 * @param password as string
 * @param salt (optional) as ArrayBuffer or base64 encoded string
 * @returns observable of object containing AES CryptoKey and salt as
 * ArrayBuffer
 */
export function aesFromPassword(
  password: string,
  salt?: ArrayBuffer | string,
): Observable<{ aes: CryptoKey; salt: ArrayBuffer }> {
  let freshSalt = createSalt(); // create fresh salt

  if (salt) {
    if (typeof salt === "string") {
      salt = base64ToArrayBuffer(salt);
    }
    freshSalt = salt; // if salt parameter set use it instead of freshSalt
  }
  
  const derivationConfig = {
    name: "PBKDF2",
    salt: freshSalt,
    iterations: 250000,
    hash: "SHA-256",
  };

  return cryptoKeyFromPassword(password, ["deriveKey"]).pipe(
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
    map((aes: CryptoKey) => ({
      aes,
      salt: freshSalt,
    })),
  );
}

// *****************************************************************************
// KEY DERIVATION AS BASE64
// *****************************************************************************
/**
 *
 * @param password as string
 * @param salt (optional) as ArrayBuffer or base64 encoded string
 * @returns observable of object container AES and salt as base64 encoded
 * strings
 */
export function aesFromPasswordBase64(
  password: string,
  salt?: ArrayBuffer | string,
): Observable<{ aesBase64: string; saltBase64: string }> {
  return aesFromPassword(password, salt).pipe(
    switchMap((data: { aes: CryptoKey; salt: ArrayBuffer }) =>
      aesCryptoKeyToBase64(data.aes).pipe(
        map((aesBase64: string) => ({
          aesBase64,
          saltBase64: arrayBufferToBase64(data.salt),
        })),
      ),
    ),
    map((data: { aesBase64: string; saltBase64: string }) => data), // Workaround for SwitchMap (rxjs v6.6.7) issue with TypeScript; fixed with rxjs v7.X.X
  );
}
