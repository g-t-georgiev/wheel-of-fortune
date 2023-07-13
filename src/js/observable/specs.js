import { interval, mergeMap, map, from, take } from './index.js';

const letters = from([ 'a', 'b', 'c' ]);
const result = letters.pipe(
  mergeMap(x => interval(1000).pipe(take(4), map(i => x + i)))
);

result.subscribe(x => console.log(x));