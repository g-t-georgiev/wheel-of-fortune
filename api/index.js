import { getRandomInteger, shuffleArray } from './utils.js';
export * from './data.js';

const n = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13 ];

let i = n.length;
let combinations = i * (i - 1) / 2;

let pairs = [];

function getDistinctPairs(pairs = []) {
    let random1 = getRandomInteger(0, 10);
    let random2 = getRandomInteger(0, 10);

    if (random1 === random2) getDistinctPairs(pairs);

    distinct = pairs.every(([ num1, num2 ]) => (num1 !== random1 && num1 !== random2) || (num2 !== random1 && num2 !== random2));

    if (pairs.length === 0 || distinct) {
        pairs.push([ random1, random2 ]);
        return pairs;
    } else {
        getDistinctPairs(pairs);
    }
}
