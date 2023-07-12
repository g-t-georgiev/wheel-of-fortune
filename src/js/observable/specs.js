import { merge, interval, take, tap, map } from './index.js';

const a = interval(500).pipe(map((v) => 'a' + v), take(3));
const b = interval(1000).pipe(map((v) => 'b' + v), take(3));
merge(a, b).subscribe((value) => console.log(value));