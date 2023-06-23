/**
 * Returns a random number between the interval of a `min` and `max` value.
 * The *min* and *max* tresholds are **inclusive**.
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
    array = [...array];
    let i = array.length - 1;
    let j;

    while (i >= 0) {
        j = getRandomInteger(0, i);
        [array[i], array[j]] = [array[j], array[i]];
        i--;
    }

    return array;
}

/**
 * Calculates the binomial coefficient `C(n, r)`.
 * @param {number} n 
 * @param {number} r 
 * @returns {number}
 */
function binomialCoefficient(n, r) {
    if (r > n - r) {
        r = n - r;
    }

    let result = 1;

    for (let i = 0; i < r; i++) {
        result *= (n - i);
        result /= (i + 1);
    }

    return result;
}

/**
 * Calculates a factorial of a natural number `num`. 
 * If `num = 0` `1` is returned, and if `num < 0`, `-1` 
 * is returned as indication for invalid input.
 * @param {number} num 
 * @returns {number}
 */
function factorial(num, memo = {}) {
    if (num === 0) return 1;
    if (num < 0) return -1;

    // let result = 1;

    // for (let i = 2; i <= num; i++) {
    //     result *= i;
    // }

    // return result;

    if (Object.prototype.hasOwnProperty.call(memo, num)) {
        return memo[num];
    }

    let result = num * factorial(num - 1);
    memo[num] = result;
    return result;
}

/**
 * Counts the distinct combinations of a subset of `length` 
 * from total of `n` elements.
 * @param {number} n 
 * @param {number} length 
 * @returns 
 */
function combinations(n, length, memo = {}) {
    let key = `${n}-${length}`;
    let result = binomialCoefficient(n, length);
    // return factorial(n) / (factorial(n - length) * factorial(length));

    if (Object.prototype.hasOwnProperty.call(memo, key)) {
        return memo[key];
    }

    memo[key] = result;
    return result;
}

/**
 * Counts the distinct permutations of a subset of `length` 
 * from total of `n` elements.
 * @param {number} n 
 * @param {number} length 
 * @returns 
 */
function permutations(n, length, memo = {}) {
    let key = `${n}-${length}`;
    let result = factorial(n) / (factorial(n - length));

    if (Object.prototype.hasOwnProperty.call(memo, key)) {
        return memo[key];
    }

    memo[key] = result;
    return result;
}

/**
 * Returns an array of distinct combinations of a given length
 * from a collection of items.
 * @param {any[]} collection 
 * @param {number} length 
 * @param {number} [limit] 
 * @param {number} [startIdx]
 * @returns {any[][]}
 */
export function getCombinations(collection, length, limit = Number.MAX_SAFE_INTEGER, startIdx) {
    const subsets = [];
    const subset = [];
    const maxSize = combinations(collection.length, length);

    function backtrack(startIdx) {
        if (subset.length === length) {
            subsets.push([...subset]);
            return;
        }

        for (let i = startIdx; i < collection.length; i++) {
            subset.push(collection[i]);
            backtrack(i + 1);
            subset.pop();

            if (
                maxSize > limit && 
                subsets.length === limit
            ) {
                break;
            }
        }
    }

    backtrack(startIdx ?? 0);
    return subsets;
}

/**
 * Returns an array of distinct permutations of a given length
 * from a collection of items.
 * @param {any[]} collection 
 * @param {number} length 
 * @param {number} [limit] 
 * @param {number} [startIdx]
 * @returns {any[][]}
 */
export function getPermutations(collection, length, limit = Number.MAX_SAFE_INTEGER, startIdx) {
    const subsets = [];
    const subset = [];
    const visited = new Array(collection.length).fill(false);
    const maxSize = permutations(collection.length, length);

    function backtrack(startIdx = 0) {
        if (subset.length === length) {
            subsets.push([...subset]);
            return;
        }

        for (let i = startIdx; i < collection.length; i++) {
            if (!visited[i]) {
                visited[i] = true;
                subset.push(collection[i]);
                backtrack();
                subset.pop();
                visited[i] = false;

                if (
                    maxSize > limit && 
                    subsets.length === limit
                ) {
                    break;
                }
            }
        }
    }

    backtrack(startIdx);
    return subsets;
}