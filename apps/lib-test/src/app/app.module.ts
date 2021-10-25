import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { HttpClientModule } from "@angular/common/http";

import { AppComponent } from "./app.component";
import { ManagerComponent } from './manager/manager.component';
import { ResultComponent } from './result/result.component';

@NgModule({
  declarations: [AppComponent, ManagerComponent, ResultComponent],
  imports: [BrowserModule, HttpClientModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
