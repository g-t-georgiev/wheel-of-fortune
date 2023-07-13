import { fromEvent, map, mergeWith } from './index.js';

const clicks$ = fromEvent(document, 'click').pipe(map(() => 'click'));
const mousemoves$ = fromEvent(document, 'mousemove').pipe(map(() => 'mousemove'));
const dblclicks$ = fromEvent(document, 'dblclick').pipe(map(() => 'dblclick'));

mousemoves$
    .pipe(mergeWith(clicks$, dblclicks$, mousemoves$))
    .subscribe({
        next(x) {
            console.log(x);
        },
        complete() {
            console.log('Completed');
        }
    });