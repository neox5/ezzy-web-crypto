import { Component, Input, OnInit } from "@angular/core";
import { TestResult } from "../models/test.interface";

@Component({
  selector: "test-result",
  template: `
    <ng-container *ngFor="let r of results">
      <div class="result" [ngClass]="{ ok: r.isOk, nok: !r.isOk }">
        <p><span class="bold">Testname:</span> {{ r.name }}</p>
        <!-- <p>Status: {{ r.status }}</p> -->
        <p><span class="bold">isOk:</span> {{ r.isOk }}</p>
        <p *ngIf="r.errorMessage">Error: {{ r.errorMessage }}</p>
      </div>
    </ng-container>
  `,
  styleUrls: ["./result.component.scss"],
})
export class ResultComponent implements OnInit {
  @Input() results!: TestResult[];

  constructor() {}

  ngOnInit(): void {}
}
