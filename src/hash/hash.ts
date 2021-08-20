import { arrayBufferToBase64, stringToArrayBuffer } from "arraybuffer-fns";
import { Observable, of } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { fromPromise } from "../util/from-promise";

const crypto = window.crypto.subtle;

export type HashAlgorithm = "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512";

// *****************************************************************************
// HASHING
// *****************************************************************************
/**
 *
 * @param algorithm defines the hashing algorithm, like SHA-1, SHA-256, SHA-384
 * or SHA-512
 * @param data as ArrayBuffer
 * @returns observable of hash as ArrayBuffer
 */
export function generateSHA(
  algorithm: HashAlgorithm,
  data: ArrayBuffer,
): Observable<ArrayBuffer> {
  return fromPromise(crypto.digest(algorithm, data));
}

/**
 *
 * @param algorithm defines the hashing algorithm, like SHA-1, SHA-256, SHA-384
 * or SHA-512
 * @param str the string to generate the hash from
 * @returns observable of hash as base64 encoded string
 */
export function generateSHAFromString(
  algorithm: HashAlgorithm,
  str: string,
): Observable<string> {
  return of(stringToArrayBuffer(str)).pipe(
    switchMap((data: ArrayBuffer) => generateSHA(algorithm, data)),
    map((hash: ArrayBuffer) => arrayBufferToBase64(hash)),
  );
}

// *****************************************************************************
// SHA-1
// *****************************************************************************
/**
 *
 * @param data as ArrayBuffer
 * @returns observable of hash as ArrayBuffer
 */
export function generateSHA1(data: ArrayBuffer): Observable<ArrayBuffer> {
  return generateSHA("SHA-1", data);
}

/**
 *
 * @param str the string to generate the hash from
 * @returns observable of hash as base64 encoded string
 */
export function generateSHA1FromString(str: string): Observable<string> {
  return generateSHAFromString("SHA-1", str);
}

// *****************************************************************************
// SHA-256
// *****************************************************************************
/**
 *
 * @param data as ArrayBuffer
 * @returns observable of hash as ArrayBuffer
 */
export function generateSHA256(data: ArrayBuffer): Observable<ArrayBuffer> {
  return generateSHA("SHA-256", data);
}

/**
 *
 * @param str the string to generate the hash from
 * @returns observable of hash as base64 encoded string
 */
export function generateSHA256FromString(str: string): Observable<string> {
  return generateSHAFromString("SHA-256", str);
}

// *****************************************************************************
// SHA-384
// *****************************************************************************
/**
 *
 * @param data as ArrayBuffer
 * @returns observable of hash as ArrayBuffer
 */
export function generateSHA384(data: ArrayBuffer): Observable<ArrayBuffer> {
  return generateSHA("SHA-384", data);
}

/**
 *
 * @param str the string to generate the hash from
 * @returns observable of hash as base64 encoded string
 */
export function generateSHA384FromString(str: string): Observable<string> {
  return generateSHAFromString("SHA-384", str);
}

// *****************************************************************************
// SHA-512
// *****************************************************************************
/**
 *
 * @param data as ArrayBuffer
 * @returns observable of hash as ArrayBuffer
 */
export function generateSHA512(data: ArrayBuffer): Observable<ArrayBuffer> {
  return generateSHA("SHA-512", data);
}

/**
 *
 * @param str the string to generate hash from
 * @returns observable of hash as base64 encoded string
 */
export function generateSHA512FromString(str: string): Observable<string> {
  return generateSHAFromString("SHA-512", str);
}
