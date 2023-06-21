import {
    getRandomInteger,
    shuffleArray,
    getDistinctSubsets
} from './utils.js';
export * from './data.js';

let sectors = Array.from({ length: 14 }, (_, i) => i);
let gameObject = null;

function* gameManager() {
    sectors = shuffleArray(sectors);
    let subsetSize = Math.min(sectors.length, 2);
    let winningSectors = shuffleArray(getDistinctSubsets(sectors, subsetSize));
    let winningSectorsGroup = winningSectors[getRandomInteger(0, winningSectors.length - 1)];
    let randomSectors = sectors.filter(v => v !== winningSectorsGroup[0] && v !== winningSectorsGroup[1]);
    let currentGame = null;
    let totalGames = 0;


    for (currentGame = 1; currentGame <= 11; currentGame++) {
        if (currentGame > 10) {
            sectors = shuffleArray(sectors)
            winningSectorsGroup = winningSectors[getRandomInteger(0, winningSectors.length - 1)];
            randomSectors = sectors.filter(v => v !== winningSectorsGroup[0] && v !== winningSectorsGroup[1]);
            currentGame = 1;
            totalGames++;
        }

        if ([3, 7, 10].includes(currentGame)) {
            yield winningSectorsGroup[0];
        } else if ([5, 9].includes(currentGame)) {
            yield winningSectorsGroup[1];
        } else {
            let maxtreshold = sectors.length - subsetSize;
            yield randomSectors[getRandomInteger(0, maxtreshold - 1)];
        }
    }

    return { totalGames };
}

function startNewGame() {
    gameObject = gameManager();
}

function finishCurrentGame() {
    let result = gameObject?.return();
    gameObject = null;
    return result;
}

export function requestGameData() {
    if (gameObject == null) {
        startNewGame();
    }

    let { value, done } = gameObject.next();
    console.log('API response:', value);
    return value;

}