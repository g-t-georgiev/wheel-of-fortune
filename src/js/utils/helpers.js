/**
 * Returns a random number between the interval of a min and max value.
 * The min and max tresholds are inclusive.
 * @param {number} min 
 * @param {number} max 
 * @returns 
 */
export function rand(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min) // min and max inclusive
}

/**
 * Calculates increasing easing factor index.
 * @param {number} t time progress 
 * @param {number} exponent exponent factor
 * @returns 
 */
export function easeIn(t, exponent = 1) {
    // console.log(`Time progression: `, t);
    let easingFactor = (t) ** exponent;
    // console.log('Easing factor:', easingFactor);
    return easingFactor;
}

/**
 * Flips direction of x value.
 * @param {number} x 
 * @returns 
 */
export function flip(x) {
    return 1 - x;
}

/**
 * Calculates decreasing easing factor index.
 * @param {number} t time progress 
 * @param {number} exponent exponent factor
 * @returns 
 */
export function easeOut(t, exponent = 1) {
    t = flip(t);
    // console.log(`Time progression: `, t);
    let easingFactor = flip((t) ** exponent);
    // console.log('Easing factor:', easingFactor);
    return easingFactor;
}