import {
    getRandomInteger,
    shuffleArray,
    getCombinations, 
    getPermutations,
} from './utils.js';
export * from './data.js';

let sectors = Array.from({ length: 14 }, (_, i) => i);
let gameSet = 10;
let winningSectorsCount = 2;
let winningSectorOccurences = 5;
let gameObject = null;

function* gameManager() {
    sectors = shuffleArray(sectors);

    let winningSectorsSubsetSize = Math.min(sectors.length, winningSectorsCount);
    let winningSectorsSubsetsLength = 10;
    let winningSectors = shuffleArray(sectors);
    winningSectors = shuffleArray(
        getPermutations(
            shuffleArray(winningSectors), 
            winningSectorsSubsetSize, 
            winningSectorsSubsetsLength,
            getRandomInteger(0, 13)
        )
    );

    let winningSectorsGroup = winningSectors[getRandomInteger(0, winningSectors.length - 1)];

    let randomSectorsSubsetSize = Math.max(0, gameSet - winningSectorOccurences);
    let randomSectorsSubsetsLength = 20;
    let randomSectors = shuffleArray(
        sectors.filter(v => v !== winningSectorsGroup[0] && v !== winningSectorsGroup[1])
    );

    randomSectors = shuffleArray(
        getPermutations(
            shuffleArray(randomSectors),
            randomSectorsSubsetSize,
            randomSectorsSubsetsLength,
            getRandomInteger(0, randomSectors.length - 1)
        )
    );

    let randomSectorsGroup = randomSectors[getRandomInteger(0, randomSectors.length - 1)];
    let randomSectorIdx = 0;
    
    let currentGame = null;
    let totalGames = null;


    for (currentGame = 0, totalGames = 1; currentGame < gameSet; currentGame = (currentGame + 1) % gameSet, totalGames++) {
        if (Number.isInteger(totalGames / (gameSet + 1))) {
            // Reset game variables
            console.log('-------- After 10 games --------');
            sectors = shuffleArray(sectors);

            if (totalGames > 100) {
                // Reset game variables
                console.log('-------- After 100 games --------');
                winningSectors = shuffleArray(sectors);
                winningSectors = shuffleArray(
                    getPermutations(
                        shuffleArray(winningSectors), 
                        winningSectorsSubsetSize, 
                        winningSectorsSubsetsLength,
                        getRandomInteger(0, 13)
                    )
                );
            }

            winningSectorsGroup = winningSectors[getRandomInteger(0, winningSectors.length - 1)];
            console.log('Winning sectors', winningSectorsGroup);

            randomSectors = shuffleArray(
                sectors.filter(v => v !== winningSectorsGroup[0] && v !== winningSectorsGroup[1])
            );
            randomSectors = shuffleArray(randomSectors);
            randomSectors = shuffleArray(
                getPermutations(
                    shuffleArray(randomSectors),
                    randomSectorsSubsetSize,
                    randomSectorsSubsetsLength,
                    getRandomInteger(0, randomSectors.length - 1)
                )
            );

            randomSectorsGroup = randomSectors[getRandomInteger(0, randomSectors.length - 1)];
            randomSectorIdx = 0;
            console.log('Random sectors', randomSectorsGroup);
        }

        if ([2, 6, 9].includes(currentGame)) {
            let result = winningSectorsGroup[0];
            console.log('Collection', winningSectorsGroup, 'ID', 0, 'Item', result);
            yield result;
        } else if ([4, 8].includes(currentGame)) {
            let result = winningSectorsGroup[1];
            console.log('Collection', winningSectorsGroup, 'ID', 1, 'Item', result);
            yield result;
        } else {
            let result = randomSectorsGroup[randomSectorIdx];
            console.log('Collection', randomSectorsGroup, 'ID', randomSectorIdx, 'Item', result);
            randomSectorIdx++
            yield result;
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