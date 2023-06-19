import { getSideLen } from './utils/polygon.js';
import { rand, easeIn } from './utils/helpers.js';
import appConfig from './app.config.js';

const wheelConfig = {
    sectorsCount: appConfig.data.length,
    animationHandle: null,
    isSpinning: false,
    frameRate: 60,
    startAnimationTimeMs: null,
    prevAnimationTimeMs: null,
    targetSector: null,
    targetSectorIndex: null,
    rotationDurationMs: 5e3,
    rotationProgressDeg: 0,
    rotationStartPositionDeg: 0,
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
        return (360 * 10) + this.targetRotationAngleDeg;
    },
    get anglePerSectorDeg() {
        return this.roundRotationAngleDeg(360 / this.sectorsCount);
    },
    calcRotationStepDeg(startPosition, endPosition, timeframe) {
        return startPosition + (endPosition - startPosition) * timeframe;
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
        const sideLen = Math.floor(getSideLen(appConfig.data.length, radius));
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

let appWrapper = document.querySelector('.app-wrapper');
let wheelContainerEl = appWrapper.querySelector('.wheel-container-outer');
let spinBtn = wheelContainerEl?.querySelector('.wheel-start-btn');
let wheelSectorsContainerEl = wheelContainerEl?.querySelector('.wheel-container-inner');
let sectorEls = wheelSectorsContainerEl?.querySelectorAll('.wheel-sector');
let hoverFeature = window.matchMedia('(hover: hover)');

document.addEventListener('DOMContentLoaded', () => {
    if (
        !wheelContainerEl ||
        !wheelSectorsContainerEl ||
        !spinBtn
    ) {
        // create wheel outer container if not defined
        !wheelContainerEl &&
            (
                wheelContainerEl = document.createElement('div'),
                wheelContainerEl.classList.add('wheel-container-outer')
            );

        // create wheel inner container if not defined
        !wheelSectorsContainerEl &&
            (
                wheelSectorsContainerEl = document.createElement('div'),
                wheelSectorsContainerEl.classList.add('wheel-container-inner'),
                wheelContainerEl.append(wheelSectorsContainerEl)
            );

        // create wheel start button if not defined
        !spinBtn &&
            (
                spinBtn = document.createElement('button'),
                spinBtn.setAttribute('type', 'button'),
                spinBtn.classList.add('wheel-start-btn'),
                spinBtn.textContent = 'Spin',
                wheelContainerEl.append(spinBtn)
            );

        // console.log(wheelContainerEl, wheelSectorsContainerEl, spinBtn);


        // append elements in their respective parent elements if not already connected to the DOM
        !wheelContainerEl.isConnected && appWrapper.append(wheelContainerEl);
    }

    sectorEls = [...wheelSectorsContainerEl.querySelectorAll('.wheel-sector')];

    if (!sectorEls.length) {
        for (let i = 0; i < appConfig.data.length; i++) {
            const dataSrc = appConfig.data[i];
            const sector = document.createElement('div');
            sector.classList.add('wheel-sector');
            sector.style.setProperty('--sector-id', dataSrc.id);
            sector.style.setProperty('--sector-bg-clr', dataSrc.backgroundColor);
            sector.style.setProperty('--sector-txt-clr', dataSrc.color);
            sector.style.setProperty('--sector-rotate', `${(wheelConfig.anglePerSectorDeg * i) + 180}deg`);
            sector.dataset.id = dataSrc.id;
            sector.dataset.value = dataSrc.value;
            const sectorHoverOverlay = document.createElement('div');
            sectorHoverOverlay.classList.add('wheel-sector-overlay');
            const sectorContent = document.createElement('div');
            sectorContent.classList.add('wheel-sector-content');
            sectorContent.textContent = dataSrc.text;
            sector.append(sectorHoverOverlay, sectorContent);
            sectorEls.push(sector);
        }

        wheelSectorsContainerEl.append(...sectorEls);
    }

    sectorEls.forEach((sector, index) => {
        wheelConfig.setWheelSectorsBlockSize(sector, index, sector.parentElement);
        wheelConfig.setWheelSectorPosition(sector, index, sector.parentElement);
    });

    const startBtnClickHandler = function () {
        if (wheelConfig.isSpinning) {
            // Do something while wheel is spinning...
            return;
        }

        wheelConfig.isSpinning = true;
        wheelConfig.targetSectorIndex = rand(0, 13);
        wheelConfig.targetSector = sectorEls[wheelConfig.targetSectorIndex];
        wheelConfig.startAnimationTimeMs = performance.now();
        wheelSpinHandler(wheelConfig.startAnimationTimeMs);
        wheelContainerEl.toggleAttribute('data-spin', wheelConfig.isSpinning);
        spinBtn.toggleAttribute('disabled', wheelConfig.isSpinning);
    };

    if (hoverFeature.matches) {
        spinBtn.addEventListener('click', startBtnClickHandler);
    } else {
        spinBtn.addEventListener('pointerdown', startBtnClickHandler);
    }
});

// Wheel spin logic

const wheelSpinHandler = function (timestamp) {
    if (wheelConfig.startAnimationTimeMs == null) {
        wheelConfig.startAnimationTimeMs = timestamp;
    }

    const elapsedTimeMs = timestamp - wheelConfig.startAnimationTimeMs;
    const startTimeProgress = Math.min(1, elapsedTimeMs / wheelConfig.rotationDurationMs);
    const remainingTimeProgress = 1 - startTimeProgress;
    const remainingTimeMs = Math.max(0, wheelConfig.rotationDurationMs * remainingTimeProgress);

    const rotationStepDeg = wheelConfig.calcRotationStepDeg(wheelConfig.rotationStartPositionDeg, wheelConfig.totalRotationAngleDeg, startTimeProgress);
    wheelConfig.rotationProgressDeg = rotationStepDeg;

    if (Math.floor(wheelConfig.rotationProgressDeg / 360) > wheelConfig.currentRotationCount) {
        wheelConfig.currentRotationCount++;
        console.log(`Rotation ${wheelConfig.currentRotationCount} of ${wheelConfig.totalRotationsCount}`);
    }

    wheelSectorsContainerEl.style.setProperty(
        'transform',
        `rotateZ(${wheelConfig.rotationProgressDeg}deg)`
    );

    if (remainingTimeMs === 0) {
        wheelConfig.rotationProgressDeg = wheelConfig.normalizeRotationProgressDeg(wheelConfig.rotationProgressDeg);
        wheelConfig.rotationStartPositionDeg = wheelConfig.rotationProgressDeg;

        wheelSectorsContainerEl.style.setProperty(
            'transform',
            `rotateZ(${wheelConfig.rotationProgressDeg}deg)`
        );

        console.log('Wheel rotation progress:', wheelConfig.rotationProgressDeg);
        console.log('Winning sector angle:', wheelConfig.targetRotationAngleDeg);
        console.log('Winning sector ref:', wheelConfig.targetSector);

        wheelConfig.isSpinning = false;
        wheelConfig.targetSector = null;
        wheelConfig.targetSectorIndex = null;
        wheelConfig.startAnimationTimeMs = null;
        wheelConfig.prevAnimationTimeMs = null;
        wheelConfig.currentRotationCount = 0;
        cancelAnimationFrame(wheelConfig.animationHandle);
        wheelContainerEl.toggleAttribute('data-spin', wheelConfig.isSpinning);
        spinBtn.toggleAttribute('disabled', wheelConfig.isSpinning);
        return;
    }

    wheelConfig.prevAnimationTimeMs = timestamp;
    wheelConfig.animationHandle = window.requestAnimationFrame(wheelSpinHandler);
};

