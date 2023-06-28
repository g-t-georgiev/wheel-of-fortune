import * as api from '../../api/index.js';
import { Polygon, createElement, roundNumberToFractionLen, normalizeRotationAngleDeg } from './helpers.js';
import { animate } from './animate.js';

export class WheelComponent {
    rootElementRef = null;
    wheelOuterContainerRef = null;
    wheelInnerContainerRef = null;
    playAnimationButtonRef = null;
    sectorElementsRefList = [];

    isSpinning = false;
    animationHandle = null;
    autoPlay = false; 
    autoPlayIdleTime = 1e3;
    autoSpins = 3;
    frameRate = 60;
    rotationDurationMs = 5e3;
    rotationProgressDeg = 0;
    rotationStartPositionDeg = 0;
    currentRotationCount = 0;
    minFullRotationsCount = 5;

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

    get anglePerSectorDeg() {
        return roundNumberToFractionLen(360 / this.sectorsCount);
    }

    get totalRotationsCount() {
        return Math.floor(this.totalRotationAngleDeg / 360);
    }

    get targetRotationAngleDeg() {
        const layoutOffset = 360 - 90;
        const targetRotationAngleDeg = (this.sectorsCount - (this.targetSectorIndex % this.sectorsCount)) * this.anglePerSectorDeg;
        const adjustedRotationTargetRotationAngleDeg = (targetRotationAngleDeg + layoutOffset) % 360;
        return roundNumberToFractionLen(adjustedRotationTargetRotationAngleDeg, 2);
    }

    get totalRotationAngleDeg() {
        return (360 * this.minFullRotationsCount) + this.targetRotationAngleDeg;
    }

    /**
     * @param {PointerEvent} [pointerEvent] 
     * @returns 
     */
    playButtonClickHandler(pointerEvent) {
        // console.log(ev);
        if ((pointerEvent && pointerEvent instanceof PointerEvent) && this.autoPlay) { // Filter event triggers from UI
            // Show helpful message to the user
            // Do something else...
            return;
        }
    
        if (this.isSpinning) {
            // Do something while wheel is spinning...
            return;
        }
    
        this.isSpinning = true;
        console.log(this.playAnimationButtonRef);
        this.playAnimationButtonRef.toggleAttribute('disabled', this.isSpinning || this.autoPlay);
        this.targetSectorIndex = api.requestGameData();
        this.targetSector = this.sectorElementsRefList[this.targetSectorIndex];
        this.wheelOuterContainerRef.toggleAttribute('data-spin', this.isSpinning);
        this.startAnimationTimeMs = performance.now();
        console.log('Start button click handler');

        animate({ 
            target: this,
            duration: this.rotationDurationMs, 
            start: this.rotationStartPositionDeg, 
            end: this.totalRotationAngleDeg, 
            onUpdate(progress, remainingTime) {
                this.target.rotationProgressDeg = progress;

                if (Math.floor(this.target.rotationProgressDeg / 360) > this.target.currentRotationCount) {
                    this.target.currentRotationCount++;
                    console.log(`Rotation ${this.target.currentRotationCount} of ${this.target.totalRotationsCount}`);
                }
            
                this.target.wheelInnerContainerRef.style.setProperty(
                    'transform',
                    `rotateZ(${progress}deg)`
                );

            },
            onComplete() {
                let targetSector = this.target.targetSector;
                let targetSectorIndex = this.target.targetSectorIndex;
                let targetRotationAngleDeg = this.target.targetRotationAngleDeg;
                
                this.target.rotationProgressDeg = normalizeRotationAngleDeg(this.target.rotationProgressDeg);
                this.target.rotationStartPositionDeg = this.target.rotationProgressDeg;
        
                let rotationProgressDeg = this.target.rotationProgressDeg;
                let rotationStartPositionDeg = this.target.rotationStartPositionDeg;
        
                this.target.wheelInnerContainerRef.style.setProperty(
                    'transform',
                    `rotateZ(${rotationProgressDeg}deg)`
                );
        
                console.log('Wheel rotation progress:', rotationProgressDeg);
                console.log('Winning sector angle:', targetRotationAngleDeg);
                console.log('Winning sector ref:', targetSector);
        
                this.target.isSpinning = false;
                this.target.targetSector = null;
                this.target.targetSectorIndex = null;
                this.target.currentRotationCount = 0;
                
                this.target.wheelOuterContainerRef.toggleAttribute('data-spin', this.target.isSpinning);
        
                if (targetSectorIndex === 5 || this.target.autoPlay) {
                    // console.log('Free spin starting point', rotationStartPositionDeg);
                    let timerId = window.setTimeout(function () {
                        window.clearInterval(timerId);
                        this.target.startAutoPlay(this.target.autoSpins);
                    }, this.target.autoPlayIdleTime);
                    return;
                }
            
                this.target.playAnimationButtonRef.toggleAttribute('disabled', this.target.isSpinning || this.target.autoPlay);
            },
            ease: {
                type: 'easeInOut',
                power: [2, 4]
            }
        });
    }

    startAutoPlay(repeatCount) {
        if (!this.autoPlay) {
            console.log('---- Free spins (auto-play) start ----');
            this.startAutoPlay.internalCalls = 0;
            this.autoPlay = true;
            this.wheelOuterContainerRef.toggleAttribute('data-autoplay', this.autoPlay);
            if (!this.playAnimationButtonRef.hasAttribute('disabled')) {
                this.playAnimationButtonRef.toggleAttribute('disabled', this.autoPlay);
            }
        }
    
        if (this.startAutoPlay.internalCalls < repeatCount) {
            this.startAutoPlay.internalCalls++;
            console.log(`---- Free spins (auto-play) ${this.startAutoPlay.internalCalls} / ${repeatCount} ----`);
            this.playButtonClickHandler();
        } else {
            console.log('---- Free spins (auto-play) end ----');
            this.startAutoPlay.internalCalls = 0;
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
        const angleRad = (this.anglePerSectorDeg * index * Math.PI) / 180;
    
        // Calculate the X and Y coordinates of the sector in pixels
        let x = centerX + radius * Math.cos(angleRad);
        let y = centerY + radius * Math.sin(angleRad);

        // Convert X and Y coordinates to percentage values
        x = x / parentElementClientRect.width * 100;
        y = y / parentElementClientRect.height * 100;
        
        // Calculate central axis rotation in degrees 
        // adjusting with 180deg to point towards center of the circle
        const rotate = (this.anglePerSectorDeg * index) + 180;
    
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

        this.sectorElementsRefList.push(wheelSectorsData.map((dataSrc, index) => {
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

            return sector;
        }));

        console.log(this.playAnimationButtonRef);
        if (window.matchMedia('(hover: hover)').matches) {
            this.playAnimationButtonRef.addEventListener('click', this.playButtonClickHandler);
        } else {
            this.playAnimationButtonRef.addEventListener('pointerdown', this.playButtonClickHandler);
        }
    }
}