import { Observable, Subscriber } from "rxjs";

// Workaround for being compatible with angular 12 using rxjs v6.6.7 instaed of v7.X.X

export function fromPromise<T>(promise: PromiseLike<T>): Observable<T> {
  return new Observable((subscriber: Subscriber<T>) => {
    promise
      .then(
        (value) => {
          if (!subscriber.closed) {
            subscriber.next(value);
            subscriber.complete();
          }
        },
        (err: any) => subscriber.error(err),
      )
      .then(null, (err) => {
        throw err;
      });
  });
}
