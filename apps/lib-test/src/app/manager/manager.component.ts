import { Component, OnInit } from "@angular/core";
import { ApiService } from "../api/api.service";
import { Test, TestResult } from "../models/test.interface";

import {
  testAesApi,
  testAesEncryption,
  testAesKeyConversion,
} from "../tests/test-aes";
import {
  testApiPublicKey,
  testEncryptWithApiPublicKey,
  testEncryptWithLibPublicKey,
} from "../tests/test-asymmetric-encryption";
import { testEnvelopeWithApi } from "../tests/test-envelope";
import { testKeyDerivation } from "../tests/test-key-derivation";
import { testGenerateKeyPair } from "../tests/test-key-pair";

let tests: Test[] = [];
let results: TestResult[] = [];

@Component({
  selector: "test-manager",
  template: `
    <button
      *ngIf="results.length == 0"
      class="btn btn-start"
      (click)="onClickStart()"
    >
      Start
    </button>
    <test-result [results]="results"></test-result>
  `,
  styleUrls: ["./manager.component.scss"],
})
export class ManagerComponent implements OnInit {
  constructor(private _apiService: ApiService) {
    this._initializeTests();
  }

  ngOnInit(): void {
    this.onClickStart();
  }

  onClickStart(): void {
    tests.forEach((t) =>
      t(this._apiService).subscribe(
        (r: TestResult) => (results = [...results, r])
      )
    );
  }

  get results(): TestResult[] {
    return results;
  }

  private _initializeTests(): void {
    tests = [
      testAesKeyConversion,
      testAesEncryption,
      testAesApi,
      testGenerateKeyPair,
      testApiPublicKey,
      testEncryptWithApiPublicKey,
      testEncryptWithLibPublicKey,
      testEnvelopeWithApi,
      testKeyDerivation,
    ];
  }
}
