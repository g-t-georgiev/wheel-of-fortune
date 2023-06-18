import { getSideLen } from './utils/polygon.js';
import { rand, easeIn } from './utils/helpers.js';
import appConfig from './app.config.js';

const wheelConfig = {
    sectorsCount: appConfig.data.length,
    animationHandle: null,
    isSpinning: false,
    startAnimationTimeMs: null,
    targetSector: null,
    targetSectorIndex: null,
    rotationDurationMs: 5e3,
    // rotationStepDeg: 3,
    rotationProgressDeg: 0,
    rotationOffset: 10,
    accelerationFactor: 5,
    frameRate: 60,
    get rotationsCount() {
        let rotationDurationSec = this.rotationDurationMs / 1e3;
        let result = Math.floor(rotationDurationSec * (this.rotationStepDeg * this.accelerationFactor * this.frameRate) / 360);
        return result;
    },
    get targetRotationAngleDeg() {
        // Compensate for the 90deg offset of the first sector from the initial position
        const sectorsOffset = 360 - 90;
        return Math.round((this.sectorsCount - (this.targetSectorIndex % this.sectorsCount)) * this.anglePerSectorDeg) + sectorsOffset;
    },
    get totalRotationAngleDeg() {
        return (this.rotationsCount * 360) + this.targetRotationAngleDeg;
    },
    get anglePerSectorDeg() {
        return Number(Number.prototype.toFixed.call(360 / this.sectorsCount, 2));
    },
    get rotationStepDeg() {
        let rotationDurationSec = this.rotationDurationMs / 1e3;
        return this.targetRotationAngleDeg / this.accelerationFactor / rotationDurationSec / this.frameRate;
    }
};

let appWrapper = document.querySelector('.app-wrapper');
let wheelContainerEl = appWrapper.querySelector('.wheel-container-outer');
let spinBtn = wheelContainerEl?.querySelector('.wheel-start-btn');
let wheelSectorsContainerEl = wheelContainerEl?.querySelector('.wheel-container-inner');
let sectorEls = wheelSectorsContainerEl?.querySelectorAll('.wheel-sector');
let hoverFeature = window.matchMedia('(hover: hover)');

const setWheelSectorsBlockSize = function (sector, index, parentContainer) {
    const rect = parentContainer.getBoundingClientRect();
    const radius = rect.width * 0.5;
    const sideLen = Math.floor(getSideLen(appConfig.data.length, radius));
    sector.style.setProperty('--sector-block-size', `${sideLen}px`);
};

const setWheelSectorPosition = function (sector, index, parentContainer) {
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

    sector.style.setProperty('--sector-offset-x', `${x}px`);
    sector.style.setProperty('--sector-offset-y', `${y}px`);
}

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
                spinBtn.textContent = 'Go',
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
        setWheelSectorsBlockSize(sector, index, sector.parentElement);
        setWheelSectorPosition(sector, index, sector.parentElement);
    });

    const startBtnClickHandler = function () {
        if (wheelConfig.isSpinning) {
            // Do something while wheel is spinning...
            return;
        }

        wheelConfig.isSpinning = true;
        wheelConfig.targetSectorIndex = rand(0, 13);
        wheelConfig.startAnimationTimeMs = performance.now();
        wheelSpinHandler(wheelConfig.startAnimationTimeMs);
        spinBtn.toggleAttribute('disabled', wheelConfig.isSpinning);
    };

    if (hoverFeature.matches) {
        spinBtn.addEventListener('click', startBtnClickHandler);
    } else {
        spinBtn.addEventListener('pointerdown', startBtnClickHandler);
    }
});

window.addEventListener('resize', () => {
    sectorEls.forEach((sector, index) => {
        setWheelSectorsBlockSize(sector, index, sector.parentElement);
        setWheelSectorPosition(sector, index, sector.parentElement);
    });
});

// Wheel spin logic

let prevAnimationTimeMs = null;

// const calcFrameRate = function (currentTimestamp, prevTimestamp) {
//     if (currentTimestamp == null || prevTimestamp == null) return;

//     let fps = 1e3 / (currentTimestamp - prevTimestamp);
//     console.log(fps);
//     return fps;
// }

const wheelSpinHandler = function (timestamp) {
    if (wheelConfig.startAnimationTimeMs == null) {
        wheelConfig.startAnimationTimeMs = timestamp;
    }

    // calcFrameRate(timestamp, prevAnimationTimeMs);

    const elapsedTimeMs = timestamp - wheelConfig.startAnimationTimeMs;
    const startTimeProgress = elapsedTimeMs / wheelConfig.rotationDurationMs;
    const remainingTimeProgress = 1 - startTimeProgress;
    const remainingTimeMs = Math.max(0, wheelConfig.rotationDurationMs * remainingTimeProgress);

    if (remainingTimeMs === 0) {
        wheelConfig.rotationProgressDeg = wheelConfig.rotationProgressDeg % 360;
        wheelConfig.targetSector = sectorEls[wheelConfig.targetSectorIndex];
        console.log('Wheel rotation progress:', wheelConfig.rotationProgressDeg);
        console.log('Wheel rotation angle:', wheelConfig.totalRotationAngleDeg);
        console.log('Rotation duration:', wheelConfig.rotationDurationMs);
        console.log('Winning sector index:', wheelConfig.targetSectorIndex);
        console.log('Winning sector angle:', wheelConfig.targetRotationAngleDeg);
        console.log('Winning sector ref:', wheelConfig.targetSector);

        wheelConfig.isSpinning = false;
        wheelConfig.startAnimationTimeMs = null;
        prevAnimationTimeMs = null;
        cancelAnimationFrame(wheelConfig.animationHandle);
        spinBtn.toggleAttribute('disabled', wheelConfig.isSpinning);
        return;
    }

    wheelConfig.rotationProgressDeg += wheelConfig.rotationStepDeg * wheelConfig.accelerationFactor;

    if (Number.isInteger(wheelConfig.rotationProgressDeg / 360)) {
        console.log(`${wheelConfig.rotationProgressDeg / 360} rotation(s)`);
    }

    wheelSectorsContainerEl.style.setProperty(
        'transform',
        `rotateZ(${wheelConfig.rotationProgressDeg % 360}deg)`
    );

    prevAnimationTimeMs = timestamp;
    wheelConfig.animationHandle = window.requestAnimationFrame(wheelSpinHandler);
};

