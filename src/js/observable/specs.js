import { concat, interval, range, take } from './index.js';

const timer1 = interval(1000).pipe(take(6));
const timer2 = interval(1000).pipe(take(6));
const sequence = range(1, 5);
const result = concat(sequence);

const subscription = result.subscribe({
    next: x => console.log(x),
    complete: () => {
        console.log('Complete handler');
    }
});

let timerId = globalThis.setTimeout(() => {
    globalThis.clearTimeout(timerId);
    subscription.unsubscribe();
}, 3000);