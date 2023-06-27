import { _requestAnimationFrame } from './requestanimationframe.js';
import * as api from '../../api/index.js';
import { wheelConfig } from './wheel.config.js';
import { rand, lerp, easeInOut } from './helpers.js';

wheelConfig.initialize({
    sectors: api.data.length,
    duration: 5e3,
});

let appWrapper = document.querySelector('.app-wrapper');
let wheelContainerEl = appWrapper.querySelector('.wheel-container-outer');
let spinBtn = wheelContainerEl?.querySelector('.wheel-start-btn');
let wheelSectorsContainerEl = wheelContainerEl?.querySelector('.wheel-container-inner');
let sectorEls = wheelSectorsContainerEl?.querySelectorAll('.wheel-sector');
let hoverFeature = window.matchMedia('(hover: hover)');

const startBtnClickHandler = function (ev) {
    // console.log(ev);
    if ((ev && ev instanceof PointerEvent) && wheelConfig.autoPlay) { // Filter event triggers from UI
        // Show helpful message to the user
        // Do something else...
        return;
    }

    if (wheelConfig.isSpinning) {
        // Do something while wheel is spinning...
        return;
    }

    wheelConfig.isSpinning = true;
    wheelConfig.targetSectorIndex = api.requestGameData();
    wheelConfig.targetSector = sectorEls[wheelConfig.targetSectorIndex];
    wheelConfig.fullRotationsCount = rand(7, 10);
    spinBtn.toggleAttribute('disabled', wheelConfig.isSpinning || wheelConfig.autoPlay);
    wheelContainerEl.toggleAttribute('data-spin', wheelConfig.isSpinning);
    wheelConfig.startAnimationTimeMs = performance.now();
    wheelSpinHandler(wheelConfig.startAnimationTimeMs);
    console.log('Start button click handler');
};

const startAutoPlay = function (repeatCount) {
    if (!wheelConfig.autoPlay) {
        console.log('---- Free spins (auto-play) start ----');
        startAutoPlay.internalCalls = 0;
        wheelConfig.autoPlay = true;
        wheelContainerEl.toggleAttribute('data-autoplay', wheelConfig.autoPlay);
        if (!spinBtn.hasAttribute('disabled')) {
            spinBtn.toggleAttribute('disabled', wheelConfig.autoPlay);
        }
    }

    if (startAutoPlay.internalCalls < repeatCount) {
        startAutoPlay.internalCalls++;
        console.log(`---- Free spins (auto-play) ${startAutoPlay.internalCalls} / ${repeatCount} ----`);
        startBtnClickHandler();
    } else {
        console.log('---- Free spins (auto-play) end ----');
        startAutoPlay.internalCalls = 0;
        wheelConfig.autoPlay = false;
        wheelContainerEl.toggleAttribute('data-autoplay', wheelConfig.autoPlay);
        spinBtn.toggleAttribute('disabled', wheelConfig.autoPlay);
    }
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
                spinBtn.textContent = 'Spin',
                wheelContainerEl.append(spinBtn)
            );

        // console.log(wheelContainerEl, wheelSectorsContainerEl, spinBtn);


        // append elements in their respective parent elements if not already connected to the DOM
        !wheelContainerEl.isConnected && appWrapper.append(wheelContainerEl);
    }

    sectorEls = [...wheelSectorsContainerEl.querySelectorAll('.wheel-sector')];

    if (!sectorEls.length) {
        for (let i = 0; i < api.data.length; i++) {
            const dataSrc = api.data[i];
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

    const rotationStepDeg = lerp(wheelConfig.rotationStartPositionDeg, wheelConfig.totalRotationAngleDeg, easeInOut(startTimeProgress, 2));
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
        let targetSector = wheelConfig.targetSector;
        let targetSectorIndex = wheelConfig.targetSectorIndex;
        let targetRotationAngleDeg = wheelConfig.targetRotationAngleDeg;
        
        wheelConfig.rotationProgressDeg = wheelConfig.normalizeRotationProgressDeg(wheelConfig.rotationProgressDeg);
        wheelConfig.rotationStartPositionDeg = wheelConfig.rotationProgressDeg;

        let rotationProgressDeg = wheelConfig.rotationProgressDeg;
        let rotationStartPositionDeg = wheelConfig.rotationStartPositionDeg;

        wheelSectorsContainerEl.style.setProperty(
            'transform',
            `rotateZ(${wheelConfig.rotationProgressDeg}deg)`
        );

        console.log('Wheel rotation progress:', rotationProgressDeg);
        console.log('Winning sector angle:', targetRotationAngleDeg);
        console.log('Winning sector ref:', targetSector);

        wheelConfig.isSpinning = false;
        wheelConfig.targetSector = null;
        wheelConfig.targetSectorIndex = null;
        wheelConfig.startAnimationTimeMs = null;
        wheelConfig.prevAnimationTimeMs = null;
        wheelConfig.currentRotationCount = 0;
        cancelAnimationFrame(wheelConfig.animationHandle);
        wheelContainerEl.toggleAttribute('data-spin', wheelConfig.isSpinning);

        if (targetSectorIndex === 5 || wheelConfig.autoPlay) {
            // console.log('Free spin starting point', rotationStartPositionDeg);
            let timerId = window.setTimeout(function () {
                window.clearInterval(timerId);
                startAutoPlay(wheelConfig.autoSpins);
            }, wheelConfig.autoPlayIdleTime);
            return;
        }
    
        spinBtn.toggleAttribute('disabled', wheelConfig.isSpinning || wheelConfig.autoPlay);
        return;
    }

    wheelConfig.prevAnimationTimeMs = timestamp;
    wheelConfig.animationHandle = _requestAnimationFrame(wheelSpinHandler);
};

