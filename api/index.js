import {
    getRandomInteger,
    shuffleArray,
    getCombinations,
    getPermutations, 
    getRandomNumSubsets
} from './utils.js';
export * from './data.js';

let sectors = Array.from({ length: 14 }, (_, i) => i);
let gameSet = 10;
let gameObject = null;
let randomSectorIdx = 0;

function initWinningSectors({ min, max }, { length, size, interval, ratio, timeLimit }, ...elementsToSkip) {
    let results = getRandomNumSubsets(
        { min, max },
        { length, size, interval, ratio, timeLimit },
        ...elementsToSkip
    );

    console.log('Current winning sectors set:', results);
    return results;
}

function getWinningSectors(winningSectors) {
    let idx = getRandomInteger(0, winningSectors.length - 1);
    let chosenSectorsGroup = winningSectors[idx];
    const removed = winningSectors.splice(idx, 1);
    console.log('Current chosen group of winning sectors:', chosenSectorsGroup);
    console.log(`Removed entry`, ...removed, `with #id(${idx}) from`, winningSectors);
    return chosenSectorsGroup;
}

function initRandomSectors({ min, max }, { length, size, interval, ratio, timeLimit }, ...elementsToSkip) {
    let results = getRandomNumSubsets(
        { min, max },
        { length, size, interval, ratio, timeLimit },
        ...elementsToSkip
    );

    console.log('Current random sectors set:', results);
    return results;
}

function getRandomSectors(randomSectors) {
    let idx = getRandomInteger(0, randomSectors.length - 1);
    let chosenSectorsGroup = randomSectors[idx];
    const removed = randomSectors.splice(idx, 1);
    console.log('Current chosen group of random sectors:', chosenSectorsGroup);
    console.log(`Removed entry`, ...removed, `with #id(${idx}) from`, randomSectors);
    return chosenSectorsGroup;
}

function initGameData(sectors) {
    sectors = shuffleArray(sectors);

    if ([ 'winningSectorsConfig', 'nonWinningSectorsConfig',].every(
        prop => !Object.prototype.hasOwnProperty.call(gameManager, prop)
    )) {
        gameManager.winningSectorsConfig = {
            totalLen: 10,
            subsetSize: 2, 
            interval: 5, 
            get gameSetOccurances() {
                return gameSet * 0.5;
            },
            get ratio() {
                return 1 / this.totalLen;
            },
        };

        gameManager.nonWinningSectorsConfig = {
            totalLen: 10,
            subsetSize: 5, 
            interval: 2,
            get gameSetOccurances() {
                return gameSet * 0.5;
            },
            get ratio() {
                return 3 / this.totalLen;
            },
        };
    }

    if (((gameStats?.totalGames ?? 0) === 0) ||
        gameManager.winningSectors.length === 0
    ) {
        gameManager.winningSectors = initWinningSectors(
            { min: 0, max: 13 },
            { 
                length: gameManager.winningSectorsConfig.totalLen,
                size: gameManager.winningSectorsConfig.subsetSize,
                interval: gameManager.winningSectorsConfig.interval,
                ratio: gameManager.winningSectorsConfig.ratio,
                timeLimit: 5e3
            }
        );
    }

    let winningSectorsGroup = getWinningSectors(gameManager.winningSectors);

    if (((gameStats?.totalGames ?? 0) === 0) || 
        gameManager.randomSectors.length === 0
    ) {
        gameManager.randomSectors = initRandomSectors(
            { min: 0, max: 13 },
            {
                length: gameManager.nonWinningSectorsConfig.totalLen,
                size: gameManager.nonWinningSectorsConfig.subsetSize,
                interval: gameManager.nonWinningSectorsConfig.interval,
                ratio: gameManager.nonWinningSectorsConfig.ratio, 
                timeLimit: 5e3
            },
            ...winningSectorsGroup
        );
    }

    let randomSectorsGroup = getRandomSectors(gameManager.randomSectors);

    return [ randomSectorsGroup, winningSectorsGroup ];
}

function gameStats() {
    gameStats.currentGame = 0;
    gameStats.totalGames = 0;
    gameStats.update = function (currentGameSet) {
        this.currentGame = (this.currentGame + 1) % currentGameSet;
        this.totalGames++;
    }

    const { currentGame, totalGames } = gameStats;
    return { currentGame, totalGames };
}

function* gameManager() {

    let randomSectorsGroup, 
        winningSectorsGroup;

    const { currentGame, totalGames } = gameStats();

    for (currentGame, totalGames; gameStats.currentGame < gameSet;) {
        console.log(`Game ${gameStats.currentGame} of ${gameSet} / Total: ${gameStats.totalGames}`);
        if (!(gameStats.totalGames % gameSet)) {
            console.log('Update/Init chosen sectors for current game set.');
            // Reset game variables
            [ randomSectorsGroup, winningSectorsGroup ] = initGameData(sectors);
        }

        if ([2, 6, 9].includes(gameStats.currentGame)) {
            let result = winningSectorsGroup[0];
            console.log('Collection', winningSectorsGroup, 'ID', 0, 'Item', result);
            gameStats.update(gameSet);
            yield result;
        } else if ([4, 8].includes(gameStats.currentGame)) {
            let result = winningSectorsGroup[1];
            console.log('Collection', winningSectorsGroup, 'ID', 1, 'Item', result);
            gameStats.update(gameSet);
            yield result;
        } else {
            let result = randomSectorsGroup[randomSectorIdx];
            console.log('Collection', randomSectorsGroup, 'ID', randomSectorIdx, 'Item', result);
            randomSectorIdx++
            randomSectorIdx = randomSectorIdx % gameManager.nonWinningSectorsConfig.gameSetOccurances;
            gameStats.update(gameSet);
            yield result;
        }
    }

    return (
        gameStats.currentGame = null,
        { ...(gameStats()) }
    );
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
    return value;

}