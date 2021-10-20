import { ApiService } from "../api/api.service";
import { Observable } from "rxjs";

export type Test = (api: ApiService) => Observable<TestResult>;

export interface TestResult {
  name: string;
  status?: "PENDING" | "RUNNING" | "DONE";
  isOk: boolean;
  errorMessage: string;
}
