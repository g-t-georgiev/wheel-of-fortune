import { interval, scan, map, startWith, take } from './index.js';

const firstTwoFibs = [0, 1];
// An endless stream of Fibonacci numbers.
const fibonacci$ = interval(1000).pipe(
  // Scan to get the fibonacci numbers (after 0, 1)
  scan(([a, b]) => [b, a + b], firstTwoFibs),
  // Get the second number in the tuple, it's the one you calculated
  map(([, n]) => n),
  // Start with our first two digits :)
  startWith(...firstTwoFibs),
  take(16)
);
 
fibonacci$.subscribe(console.log); 
// Output: 0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610