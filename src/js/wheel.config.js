import { Polygon } from './helpers.js';

export class WheelComponent {
    constructor() {}
}

export const wheelConfig = {
    sectorsCount: 0,
    animationHandle: null,
    isSpinning: false,
    autoPlay: false, 
    autoPlayIdleTime: 1e3,
    autoSpins: 3,
    frameRate: 60,
    startAnimationTimeMs: null,
    prevAnimationTimeMs: null,
    targetSector: null,
    targetSectorIndex: null,
    rotationDurationMs: 5e3,
    rotationProgressDeg: 0,
    rotationStartPositionDeg: 0,
    fullRotationsCount: 10,
    currentRotationCount: 0,
    get totalRotationsCount() {
        return Math.floor(this.totalRotationAngleDeg / 360);
    },
    get targetRotationAngleDeg() {
        const layoutOffset = 360 - 90;
        const targetRotationAngleDeg = (this.sectorsCount - (this.targetSectorIndex % this.sectorsCount)) * this.anglePerSectorDeg;
        const adjustedRotationTargetRotationAngleDeg = (targetRotationAngleDeg + layoutOffset) % 360;
        return this.roundRotationAngleDeg(adjustedRotationTargetRotationAngleDeg);
    },
    get totalRotationAngleDeg() {
        return (360 * this.fullRotationsCount) + this.targetRotationAngleDeg;
    },
    get anglePerSectorDeg() {
        return this.roundRotationAngleDeg(360 / this.sectorsCount);
    },
    /**
     * Initializer function for the wheel component configuration object.
     * @param {{ sectors: number, duration: number }} config 
     */
    initialize(config) {
        this.sectorsCount = config?.sectors ?? 0;
        this.rotationDurationMs = config?.duration ?? 0;
    },
    calcFrameRate(currentTimestamp, prevTimestamp) {
        if (currentTimestamp == null || prevTimestamp == null) return;
    
        let fps = Math.floor(1e3 / (currentTimestamp - prevTimestamp));
        return fps;
    },
    normalizeRotationProgressDeg(rotationProgressDeg) {
        return rotationProgressDeg % 360;
    },
    roundRotationAngleDeg(rotationAngleDeg, fraction = 2) {
        return Number(Number.prototype.toFixed.call(rotationAngleDeg, fraction));
    },
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
    },
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
        const angleRad = (wheelConfig.anglePerSectorDeg * index * Math.PI) / 180;
    
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
};