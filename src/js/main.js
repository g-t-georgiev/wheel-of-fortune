import { getSideLen } from './utils/polygon.js';
import { rand } from './utils/helpers.js';
import appConfig from './app.config.js';

let winningSector = 11;
let targetAngle = null;
let angleOffset = appConfig.anglePerSector / 2;
let requestId;
let isSpinning = false;
let targetTimeInMs = 5e3;
let startTime = null;
let rotationStep = 5;
let rotationProgress = 0;
let rotationsCount = 0;

let appWrapper = document.querySelector('.app-wrapper');
let wheelContainerEl = appWrapper.querySelector('.wheel-container-outer');
let spinBtn = wheelContainerEl?.querySelector('.wheel-start-btn');
let wheelSectorsContainerEl = wheelContainerEl?.querySelector('.wheel-container-inner');
let sectorEls = wheelSectorsContainerEl?.querySelectorAll('.wheel-sector');
let hoverFeature = window.matchMedia('(hover: hover)');

const setWheelSectorsBlockSize = function (sector, parentContainer) {
    const wheelRect = parentContainer.getBoundingClientRect();
    const wheelRadius = wheelRect.width / 1.95;
    const sideLen = getSideLen(appConfig.sectorsCount, wheelRadius);
    console.log(sideLen);
    sector.style.setProperty('--wheel-sector-block-size', sideLen + 'px');
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

    sectorEls = [ ...wheelSectorsContainerEl.querySelectorAll('.wheel-sector') ];

    if (!sectorEls.length) {

        for (let i = 0; i < appConfig.sectorsCount; i++) {
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
        if (isSpinning) {
            // Stop the wheel prematurely or some
            // other logic for the button when the
            // wheel is currently spinning.
            // console.log('Wait until spin stops.');
            return;
        }
    
        isSpinning = true;   
        // const targetAngleUpperTreshold = winningSector * appConfig.anglePerSector;
        // const targetAngleLowerTreshold = targetAngleUpperTreshold - appConfig.anglePerSector;
        // const targetAngleMeanValue = rand(targetAngleLowerTreshold, targetAngleUpperTreshold);
        // targetAngle = targetAngleMeanValue;
        // console.log(`Winning sector: ${winningSector}; Target angle mean value: ${targetAngle}`);
        requestId = window.requestAnimationFrame(animationFrameCb);
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

const animationFrameCb = function (timestamp) {
    if (startTime == null) {
        startTime = timestamp;
    }

    const elapsedTime = timestamp - startTime;

    if (elapsedTime < targetTimeInMs) {
        rotationProgress += rotationStep;

        if (rotationProgress >= 360) {
            rotationsCount++;
            console.log(`${rotationsCount} rotation(s) occurred`);
        }

        rotationProgress = rotationProgress % 360;

        wheelSectorsContainerEl.style.setProperty('transform', `rotate(${rotationProgress}deg)`);
        window.requestAnimationFrame(animationFrameCb);
    } else {
        isSpinning = false;
        startTime = null;
        rotationsCount = 0;
        console.log(`Rotation: ${rotationProgress}; Time elapsed from start: ${elapsedTime}`);
        winningSector = rand(1, 14);
        cancelAnimationFrame(requestId);
    }
};

