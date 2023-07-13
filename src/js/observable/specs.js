import { interval, concatMap, fromEvent, take } from './index.js';

const clicks = fromEvent(document, 'click');
const result = clicks.pipe(
  concatMap(ev => interval(1000).pipe(take(4)))
);
result.subscribe(x => console.log(x));