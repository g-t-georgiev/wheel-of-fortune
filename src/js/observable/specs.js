import { Observable, concat, interval, range, take } from './index.js';

const observable1 = new Observable((observer) => {
    observer.next('Observable 1 - Value 1');
    observer.next('Observable 1 - Value 2');
    observer.complete();
});

const observable2 = new Observable((observer) => {
    observer.next('Observable 2 - Value 1');
    observer.next('Observable 2 - Value 2');
    observer.complete();
});

const timer1 = interval(1000).pipe(take(10));
const timer2 = interval(2000).pipe(take(6));
const timer3 = interval(500).pipe(take(10));
const sequence = range(1, 10);

const result = concat(observable1, timer1, timer2, timer3, sequence, timer1, observable2);
result.subscribe({
    next: x => console.log(x),
    complete: () => console.log('...and it is done!')
});