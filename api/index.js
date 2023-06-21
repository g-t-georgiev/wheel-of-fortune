import {
    getDistinctListItemPairs, 
} from './utils.js';
export * from './data.js';

const sectors = Array.from({ length: 14 }, (_, i) => i);
let winningSectorsPairs = getDistinctListItemPairs(sectors);

console.table(winningSectorsPairs);