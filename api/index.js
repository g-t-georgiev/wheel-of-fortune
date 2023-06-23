import {
    getRandomInteger,
    shuffleArray,
    getCombinations,
    getPermutations,
} from './utils.js';
export * from './data.js';

let sectors = Array.from({ length: 14 }, (_, i) => i);
let gameSet = 10;
let gameObject = null;
let randomSectorIdx = 0;

function initWinningSectors(sectorsList, subsetsCount, subsetSize, gameSetOccuranceRates) {
    let results = getPermutations(
        sectorsList,
        subsetSize,
        subsetsCount,
        getRandomInteger(0, sectorsList.length - 1)
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

function initRandomSectors(sectorsList, subsetsCount, subsetSize, gameSetOccuranceRates) {
    let results = getPermutations(
        sectorsList,
        subsetSize,
        subsetsCount,
        getRandomInteger(0, sectorsList.length - 1)
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

    if ([ 
        'winningSectorsCount', 
        'winningSectorsOccurance', 
        'winningSectorsSubsetsCount', 
        'randomSectorsOccurance', 
        'randomSectorsSectorsSubsetsCount'
    ].every(
        prop => !Object.prototype.hasOwnProperty.call(gameManager, prop)
    )) {
        gameManager.winningSectorsCount = 2;
        gameManager.winningSectorsOccurance = 5;
        gameManager.winningSectorsSubsetsCount = 10;

        gameManager.randomSectorsOccurance = gameSet * (gameManager.winningSectorsOccurance / gameSet);
        gameManager.randomSectorsSectorsSubsetsCount = 10;
    }

    if ((gameStats?.totalGames === 0 ?? 0) ||
        gameManager.winningSectors.length === 0) {
            gameManager.winningSectors = initWinningSectors(
                sectors,
                gameManager.winningSectorsSubsetsCount,
                Math.min(sectors.length, gameManager.winningSectorsCount)
            );
    }

    let winningSectorsGroup = getWinningSectors(gameManager.winningSectors);

    if ((gameStats?.totalGames === 0 ?? 0) || 
        gameManager.randomSectors.length === 0) {
            gameManager.randomSectors = shuffleArray(
                sectors.filter(v => v !== winningSectorsGroup[0] && v !== winningSectorsGroup[1])
            );
            
            gameManager.randomSectors = initRandomSectors(
                gameManager.randomSectors,
                gameManager.randomSectorsSectorsSubsetsCount,
                Math.max(0, gameManager.randomSectorsOccurance)
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
            randomSectorIdx = randomSectorIdx % gameManager.randomSectorsOccurance;
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
    console.log('API response:', value);
    return value;

}