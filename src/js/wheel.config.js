import { Polygon } from './helpers.js';

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
    setWheelSectorsBlockSize(sector, index, parentContainer) {
        const rect = parentContainer.getBoundingClientRect();
        const radius = rect.width * 0.5;
        const sideLen = Math.floor(Polygon.getSideLen(this.sectorsCount, radius));
        sector.style.setProperty('--sector-block-size', `${sideLen / rect.height * 100}%`);
    },
    setWheelSectorPosition(sector, index, parentContainer) {
        // Calculate the center coordinates of the circle container
        const rect = parentContainer.getBoundingClientRect();
        const centerX = rect.width * 0.5;
        const centerY = rect.height * 0.5;
    
        // Define the radius and spacing between the sectors
        const radius = rect.width * 0.25;
    
        // Calculate the angle in radians
        const angleRad = (wheelConfig.anglePerSectorDeg * index * Math.PI) / 180;
    
        // Calculate the X and Y coordinates of the sector
        const x = centerX + radius * Math.cos(angleRad);
        const y = centerY + radius * Math.sin(angleRad);
    
        sector.style.setProperty('--sector-offset-x', `${x / rect.width * 100}%`);
        sector.style.setProperty('--sector-offset-y', `${y / rect.height * 100}%`);
    }
};