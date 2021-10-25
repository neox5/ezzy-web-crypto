import {
  arrayBufferToBase64,
  decryptStringWithPrivateKey,
  encryptStringWithPublicKey,
  exportPublicKeyAsSpki,
  generateKeyPair,
  publicKeyToCryptoKey,
} from "ezzy-web-crypto";
import { combineLatest, Observable, of } from "rxjs";
import { catchError, map, switchMap, tap } from "rxjs/operators";
import { ApiService } from "../api/api.service";
import { TestResult } from "../models/test.interface";
import { addName, error, failure, success } from "./test-helper";

// testApiPublicKey tries to import the api's public key.
export function testApiPublicKey(api: ApiService): Observable<TestResult> {
  return api.getPublicKey().pipe(
    switchMap((res: { public_key: string }) =>
      publicKeyToCryptoKey(res.public_key)
    ),
    map(() => success()),
    catchError((err) => error(err)),
    map(addName("TestApiPublicKey"))
  );
}

// testEncrypWithApiPublicKey tests if api can decrypt a publickey-encrypted
// message
export function testEncryptWithApiPublicKey(
  api: ApiService
): Observable<TestResult> {
  const testMessage = "/ery s3cr³t mess@ge to @pi $er/ice!";
  return api.getPublicKey().pipe(
    switchMap((res: { public_key: string }) =>
      encryptStringWithPublicKey(res.public_key, testMessage)
    ),
    switchMap((encMessage: string) => api.decryptMessageWithRsa(encMessage)),
    map((res: { message: string }) => res.message),
    map((message: string) => {
      if (message != testMessage) {
        return failure(
          "encrypted message not equal to testMessage",
          message,
          testMessage
        );
      }
      return success();
    }),
    catchError((err) => error(err)),
    map(addName("TestEncryptWithApiPublicKey"))
  );
}

export function testEncryptWithLibPublicKey(
  api: ApiService
): Observable<TestResult> {
  const testMessage = "/ery s3cr³t mess@ge fr()m @pi $er/ice!";

  return generateKeyPair().pipe(
    switchMap((kp: CryptoKeyPair) =>
      combineLatest([
        of(kp),
        exportPublicKeyAsSpki(kp.publicKey as CryptoKey).pipe(
          map((buf: ArrayBuffer) => arrayBufferToBase64(buf))
        ),
      ])
    ),
    switchMap(([kp, pubBase64]) =>
      combineLatest([of(kp), api.encryptMessageWithRsa(pubBase64, testMessage)])
    ),
    switchMap(([kp, encMessage]) =>
      decryptStringWithPrivateKey(kp.privateKey ?? "", encMessage)
    ),
    map((message: string) => {
      if (message != testMessage) {
        return failure(
          "decrypted message not equal to testmessage",
          message,
          testMessage
        );
      }
      return success();
    }),
    catchError((err) => error(err)),
    map(addName("TestEncryptWithLibPublicKey"))
  );
}
