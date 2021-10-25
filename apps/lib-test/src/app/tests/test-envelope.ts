import {
  encryptStringWithAes,
  generateAesKey,
  wrapAesInBase64Envelope,
} from "ezzy-web-crypto";
import { combineLatest, Observable, of } from "rxjs";
import { catchError, map, switchMap } from "rxjs/operators";
import { ApiService } from "../api/api.service";
import { TestResult } from "../models/test.interface";
import { addName, error, failure, success } from "./test-helper";

export function testEnvelopeWithApi(api: ApiService): Observable<TestResult> {
  const testMessage = "This message get's encrypted with an 3nvelope";

  return combineLatest([generateAesKey(), api.getPublicKey()]).pipe(
    switchMap(([aes, pub]) =>
      combineLatest([
        wrapAesInBase64Envelope(pub, aes),
        encryptStringWithAes(aes, testMessage),
      ])
    ),
    switchMap(([envelopeBase64, encMsgBase64]) =>
      api.openEnvelope(envelopeBase64, encMsgBase64)
    ),
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
    map(addName("TestEnvelopeWithApi"))
  );
}
