import { combineLatest, Observable, of } from "rxjs";

import { ApiService } from "../api/api.service";
import { TestResult } from "../models/test.interface";

import {
  aesCryptoKeyToBase64,
  aesKeyToCryptoKey,
  decryptStringWithAes,
  encryptStringWithAes,
  generateAesKey,
} from "ezzy-web-crypto";
import { catchError, map, switchMap } from "rxjs/operators";
import { addName, error, failure, success } from "./test-helper";

export function testAesKeyConversion(api: ApiService): Observable<TestResult> {
  const testMessage = "Testing ezzy-web-crypto $!@";
  const aes$ = generateAesKey();

  return aes$.pipe(
    switchMap((aes) =>
      combineLatest([
        aesCryptoKeyToBase64(aes).pipe(
          switchMap((aesBase64) => aesKeyToCryptoKey(aesBase64))
        ),
        encryptStringWithAes(aes, testMessage),
      ])
    ),
    switchMap(([newAes, encMessage]) =>
      decryptStringWithAes(newAes, encMessage)
    ),
    map((decMessage) => {
      if (decMessage != testMessage) {
        return failure("Key conversion invalid", decMessage, testMessage);
      }
      return success();
    }),
    catchError((err) => error(err)),
    map(addName("TestAesKeyConversion"))
  );
}

export function testAesEncryption(api: ApiService): Observable<TestResult> {
  const testMessage = "Testing ezzy-web-crypto $!@";
  const aes$ = generateAesKey();

  return aes$.pipe(
    switchMap((aes) =>
      combineLatest([of(aes), encryptStringWithAes(aes, testMessage)])
    ),
    switchMap(([aes, encMessage]) => decryptStringWithAes(aes, encMessage)),
    map((decMessage) => {
      if (decMessage != testMessage) {
        return failure(
          "Decrypted message not equal to testMessage",
          decMessage,
          testMessage
        );
      }
      return success();
    }),
    catchError((err) => error(err)),
    map(addName("TestAesEncryption"))
  );
}

export function testAesApi(api: ApiService): Observable<TestResult> {
  const aes$ = generateAesKey();
  const testMessage = "this is the secret message äöü@!ß?³á";

  return aes$.pipe(
    switchMap((aes: CryptoKey) =>
      combineLatest([
        aesCryptoKeyToBase64(aes),
        encryptStringWithAes(aes, testMessage),
      ])
    ),
    switchMap(([aesBase64, encMessage]) =>
      api.decryptMessageWithAes(encMessage, aesBase64)
    ),
    map((res) => {
      if (res.message != testMessage) {
        console.log("its a failure:",  res);
        return failure(
          "Decrypted message not equal to testMessage",
          res.message,
          testMessage
        );
      }
      return success();
    }),
    catchError((err) => error(err)),
    map(addName("TestAesApi"))
  );
}
