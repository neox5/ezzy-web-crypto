import { Component } from "@angular/core";

@Component({
  selector: "test-root",
  template: `
    <div class="container">
      <h1>ezzy-web-crypto test</h1>
      <test-manager></test-manager>
    </div>
  `,
  styleUrls: ["./app.component.scss"],
})
export class AppComponent {}
