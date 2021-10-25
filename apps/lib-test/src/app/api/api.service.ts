import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

const API = "http://localhost:3000";

@Injectable({
  providedIn: "root",
})
export class ApiService {
  constructor(private _httpClient: HttpClient) {}

  public decryptMessageWithAes(
    encMessage: string,
    aesBase64: string
  ): Observable<{ message: string }> {
    return this._httpClient.post<{ message: string }>(`${API}/aes/dec`, {
      enc_message: encMessage,
      aes: aesBase64,
    });
  }

  public generateKeyPair(): Observable<void> {
    return this._httpClient.post<void>(`${API}/rsa`, {});
  }

  public getPublicKey(): Observable<{ public_key: string }> {
    return this._httpClient.get<{ public_key: string }>(`${API}/rsa/pub`);
  }

  public decryptMessageWithRsa(
    encMessage: string
  ): Observable<{ message: string }> {
    return this._httpClient.post<{ message: string }>(`${API}/rsa/dec`, {
      enc_message: encMessage,
    });
  }

  public encryptMessageWithRsa(
    public_key: string,
    message: string
  ): Observable<string> {
    return this._httpClient
      .post<{ enc_message: string }>(`${API}/rsa/enc`, {
        public_key,
        message,
      })
      .pipe(map((res: { enc_message: string }) => res.enc_message));
  }
}
