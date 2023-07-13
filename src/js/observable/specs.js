import { interval, take, map, merge } from './index.js';

const timer1 = interval(1000).pipe(take(10), map(v => `A - ${v}`));
const timer2 = interval(2000).pipe(take(6), map(v => `B - ${v}`));
const timer3 = interval(500).pipe(take(10), map(v => `C - ${v}`));
 
const concurrent = 2; // the argument
const merged = merge(timer1, timer2, timer3, concurrent);
merged.subscribe({
    next(x) {
        console.log(x);
    },
    complete() {
        console.log('Completed');
    }
});