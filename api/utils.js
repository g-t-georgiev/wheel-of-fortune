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
    const shuffledCollection = shuffleArray(collection);
    const maxSize = combinations(collection.length, length);

    function backtrack(startIdx) {
        if (subset.length === length) {
            subsets.push([...subset]);
            return;
        }

        for (let i = startIdx; i < shuffledCollection.length; i++) {
            subset.push(shuffledCollection[i]);
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
    const shuffledCollection = shuffleArray(collection);
    const maxSize = permutations(collection.length, length);

    function backtrack(startIdx = 0) {
        if (subset.length === length) {
            subsets.push([...subset]);
            return;
        }

        for (let i = startIdx; i < shuffledCollection.length; i++) {
            if (!visited[i]) {
                visited[i] = true;
                subset.push(shuffledCollection[i]);
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

/**
 * Returns a sequence of the specified length,
 * containing the numbers between min and max value. 
 * Additional config options can be passed, as well as
 * filter values.
 * @param {{ min: number, max: number }} range 
 * @param {{ length: number, size: number, interval: number, ratio: number, timeLimit: number }} config 
 * @param {...number} elementsToSkip 
 * @returns 
 */
export function getRandomNumSubsets({ min, max }, { length, size, interval = 1, ratio: ratioTreshold = 0.5, timeLimit = 3e3 }, ...elementsToSkip) {
    if (min > max || 
        length < 1 || 
        size < 1 || 
        interval < 1 ||
        ratioTreshold < 0.1 ||
        timeLimit < 500
    ) {
        throw new RangeError('Invalid treshold values.');
    }

    if (length > max + 1) {
        throw new RangeError('Sequence length is out of boundaries.');
    }

    let startTime = null;
    let currentTime = 0;
    let elapsedTimeRatio = 0;

    const set = []
    const subset = new Set();
    let lastElement;
    let randNum = getRandomInteger(min, max);
    let isEmpty;
    let isIncluded;
    let isInInterval;
    let isTooRepeatitive;
    let skipElement;

    /**
     * Calculates the repetition ratio of value for 
     * the current collection size. Optional start index 
     * can be passed to reduce the look behind tracing steps.
     * @param {number} value 
     * @param {Array<Set<number>>} collection 
     * @param {number} [startIdx] 
     * @returns 
     */
    const getRepetitionRatio = function (value, collection, startIdx = 0) {
        if (startIdx < 0) {
            throw new RangeError('The "startIdx" value cannot be negative number.');
        }

        const calculateRatio = function (part, total) {
            return part / total;
        };

        const reducer = function (count, entry) {
            // console.log(`Checking ${value} for entry`, entry);
            let includes = Array.isArray(entry) ? entry.includes(value) : entry.has(value);
            return includes ? count + 1 : count;
        };

        const appearances = collection.slice(startIdx).reduce(reducer, 0);
        return collection.length > 0 ? calculateRatio(appearances, collection.length) : 0;
    }

    /**
     * Returns *true* if a target value is equal to 
     * a comparison value or a set of comparison values.
     * @param {any} target 
     * @param  {...any} comparisons 
     * @returns 
     */
    const compareElements = function (target, ...comparisons) {
        return comparisons.includes(target);
    }

    /**
     * @param {number} interval 
     * @param {number} value 
     * @param {Set<number>} subset 
     * @param {Array<number>} elementsToSkip 
     * @returns 
     */
    const validateIntervals = function (interval, value, subset) {
        const subsetArray = [ ...subset ];
        const predicate = entry => {
            let condition = Math.abs(entry - value) >= interval;
            return condition;
        };
        const result = subsetArray.every(predicate);
        return result;
    }


    while (set.length < length) {
        if (startTime == null) {
            startTime = performance.now();
        }

        currentTime = performance.now();
        elapsedTimeRatio = (currentTime - startTime) / timeLimit;
        // console.log(`Elapsed / limit processing time ratio: ${elapsedTimeRatio}`);
        
        if (subset.size === size) {
            set.push(new Set(subset));
            subset.clear();
        }

        if (elapsedTimeRatio > 1) break;

        isTooRepeatitive = getRepetitionRatio(randNum, set.slice()) > ratioTreshold;
        isIncluded = subset.has(randNum) || isTooRepeatitive;
        isEmpty = subset.size === 0;
        isInInterval = length < max && length < 5 ? validateIntervals(interval, randNum, subset) : Math.abs(lastElement - randNum) >= interval;
        skipElement = elementsToSkip.length > 0 && compareElements(randNum, ...elementsToSkip);
        // console.log(`Element ${randNum} checking...`);
        if (skipElement || isIncluded || (!isEmpty && !isInInterval)) {
            // console.log(`Element ${randNum} was skipped.`);
            randNum = getRandomInteger(min, max);
            continue;
        }
        
        subset.add(randNum);
        lastElement = randNum;
        // console.log(`Element ${randNum} was added.`);
        randNum = getRandomInteger(min, max);
    }

    let clonedArray = [ ...set.map(subset => [ ...subset ])];
    return clonedArray;
}