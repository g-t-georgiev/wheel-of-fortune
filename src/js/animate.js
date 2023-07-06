import { requestAnimationFrame, cancelAnimationFrame } from './animation-frame.js';
import { Observable } from './observable.js';

const Transition = {
    /**
     * Flips direction of x value.
     * @param {number} x 
     * @static
     * @returns 
     */
    flip(x) {
        return 1 - x;
    },

    /**
     * Interpolates between start and end value over a set time index from 0 to 1.
     * @param {number} a start value
     * @param {number} b end value
     * @param {number} t time progress [0..1]
     * @static
     * @returns 
     */
    interpolate(a, b, t) {
        return a + (b - a) * t;
    },

    /**
     * Calculates gradually increasing easing factor index.
     * @param {number} e exponent factor 
     * @param {number} t time progress [0..1] 
     * @returns {number}
     */
    easeIn(e = 1, t) {
        // console.log(`Time progression: `, t);
        let easingFactor = (t) ** e;
        // console.log('Easing factor:', easingFactor);
        return easingFactor;
    },

    /**
     * Calculates gradually decreasing easing factor index.
     * @param {number} e exponent factor 
     * @param {number} t time progress [0..1] 
     * @returns {number}
     */
    easeOut(e = 1, t) {
        t = this.flip(t);
        // console.log(`Time progression: `, t);
        let easingFactor = this.flip((t) ** e);
        // console.log('Easing factor:', easingFactor);
        return easingFactor;
    },

    /**
     * Calculats gradually increasing and decreasing easing factor index. 
     * If the exponent factors are omitted, the default behavior is linear.
     * If only the one exponent is passed it is used for both easing-in and easing-out effect.
     * Otherwise, the first exponent is used for the ease-in and the secont for the ease-out effect.
     * @param {number} e1 exponent factor 1
     * @param {number} [e2] exponent factor 2 
     * @param {number} t time progress [0..1] 
     * @returns {number}
     */
    easeInOut(e1 = 1, e2, t) {
        const easeInFactor = this.easeIn(e1, t);
        const easeOutFactor = this.easeOut(e2 ?? e1, t);
        return this.interpolate(easeInFactor, easeOutFactor, t);
    }
}

/**
 * @returns {Pick<typeof Transition, "interpolate" | "easeIn" | "easeOut" | "easeInOut">}
 */
const getPublicTransitions = function () {
    const { interpolate, easeIn, easeOut, easeInOut } = Transition;

    return {
        interpolate: interpolate.bind(Transition),
        easeIn: easeIn.bind(Transition),
        easeOut: easeOut.bind(Transition),
        easeInOut: easeInOut.bind(Transition)
    };
}

export const transitions = getPublicTransitions();

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