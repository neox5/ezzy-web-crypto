import {
  aesFromPassword,
  decryptStringWithAes,
  encryptStringWithAes,
} from "ezzy-web-crypto";
import { combineLatest, Observable, of } from "rxjs";
import { catchError, map, switchMap, tap } from "rxjs/operators";
import { ApiService } from "../api/api.service";
import { TestResult } from "../models/test.interface";
import { addName, error, failure, success } from "./test-helper";

// testKeyDerivation tests if the resulting aes key is the same when the salt is
// given in the function parameters.
export function testKeyDerivation(api: ApiService): Observable<TestResult> {
  const password = "HamburgerRießenradHampelmann69420";
  const testMessage = "Ju$t@n()th3rS3cr3tM3ss@g3";
  let salt: ArrayBuffer;

  return aesFromPassword(password).pipe(
    tap((key: { aes: CryptoKey; salt: ArrayBuffer }) => {
      salt = key.salt;
    }),
    switchMap((key: { aes: CryptoKey; salt: ArrayBuffer }) =>
      encryptStringWithAes(key.aes, testMessage)
    ),
    switchMap((encMsgBase64: string) =>
      combineLatest([of(encMsgBase64), aesFromPassword(password, salt)])
    ),
    switchMap(([encMsgBase64, key]) =>
      decryptStringWithAes(key.aes, encMsgBase64)
    ),
    map((msg: string) => {
      if (msg != testMessage) {
        return failure(
          "decrypted message not equal to test message",
          msg,
          testMessage
        );
      }
      return success();
    }),
    catchError((err) => error(err)),
    map(addName("TestKeyDerivation"))
  );
}
