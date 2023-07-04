import { requestAnimationFrame, cancelAnimationFrame } from './animation-frame.js';
import { Observable } from './observable.js';

class Transition {

    constructor() {
        if (this.constructor.name === 'Transition') {
            throw new Error('Abstract class cannot be instantiated');
        }
    }

    /**
     * Flips direction of x value.
     * @param {number} x 
     * @static
     * @returns 
     */
    static flip(x) {
        return 1 - x;
    }

    /**
     * Interpolates between start and end value over a set time index from 0 to 1.
     * @param {number} a start value
     * @param {number} b end value
     * @param {number} t time progress [0..1]
     * @static
     * @returns 
     */
    static interpolate(a, b, t) {
        return a + (b - a) * t;
    }

    /**
     * Calculates gradually increasing easing factor index.
     * @param {number} exponent exponent factor
     * @static
     * @returns 
     */
    static easeIn(exponent = 1) {
        /**
         * @param {number} t
         */
        return (t) => {
            // console.log(`Time progression: `, t);
            let easingFactor = (t) ** exponent;
            // console.log('Easing factor:', easingFactor);
            return easingFactor;
        }
    }

    /**
     * Calculates gradually decreasing easing factor index.
     * @param {number} exponent exponent factor
     * @static
     * @returns 
     */
    static easeOut(exponent = 1) {
        /**
         * @param {number} t time progress [0..1]
         */
        return (t) => {
            t = this.flip(t);
            // console.log(`Time progression: `, t);
            let easingFactor = this.flip((t) ** exponent);
            // console.log('Easing factor:', easingFactor);
            return easingFactor;
        }
    }

    /**
     * Calculats gradually increasing and decreasing easing factor index. 
     * If the exponent factors are omitted, the default behavior is linear.
     * If only the one exponent is passed it is used for both easing-in and easing-out effect.
     * Otherwise, the first exponent is used for the ease-in and the secont for the ease-out effect.
     * @param {number} exponent1 exponent factor 1
     * @param {number} [exponent2] exponent factor 2 
     * @static
     * @returns
     */
    static easeInOut(exponent1 = 1, exponent2) {
        /**
         * @param {number} t time progress [0..1]
         */
        return (t) => {
            const easeInFactor = this.easeIn(exponent1)(t);
            const easeOutFactor = this.easeOut(exponent2 ?? exponent1)(t);
            return this.interpolate(easeInFactor, easeOutFactor, t);
        }
    }
}

/**
 * @typedef {object} transitions  
 * @property {(a: number, b: number, t: number) => number} interpolate 
 * @property {(e: number) => (t: number) => number} easeIn 
 * @property {(e: number) => (t: number) => number} easeOut 
 * @property {(e: number, d: number) => (t: number) => number} easeInOut 
 */

/**
 * @type transitions
 */
export const transitions = {
    interpolate: Transition.interpolate.bind(Transition),
    easeIn: Transition.easeIn.bind(Transition),
    easeOut: Transition.easeOut.bind(Transition),
    easeInOut: Transition.easeInOut.bind(Transition)
};

export const animationFrames$ = new Observable(function (subscriber) {
    let animationFrameId = null;
    let startAnimationFrameTime = null;

    function animationLoop(timestamp = performance.now()) {
        if (startAnimationFrameTime == null) {
            startAnimationFrameTime = timestamp;
        }
    
        const elapsedTime = timestamp - startAnimationFrameTime;    
        subscriber.next({ elapsedTime, timestamp });
        
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }

        animationFrameId = requestAnimationFrame(animationLoop);
    }

    let timerId = globalThis.setTimeout(function () {
        globalThis.clearTimeout(timerId);
        animationLoop();
    }, 0);

    return function () {
        // console.log('Finishing animation with id', animationFrameId);
        cancelAnimationFrame(animationFrameId);
    }
});