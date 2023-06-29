import { requestAnimationFrame, cancelAnimationFrame } from './animation-frame.js';

/**
 * Abstract class library for animation timing functions
 * @class Animation
 * @abstract
 */
class Animation {

    /**
     * @constructor 
     * @abstract
     */
    constructor() {
        if (this.constructor.name === 'Animation') {
            throw new Error('Abstract class cannot be instantiated')
        }
    }

    /**
     * Flips direction of x value.
     * @param {number} x 
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
     * @returns 
     */
    static lerp(a, b, t) {
        return a + (b - a) * t;
    }

    /**
     * Calculates gradually increasing easing factor index.
     * @param {number} t time progress [0..1]
     * @param {number} exponent exponent factor
     * @returns 
     */
    static easeIn(t, exponent = 1) {
        // console.log(`Time progression: `, t);
        let easingFactor = (t) ** exponent;
        // console.log('Easing factor:', easingFactor);
        return easingFactor;
    }

    /**
     * Calculates gradually decreasing easing factor index.
     * @param {number} t time progress [0..1]
     * @param {number} exponent exponent factor
     * @returns 
     */
    static easeOut(t, exponent = 1) {
        t = this.flip(t);
        // console.log(`Time progression: `, t);
        let easingFactor = this.flip((t) ** exponent);
        // console.log('Easing factor:', easingFactor);
        return easingFactor;
    }

    /**
     * Calculats gradually increasing and decreasing easing factor index. 
     * If the exponent factors are omitted, the default behavior is linear.
     * If only the one exponent is passed it is used for both easing-in and easing-out effect.
     * Otherwise, the first exponent is used for the ease-in and the secont for the ease-out effect.
     * @param {number} t time progress
     * @param {number} exponent1 exponent factor 1
     * @param {number} [exponent2] exponent factor 2
     */
    static easeInOut(t, exponent1 = 1, exponent2) {
        return this.lerp(this.easeIn(t, exponent1), this.easeOut(t, exponent2 ?? exponent1), t);
    }

}

/**
 * 
 * @param {{ 
 *      target: object | HTMLElement,
 *      duration: number, 
 *      start: number, 
 *      end: number, 
 *      onUpdate: (animationProgress: number, remainingTime: number) => void, 
 *      onStart?: () => void, 
 *      onComplete?: () => void, 
 *      ease: {
 *          type: 'none' | 'easeIn' | 'easeOut' | 'easeInOut',
 *          power: number | Array<number>
 *      }
 * }} animation 
 * @returns 
 */
export function animate(animation) {

    const config = {
        animationFrameId: null,
        get target() {
            return animation.target;
        },
        get animationDuration() {
            return animation.duration;
        },
        get startAnimationPosition() {
            return animation.start;
        },
        get completedAnimationPosition() {
            return animation.end;
        },
        animationProgress: null,
        startAnimationTime: null,
        prevAnimationTime: null,
        get easingFunction() {
            let { type: easeType, power: easePower } = animation.ease;
            let easingFunctionPower = Array.isArray(easePower) ? easePower: [ easePower ];
            let easingFunction = (t) => t;
        
            switch (easeType) {
                case 'easeIn': {
                    easingFunction = (t) => {
                        return Animation.easeIn(t, ...easingFunctionPower);
                    };
                    break;
                }
                case 'easeOut': {
                    easingFunction = (t) => {
                        return Animation.easeOut(t, ...easingFunctionPower);
                    }
                    break;
                }
                case 'easeInOut': {
                    easingFunction = (t) => {
                        return Animation.easeInOut(t, ...easingFunctionPower);
                    }
                    break;
                }
            }

            return easingFunction;
        }
    };

    function play(timestamp = performance.now()) {
        if (config.startAnimationTime == null) {
            config.startAnimationTime = timestamp;
        }
    
        const elapsedTime = timestamp - config.startAnimationTime;
        const startTimeProgress = Math.min(1, elapsedTime / config.animationDuration);
        const remainingTimeProgress = 1 - startTimeProgress;
        const remainingTime = Math.max(0, config.animationDuration * remainingTimeProgress);

        if (elapsedTime === 0) {
            animation.onStart?.();
        }
    
        const rotationStepDeg = Animation.lerp(config.startAnimationPosition, config.completedAnimationPosition, config.easingFunction(startTimeProgress));
        config.animationProgress = rotationStepDeg;

        animation.onUpdate?.(config.animationProgress, remainingTime);
    
        if (remainingTime === 0) {
            animation.onComplete?.();

            config.startAnimationTime = null;
            config.prevAnimationTime = null;
            cancelAnimationFrame(config.animationFrameId);;
            return;
        }
    
        config.prevAnimationTime = timestamp;
        config.animationFrameId = requestAnimationFrame(play);
    }

    play();

}