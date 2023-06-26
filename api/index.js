import {
    getRandomInteger,
    shuffleArray,
    getCombinations,
    getPermutations, 
    getRandomNumSubsets
} from './utils.js';
export * from './data.js';


let gameObject = null;
let winningSectorsCache = [];
let randomSectorsCache = [];

class Game {
    #totalGames = 0;
    #currentGame = 0;
    #gameSet = null;
    #winningSectors = null;
    #randomSectors = null;

    constructor() {
        this.#gameSet = Array.from(
            { length: 10 }, 
            (_, i) => i
        );
    }

    #arrangeGameSetSectors() {
        let winningSectorsIds = getRandomNumSubsets(
            { min: 0, max: 9 },
            { length: 1, size: 5, interval: 2, ratio: 3 / 10,  timeLimit: 3e3 }
        );

        // loop until yields a combination for `winningSectorsIds`
        while(!winningSectorsIds.length) {
            winningSectorsIds = getRandomNumSubsets(
                { min: 0, max: 9 },
                { length: 1, size: 5, interval: 2, ratio: 3 / 10,  timeLimit: 3e3 }
            )
        }

        console.log('Winning sectors indeces:', winningSectorsIds[0]);

        let j = 0;
        this.#gameSet = this.#gameSet.map((_, index) => {
            const sectorIdx = winningSectorsIds[0].findIndex(n => n === index);
            if (sectorIdx !== -1) {
                return this.#winningSectors[sectorIdx < 3 ? 0 : 1]; // replace with winning sector index
            }

            return this.#randomSectors[j++];
        });
    }

    #getWinningSectors(cache) {
        let idx = getRandomInteger(0, cache.length - 1);
        let chosenSectorsGroup = cache[idx];
        const removed = cache.splice(idx, 1);
        console.log('Current chosen group of winning sectors:', chosenSectorsGroup);
        console.log(`Removed entry`, ...removed, `with #id(${idx}) from`, cache);
        return chosenSectorsGroup;
    }

    #getRandomSectors(cache) {
        let idx = getRandomInteger(0, cache.length - 1);
        let chosenSectorsGroup = cache[idx];
        const removed = cache.splice(idx, 1);
        console.log('Current chosen group of random sectors:', chosenSectorsGroup);
        console.log(`Removed entry`, ...removed, `with #id(${idx}) from`, cache);
        return chosenSectorsGroup;
    }

    getGameSetData() {

        if (!(this.#totalGames % 10)) {

            if (winningSectorsCache.length === 0) {
                winningSectorsCache = getRandomNumSubsets(
                    { min: 0, max: 13 },
                    { length: 5, size: 2, interval: 5, ratio: 1 / 5, timeLimit: 1e3 }
                );

                console.log('Winning sectors cache:', winningSectorsCache);
            }
            

            this.#winningSectors = this.#getWinningSectors(winningSectorsCache);
            console.log('Current winning sectors set:', this.#winningSectors);

            randomSectorsCache = getRandomNumSubsets(
                { min: 0, max: 13 },
                { length: 1, size: 5, interval: 2, ratio: 1 / 5,  timeLimit: 2e3 },
                ...this.#winningSectors
            );

            console.log('Random sectors cache:', randomSectorsCache);

            this.#randomSectors = this.#getRandomSectors(randomSectorsCache);
            console.log('Current random sectors set:', this.#randomSectors);

            this.#arrangeGameSetSectors();

        }

        console.log('Current combined chosen group of sectors:', this.#gameSet);

        return this.#gameSet[this.#currentGame];
    }

    updateGameStats() {
        console.log(`Game ${this.#currentGame} of ${this.#gameSet.length} / Total: ${this.#totalGames}`);
        this.#currentGame = (this.#currentGame + 1) % this.#gameSet.length;
        this.#totalGames++;
    }

    loop() {
        return this.#currentGame < this.#gameSet.length;
    }
    
}

function* gameManager() {

    const game = new Game();

    while (game.loop()) {
        let sector = game.getGameSetData();
        game.updateGameStats();
        yield sector;
    }
}

function startNewGame() {
    gameObject = gameManager();
}

function finishCurrentGame() {
    gameObject.return();
    gameObject = null;
}

export function requestGameData() {
    if (gameObject == null) {
        startNewGame();
    }

    let { value, done } = gameObject.next();
    return value;

}