import {
  decryptStringWithPrivateKey,
  encryptStringWithPublicKey,
  generateKeyPair,
} from "ezzy-web-crypto";
import { combineLatest, Observable, of } from "rxjs";
import { catchError, map, switchMap, tap } from "rxjs/operators";

import { ApiService } from "../api/api.service";

import { TestResult } from "../models/test.interface";
import { addName, error, failure, success } from "./test-helper";

export function testGenerateKeyPair(api: ApiService): Observable<TestResult> {
  const testMessage = "This is a test message";

  return generateKeyPair().pipe(
    switchMap((kp: CryptoKeyPair) =>
      combineLatest([
        of(kp),
        encryptStringWithPublicKey(kp.publicKey ?? "", testMessage),
      ])
    ),
    switchMap(([kp, encMessage]) =>
      decryptStringWithPrivateKey(kp.privateKey ?? "", encMessage)
    ),
    map((decMessage) => {
      if (decMessage != testMessage) {
        return failure(
          "Decrypted message is not equal to test message",
          decMessage,
          testMessage
        );
      }
      return success();
    }),
    catchError((err) => error(err)),
    map(addName("TestGenerateKeyPair"))
  );
}
