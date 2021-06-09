import { arrayBufferToBase64 } from "arraybuffer-fns";
import { from, Observable } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { aesKeyBase64ToCryptoKey } from "../aes/aes";
import { pubKeyBase64ToCryptoKey } from "../key-pair/key-pair";

const crypto = window.crypto.subtle;

export class EnvelopeWrapper {
  private _pub: CryptoKey;

  constructor(pub: CryptoKey | string) {
    if (pub instanceof CryptoKey) {
      this._pub = pub;
      return;
    }
    pubKeyBase64ToCryptoKey(pub).subscribe((k) => {
      this._pub = k;
    });
  }

  wrap(aesBase64: string): Observable<string> {
    const wrapParams = { name: "RSA-OAEP", hash: { name: "SHA-256" } };

    const aes$ = aesKeyBase64ToCryptoKey(aesBase64);

    return aes$.pipe(
      switchMap((k: CryptoKey) =>
        from(crypto.wrapKey("raw", k, this._pub, wrapParams)),
      ),
      map((raw: ArrayBuffer) => arrayBufferToBase64(raw)),
    );
  }
}
