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
 * Calculates a factorial of a natural number `num`. 
 * If `num = 0` `1` is returned, and if `num < 0`, `-1` 
 * is returned as indication for invalid input.
 * @param {number} num 
 * @returns {number}
 */
function factorial(num) {
    if (num === 0) return 1;
    if (num < 0) return -1;

    return num * factorial(num - 1);
}

/**
 * Counts the distinct combinations of a subset of `r` 
 * from total of `n` elements.
 * @param {number} n 
 * @param {number} r 
 * @returns 
 */
function combinations(n, r) {
    return factorial(n) / (factorial(n - r) * factorial(r)) 
}

/**
 * Counts the distinct permutations of a subset of `r` 
 * from total of `n` elements.
 * @param {number} n 
 * @param {number} r 
 * @param {boolean} o 
 * @returns 
 */
function permutations(n, r) {
    return factorial(n) / (factorial(n - r));
}

/**
 * Returns a group of fixed length distinct 
 * subsets of items from a given collection.
 * @param {any[]} collection 
 * @param {number} subset 
 * @param {boolean} filterByOrder  
 * @returns {any[][]}
 */
export function getDistinctSubsets(collection, subset) {
    let groups = Array.from({ length: combinations(collection.length, subset) });
    let i = 0;
    let j = 0;
    let k = j + 1;

    while (j < collection.length - (subset - 1)) {
        groups[i++] = [ collection[j], collection[k++] ];
        j = k % collection.length ? j : j + 1;
        k =  k % collection.length ? k : j + 1;
    }

    return groups;
}