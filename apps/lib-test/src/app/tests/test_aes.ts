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

export function testAesKeyConversion(api: ApiService): Observable<TestResult> {
  const testMessage = "Testing ezzy-web-crypto $!@";
  const aes$ = generateAesKey();

  return combineLatest([aes$]).pipe(
    switchMap(([aes]) =>
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
        return {
          isOk: false,
          errorMessage:
            "Key conversion invalid: got: " +
            decMessage +
            " want: " +
            testMessage,
        };
      }
      return {
        isOk: true,
        errorMessage: "",
      };
    }),
    catchError((err) =>
      of({
        isOk: false,
        errorMessage: err,
      })
    ),
    map(_addName("TestAesKeyConversion"))
  );
}



function _addName(
  name: string
): (obj: { isOk: boolean; errorMessage: string }) => TestResult {
  return (obj: { isOk: boolean; errorMessage: string }) => ({
    name,
    isOk: obj.isOk,
    errorMessage: obj.errorMessage,
  });
}
