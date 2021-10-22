import { Observable, of } from "rxjs";
import { TestResult } from "../models/test.interface";

export function success(): { isOk: boolean; errorMessage: string } {
  return { isOk: true, errorMessage: "" };
}

export function failure(
  msg: string,
  got: string,
  want: string
): { isOk: boolean; errorMessage: string } {
  return {
    isOk: false,
    errorMessage: msg + ":\ngot: " + got + "\nwant: " + want,
  };
}

export function error(
  err: any
): Observable<{ isOk: boolean; errorMessage: string }> {
  return of({ isOk: false, errorMessage: err });
}

export function addName(
  name: string
): (obj: { isOk: boolean; errorMessage: string }) => TestResult {
  return (obj: { isOk: boolean; errorMessage: string }) => ({
    name,
    isOk: obj.isOk,
    errorMessage: obj.errorMessage,
  });
}
