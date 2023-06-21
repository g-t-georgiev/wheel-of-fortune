/**
 * Returns a random number between the interval of a min and max value.
 * The min and max tresholds are inclusive.
 * @param {number} min 
 * @param {number} max 
 * @returns 
 */
export function getRandomInteger(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min) // min and max inclusive
}

/**
 * Takes an array and applies the Fisher-Yates shuffle algorithm 
 * returning a shuffled array. The original array is not mutated.
 * @param {Array<any>} array 
 * @returns 
 */
export function shuffleArray(array) {
    array = [ ...array ];
    let i = array.length - 1;
    let j;

    while (i >= 0) {
        j = Math.floor(Math.random() * (i + 1));
        [ array[i], array[j] ] = [ array[j], array[i] ];
        i--;
    }

    return array;
}

/**
 * Returns a fixed length set of distinct item pairs from a list. 
 * The length of the set is calculated by the formula `n(n-1)/2`,
 * where `n` is the length of the list argument.
 * @param {any[]} list 
 * @returns {any[][]}
 */
export function getDistinctListItemPairs(list) {
    let pairs = Array.from({ length: list.length * (list.length - 1) / 2 });
    let i = 0;
    let j = 0;
    let k = j + 1;

    while (j < list.length - 1) {
        pairs[i++] = [ list[j], list[k++] ];
        // pairs.push([ list[j], list[k++] ]);
        j = k % list.length ? j : j + 1;
        k =  k % list.length ? k : j + 1;
    }

    return pairs;
}