import { requestAnimationFrame, cancelAnimationFrame } from './raf-api.js';
import { Observable } from '../obsevable/index.js';

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

/**
 * Creates an observable of animation frames instance.
 * @class 
 * @extends Observable 
 */
export class AnimationFrames extends Observable {
    #animationFrameId;
    #startAnimationFrameTime = null;
    #delay = 0;

    /**
     * Creates an animation frames observable object. 
     * Emits the amount of time elapsed since subscription and the timestamp on each animation frame. 
     * Defaults to milliseconds provided to the requestAnimationFrame's callback. Does not end on its own. 
     * 
     * Every subscription will start a separate animation loop. Since animation frames are always 
     * scheduled by the browser to occur directly before a repaint, scheduling more than one animation 
     * frame synchronously should not be much different or have more overhead than looping over an array of 
     * events during a single animation frame. However, if for some reason the developer would like to ensure the execution 
     * of animation-related handlers are all executed during the same task by the engine, the share operator can be used. 
     * @param {number} delay 
     */
    constructor(delay = 0) {
        super((subscriber) => {
            try {
                const animationLoop = (timestamp = performance.now()) => {
                    if (this.#startAnimationFrameTime == null) {
                        this.#startAnimationFrameTime = timestamp;
                    }
                
                    const elapsedTime = timestamp - this.#startAnimationFrameTime;    
                    subscriber.next({ elapsedTime, timestamp });
                    
                    if (this.#animationFrameId) {
                        cancelAnimationFrame(this.#animationFrameId);
                    }
            
                    this.#animationFrameId = requestAnimationFrame(animationLoop);
                }
            
                let timerId = globalThis.setTimeout(() => {
                    globalThis.clearTimeout(timerId);
                    animationLoop.call(this);
                }, this.#delay);
            } catch (e) {
                subscriber.error('Error occurred in animation frames observable:', e);
            }

        
            return () => {
                // console.log(`Unsubscribed from animation frames observable.`);
                cancelAnimationFrame(this.#animationFrameId);
            }
        });

        this.#delay = delay;
    }
}