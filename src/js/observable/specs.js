import { interval, take, map, mergeAll } from './index.js';

let id = 0;
const clicks = fromEvent(document, 'click');
const higherOrder = clicks.pipe(
    map(() => id++),
    map((id) => interval(1000).pipe(take(10), map(x => `Timer#${id} - ${x}`)))
);
const firstOrder = higherOrder.pipe(mergeAll(2));

firstOrder.subscribe(x => console.log(x));