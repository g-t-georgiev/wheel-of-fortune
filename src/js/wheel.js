import { Polygon, createElement, roundNumberToFractionLen, normalizeRotationAngleDeg } from './helpers.js';
import { transitions, animationFrames$ } from './animate.js';

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
    autoSpins = 3;

    sectorIdx;
    sector;

    rotationDuration = 5e3;
    rotationStartAngle = 0;
    rotationsCount = 5;

    #playBtnClicked = false;
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
        // Filter event triggers from UI when in auto-play
        if ((
                pointerEvent && 
                pointerEvent instanceof PointerEvent
            ) && 
            this.autoPlay
        ) return;
    
        if (this.isSpinning || this.#playBtnClicked) return;

        // Trigger API request
        this.#playBtnClicked = true;
        const subscription = getGameData$().subscribe({
            next: data => {
                this.#playBtnClicked = false;
    
                console.log('Current sector', data);
                this.sectorIdx = data;
                this.sector = this.sectorElementsRefList[data];
    
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
                subscription.unsubscribe();
            }
        });

        console.log('Start button click handler');
    }

    startAutoPlay(repeatCount) {    
        if (this.#startAutoPlayCalls < repeatCount) {
            this.#startAutoPlayCalls++;
            console.log(`---- Free spins (auto-play) ${this.#startAutoPlayCalls} / ${repeatCount} ----`);
            this.playButtonClickHandler();
        } else {
            console.log('---- Free spins (auto-play) end ----');
            this.#startAutoPlayCalls = 0;
            this.autoPlay = false;
            this.wheelOuterContainerRef.toggleAttribute('data-autoplay', this.autoPlay);
            this.playAnimationButtonRef.toggleAttribute('disabled', this.autoPlay);
        }
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
        

        if (window.matchMedia('(hover: hover)').matches) {
            this.playAnimationButtonRef.addEventListener('click', this.playButtonClickHandler.bind(this));
        } else {
            this.playAnimationButtonRef.addEventListener('pointerdown', this.playButtonClickHandler.bind(this));
        }
    }

    /**
     * @param {number} start 
     * @param {number} end 
     * @param {number} duration 
     */
    tween(start, end, duration) {
        const subscription = animationFrames$.subscribe({
            next: ({ elapsedTime, timestamp }) => {
                const progress = Math.min(1, elapsedTime / duration);
                const remainingTime = Math.max(0, duration * (1 - progress));
                const rate = transitions.interpolate(start, end, transitions.easeInOut(1, 2)(progress));

                if (progress === 0) {
                    this.isSpinning = true;
                    this.playAnimationButtonRef.toggleAttribute('disabled', this.isSpinning || this.autoPlay);
                    this.wheelOuterContainerRef.toggleAttribute('data-spin', this.isSpinning);
                    this.wheelOuterContainerRef.toggleAttribute('data-autoplay', this.autoPlay);
                };
            
                this.wheelInnerContainerRef.style.setProperty(
                    'transform',
                    `rotateZ(${rate}deg)`
                );

                if (progress === 1) {
                    this.rotationStartAngle = normalizeRotationAngleDeg(rate);

                    this.wheelInnerContainerRef.style.setProperty(
                        'transform',
                        `rotateZ(${this.rotationStartAngle}deg)`
                    );

                    console.log('Winning sector', this.sector);
            
                    if (this.sectorIdx === 5 || this.autoPlay) {
                        if (!this.autoPlay) {
                            this.autoPlay = true;
                            console.log('Auto-spins start');
                        }

                        let timerId = globalThis.setTimeout(() => {
                            globalThis.clearInterval(timerId);
                            if (this.#startAutoPlayCalls < this.autoSpins) {
                                this.#startAutoPlayCalls++;
                                console.log(`Auto-spins ${this.#startAutoPlayCalls} / ${this.autoSpins}`);
                                this.playButtonClickHandler();
                            } else {
                                console.log('Auto-spins end');
                                this.#startAutoPlayCalls = 0;
                                this.autoPlay = false;
                                this.wheelOuterContainerRef.toggleAttribute('data-autoplay', this.autoPlay);
                            }
                        }, this.autoPlayIdleTime);
                    }
                
                    this.isSpinning = false;
                    this.sector = null;
                    this.sectorIdx = null;
                    this.wheelOuterContainerRef.toggleAttribute('data-spin', this.isSpinning);
                    this.playAnimationButtonRef.toggleAttribute('disabled', this.isSpinning || this.autoPlay);
                    subscription.unsubscribe();
                }
            }
        })
    }
}