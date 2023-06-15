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
    rotationProgressDeg: 0,
    rotationOffset: 1.5,
    rotationsCount: 0,
    get targetSectorAngleDeg() {
        return this.targetSectorIndex * this.anglePerSectorDeg;
    },
    get totalDisplacementAngleDeg() {
        let positionOffsetDeg = 360 - this.rotationProgressDeg;
        let displacementAngleDeg = (360 + positionOffsetDeg) - this.targetSectorAngleDeg;
        return displacementAngleDeg % 360;
        // return 360 - this.targetSectorAngleDeg;
    },
    get anglePerSectorDeg() {
        return Number(Number.prototype.toFixed.call(360 / this.sectorsCount, 2));
    },
    get dynamicRotationStepDeg() {
        let rotationDurationSec = this.rotationDurationMs / 1e3;
        let rotationDurationPerFrame = rotationDurationSec / 60;
        let rotationStepDeg = this.totalDisplacementAngleDeg / rotationDurationPerFrame;
        return rotationStepDeg;
    },
    rotationStepDeg: 25,
};

let appWrapper = document.querySelector('.app-wrapper');
let wheelContainerEl = appWrapper.querySelector('.wheel-container-outer');
let spinBtn = wheelContainerEl?.querySelector('.wheel-start-btn');
let wheelSectorsContainerEl = wheelContainerEl?.querySelector('.wheel-container-inner');
let sectorEls = wheelSectorsContainerEl?.querySelectorAll('.wheel-sector');
let hoverFeature = window.matchMedia('(hover: hover)');

const setWheelSectorsBlockSize = function (sector, parentContainer) {
    const wheelRect = parentContainer.getBoundingClientRect();
    const wheelRadius = wheelRect.width / 2;
    const sideLen = Math.floor(getSideLen(appConfig.data.length, wheelRadius));
    sector.style.setProperty('--wheel-sector-block-size', `${sideLen}px`);
};

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
            sector.classList.add('wheel-sector', `clr-${dataSrc.color}`);
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

    sectorEls.forEach(sector => {
        setWheelSectorsBlockSize(sector, sector.parentElement);
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
    sectorEls.forEach(sector => {
        setWheelSectorsBlockSize(sector, sector.parentElement);
    });
});

// Wheel spin logic

const wheelSpinHandler = function (timestamp) {
    if (wheelConfig.startAnimationTimeMs == null) {
        wheelConfig.startAnimationTimeMs = timestamp;
    }

    const elapsedTimeMs = timestamp - wheelConfig.startAnimationTimeMs;
    let easingFactor = easeIn(1 - (elapsedTimeMs / wheelConfig.rotationDurationMs), 2);
    wheelConfig.rotationProgressDeg += wheelConfig.dynamicRotationStepDeg * easingFactor;

    if (wheelConfig.rotationProgressDeg >= 360) {
        wheelConfig.rotationsCount++;
        // console.log(`${wheelConfig.rotationsCount} rotation(s) occurred`);
        wheelConfig.rotationProgressDeg = wheelConfig.rotationProgressDeg % 360;
    }

    wheelSectorsContainerEl.style.setProperty(
        'transform',
        `rotateZ(${wheelConfig.rotationProgressDeg}deg)`
    );

    if (elapsedTimeMs >= wheelConfig.rotationDurationMs) {
        wheelConfig.targetSector = sectorEls[wheelConfig.targetSectorIndex];
        // console.log('Wheel rotation: ', wheelConfig.rotationProgressDeg);
        // console.log('Rotation duration: ', wheelConfig.rotationDurationMs);
        // console.log('Winning sector index: ', wheelConfig.targetSectorIndex);
        // console.log('Winning sector angle: ', wheelConfig.targetSectorAngleDeg);
        // console.log('Winning sector ref: ', wheelConfig.targetSector);

        wheelConfig.isSpinning = false;
        wheelConfig.startAnimationTimeMs = null;
        wheelConfig.rotationsCount = 0;
        cancelAnimationFrame(wheelConfig.animationHandle);
        spinBtn.toggleAttribute('disabled', wheelConfig.isSpinning);
        return;
    }

    wheelConfig.animationHandle = window.requestAnimationFrame(wheelSpinHandler);
};

