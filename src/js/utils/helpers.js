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
 * On time progress basis from 1 to 0, calculates a decreasing easing factor index.
 * @param {number} t time progress
 * @returns 
 */
export function easeIn(t, exponent = 1) {
    // console.log(`Time progression: `, t);
    let easingFactor = (t) ** exponent;
    // console.log('Easing factor:', easingFactor);
    return easingFactor;
}