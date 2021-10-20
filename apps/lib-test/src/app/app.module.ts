import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";

import { AppComponent } from "./app.component";
import { ManagerComponent } from './manager/manager.component';
import { ResultComponent } from './result/result.component';

@NgModule({
  declarations: [AppComponent, ManagerComponent, ResultComponent],
  imports: [BrowserModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
