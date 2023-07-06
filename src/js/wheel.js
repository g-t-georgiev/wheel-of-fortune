import { Polygon, createElement, roundNumberToFractionLen, normalizeRotationAngleDeg } from './helpers.js';
import { fromEvent, map, tap, takeWhile, endWith } from './observable.js';
import { transitions, AnimationFrames } from './animate.js';
import { getGameData$ } from './wheel.service.js';

export class WheelComponent {
    rootElementRef = null;
    wheelOuterContainerRef = null;
    wheelInnerContainerRef = null;
    playAnimationButtonRef = null;
    sectorElementsRefList = [];

    isSpinning = false;

    autoPlay = false; 
    autoPlayIdleTime = 1e3;
    autoPlayRepeat = 3;

    sectorIdx;
    sector;

    rotationDuration = 5e3;
    rotationStartAngle = 0;
    rotationsCount = 5;

    #awaitsHttpResponse = false;
    #startAutoPlayCalls = 0;

    /**
     * Creates a wheel component instance. The root element 
     * argument is necessary to give the wheel component a container,
     * where it could be initialized.
     * @param {HTMLElement} rootElementRef 
     * @param {number} sectorsCount 
     * @param {{}} config
     */
    constructor(rootElementRef, sectorsCount, config = {}) {
        this.rootElementRef = rootElementRef;
        this.sectorsCount = sectorsCount;
        this.config = config;
    }

    get anglePerSector() {
        return roundNumberToFractionLen(360 / this.sectorsCount);
    }

    get rotationAngle() {
        if (this.sectorIdx == null) return 0;
        const layoutOffset = 360 - 90;
        const rotationAngle = (this.sectorsCount - (this.sectorIdx % this.sectorsCount)) * this.anglePerSector;
        const adjustedRotationAngle = (rotationAngle + layoutOffset) % 360;
        return roundNumberToFractionLen(adjustedRotationAngle, 2);
    }

    get totalRotationAngle() {
        return (360 * this.rotationsCount) + this.rotationAngle;
    }

    /**
     * @param {PointerEvent} [pointerEvent] 
     * @returns 
     */
    playButtonClickHandler(pointerEvent) { 
        // Filter handler triggers from UI when in auto-play
        if ((
                pointerEvent && 
                pointerEvent instanceof PointerEvent
            ) && 
            this.autoPlay
        ) {
            console.log('Play button is disabled.');
            console.log('Auto-play is running.');
            return;
        };
    
        // Filter handler triggers when animation is running/awaiting API response
        if (this.isSpinning || this.#awaitsHttpResponse) {
            console.log('Play button is disabled.');
            if (this.isSpinning) console.log('Animation is running.');
            if (this.#awaitsHttpResponse) console.log('Awaits response from API.');
            return;
        };

        // Trigger API request
        this.#awaitsHttpResponse = true; // Set await response flag
        const subscription = getGameData$().subscribe({
            next: data => {

                console.log('Current sector data', data);
                this.sectorIdx = data;
                this.sector = this.sectorElementsRefList[data];

                // Set auto-play flag
                if (this.sectorIdx === 5) {
                    this.autoPlay = true;
                }
    
                this.tween(
                    this.rotationStartAngle,
                    this.totalRotationAngle, 
                    this.rotationDuration
                );
            },
            error: err => {
                console.error(err);
            },
            complete: () => {
                // Reset await response flag
                this.#awaitsHttpResponse = false;
                subscription.unsubscribe();
            }
        });

        console.log('Play button clicked.');
        // Disabled button while await response from API
        this.playAnimationButtonRef.toggleAttribute('disabled', this.#awaitsHttpResponse);
    }

    scheduleAutoPlay() {    
        if (this.#startAutoPlayCalls === 0) {
            console.log('----- Free spins (auto-play) mode start -----');
            this.wheelOuterContainerRef.toggleAttribute('data-autoplay', this.autoPlay);
        }

        const timerId = globalThis.setTimeout(() => {
            globalThis.clearTimeout(timerId);
            if (this.#startAutoPlayCalls < this.autoPlayRepeat) {
                this.#startAutoPlayCalls++;
                console.log(`----- Free spins (auto-play) count ${this.#startAutoPlayCalls} / ${this.autoPlayRepeat} -----`);
                this.playButtonClickHandler();
            } else {
                console.log('----- Free spins (auto-play) mode end -----');
                this.#startAutoPlayCalls = 0;
                this.autoPlay = false;
                this.wheelOuterContainerRef.toggleAttribute('data-autoplay', this.autoPlay);
                this.playAnimationButtonRef.toggleAttribute('disabled', this.autoPlay);
            }
        }, this.autoPlayIdleTime);
    }

    /**
     * Calculates a sector elements's height as percentage value.
     * @param {DOMRect} parentElementClientRect 
     * @param {(polygonSideLen: number) => void} callback 
     */
    setWheelSectorsBlockSize(parentElementClientRect, callback) {
        // Calculate innter radius in pixels
        const radius = parentElementClientRect.width * 0.5;
        // Calculate polygon side length in pixels
        let polygonSideLen = Math.floor(Polygon.getSideLen(this.sectorsCount, radius));
        // Convert polygon side length in percentage value
        polygonSideLen = polygonSideLen / parentElementClientRect.height * 100
        callback(polygonSideLen);
    }
    
    /**
     * Calculates a sector element's X,Y,Z positions inside the wheel component as percentage values.
     * @param {number} index 
     * @param {DOMRect} parentElementClientRect 
     * @param {(x: number, y: number, rotate: number) => void} callback 
     */
    setWheelSectorPosition(index, parentElementClientRect, callback) {
        // Calculate the center coordinates of the circle container
        const centerX = parentElementClientRect.width * 0.5;
        const centerY = parentElementClientRect.height * 0.5;
    
        // Define the radius and spacing between the sectors
        const radius = parentElementClientRect.width * 0.25;
    
        // Calculate the angle in radians
        const angleRad = (this.anglePerSector * index * Math.PI) / 180;
    
        // Calculate the X and Y coordinates of the sector in pixels
        let x = centerX + radius * Math.cos(angleRad);
        let y = centerY + radius * Math.sin(angleRad);

        // Convert X and Y coordinates to percentage values
        x = x / parentElementClientRect.width * 100;
        y = y / parentElementClientRect.height * 100;
        
        // Calculate central axis rotation in degrees 
        // adjusting with 180deg to point towards center of the circle
        const rotate = (this.anglePerSector * index) + 180;
    
        callback(x, y, rotate);
    }

    /**
     * Initializes the wheel component rendering it in the DOM.
     * An array with config objects for every sector should be passed.
     * Every sector config object should contain `id`, `value`, `text`, `color`, `backgroundColor`.
     * @param {Array<{ id: number, value: string, text: string, color: string, backgroundColor: string }>} wheelSectorsData 
     */
    initialize(wheelSectorsData = {}) {
        this.wheelOuterContainerRef = createElement(
            { 
                name: 'div', 
                attributes: { classList: 'wheel-container-outer' }, 
                parentElement: this.rootElementRef 
            }
        );

        this.wheelInnerContainerRef = createElement(
            { 
                name: 'div', 
                attributes: { classList: 'wheel-container-inner' }, 
                parentElement: this.wheelOuterContainerRef
            }
        );

        this.playAnimationButtonRef = createElement(
            { 
                name: 'button', 
                attributes: { type: 'button', classList: 'wheel-start-btn' }, 
                parentElement: this.wheelOuterContainerRef
            }, 
            'Play'
        );

        wheelSectorsData.forEach((dataSrc, index) => {
            const sector = createElement(
                {
                    name: 'div',
                    attributes: {
                        classList: 'wheel-sector',
                        stylesList: { 
                            '--sector-id': dataSrc.id, 
                            '--sector-bg-clr': dataSrc.backgroundColor, 
                            '--sector-txt-clr': dataSrc.color 
                        },
                        dataSet: { id: dataSrc.id, value: dataSrc.value }
                    },
                    parentElement: this.wheelInnerContainerRef
                },
                createElement({ name: 'div', attributes: { classList: 'wheel-sector-overlay' } }),
                createElement({ name: 'div', attributes: { classList: 'wheel-sector-content' } }, dataSrc.text)
            );

            const parentElementClientRect = sector.parentElement.getBoundingClientRect();

            this.setWheelSectorsBlockSize(parentElementClientRect, (height) => {
                sector.style.setProperty('--sector-block-size', `${height}%`);
            });

            this.setWheelSectorPosition(index, parentElementClientRect, (x, y, rotate) => {
                sector.style.setProperty('--sector-offset-x', `${x}%`);
                sector.style.setProperty('--sector-offset-y', `${y}%`);
                sector.style.setProperty('--sector-rotate', `${rotate}deg`);
            });

            this.sectorElementsRefList.push(sector);
        });
        
        const eventType = window.matchMedia('(hover: hover)').matches ? 'click' : 'pointerdown';
        fromEvent(this.playAnimationButtonRef, eventType).subscribe({
            next: (ev) => {
                this.playButtonClickHandler(ev);
            },
            error: (err) => {
                console.error('Error occurred in `fromEvent` observable:', err);
            }
        });
    }

    /**
     * @param {number} start 
     * @param {number} end 
     * @param {number} duration 
     * @param {number} [delay]
     */
    tween(start, end, duration, delay = 0) {
        const animationFrames$ = new AnimationFrames(delay);
        const subscription = animationFrames$
            .pipe(
                map(({ elapsedTime }) => elapsedTime / duration),
                takeWhile((progress) => progress < 1),
                endWith(1), 
                tap((progress) => {
                    if (progress === 0) {
                        // Start animation stage
                        this.isSpinning = true;
                        this.wheelOuterContainerRef.toggleAttribute('data-spin', this.isSpinning);
                    }
                }),
                map((progress) => transitions.interpolate(start, end, transitions.easeInOut(2, 3, progress)))
            )
            .subscribe({
                next: (rate) => {
                    // Active animation stage
                    this.rotationStartAngle = rate;
                    this.wheelInnerContainerRef.style.setProperty(
                        'transform',
                        `rotateZ(${rate}deg)`
                    );
                },
                complete: () => {
                    console.log('Animation completed');
                    // Complete animation stage
                    this.rotationStartAngle = normalizeRotationAngleDeg(this.rotationStartAngle);

                    this.wheelInnerContainerRef.style.setProperty(
                        'transform',
                        `rotateZ(${this.rotationStartAngle}deg)`
                    );

                    console.log('Winning sector', this.sector);
                    console.log('Next animation start angle:', this.rotationStartAngle);
            
                    if (this.autoPlay) {
                        // Schedule auto-play
                        this.scheduleAutoPlay();
                    }
                
                    this.isSpinning = false;
                    this.sector = null;
                    this.sectorIdx = null;
                    this.wheelOuterContainerRef.toggleAttribute('data-spin', this.isSpinning);
                    this.playAnimationButtonRef.toggleAttribute('disabled', this.isSpinning || this.autoPlay);
                    // (Unsubscribe) Cancel animation
                    subscription.unsubscribe();
                }
            })
    }
}