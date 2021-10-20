import { Component, OnInit } from "@angular/core";
import { from } from "rxjs";
import { switchMap } from "rxjs/operators";
import { ApiService } from "../api/api.service";
import { Test, TestResult } from "../models/test.interface";
import { testAesKeyConversion } from "../tests/test_aes";

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
    from(tests)
      .pipe(switchMap((t: Test) => t(this._apiService)))
      .subscribe((r: TestResult) => (results = [...results, r]));
  }

  get results(): TestResult[] {
    return results;
  }

  private _initializeTests(): void {
    tests = [testAesKeyConversion];
  }
}