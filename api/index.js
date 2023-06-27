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
let autoPlaySectorsCache = [];
// let sectorsDemoArray = [ 10, 13, 8, 10, 0, 7, 10, 1, 8, 5 ];

class Game {
    #totalGames = 0;
    #currentGame = 0;
    #autoPlayMode = 'disabled';
    #autoPlayModeManager = null;
    #autoSpins = 3;
    #gameSet = null;
    #winningSectors = null;
    #randomSectors = null;
    #autoPlayModeSectors = null;
    #currentCollection = null;
    #currentSector = null;
    #previousSector = null;

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

    #getAutoPlaySectors(cache) {
        let idx = getRandomInteger(0, cache.length - 1);
        let chosenSectorsGroup = cache[idx];
        const removed = cache.splice(idx, 1);
        console.log('Current chosen group of auto-play mode sectors', chosenSectorsGroup);
        console.log(`Removed entry`, ...removed, `with #id(${idx}) from`, cache);
        return chosenSectorsGroup;
    }

    getGameSetData() {

        if (this.#previousSector === 5) {
            if (autoPlaySectorsCache.length === 0) {
                autoPlaySectorsCache = getRandomNumSubsets(
                    { min: 0, max: 13 },
                    { length: 1, size: this.#autoSpins, interval: 2, timeLimit: 3e3 },
                    ...this.#winningSectors, 5
                );  
            }

            this.#autoPlayModeSectors = this.#getAutoPlaySectors(autoPlaySectorsCache);
            this.#autoPlayMode = 'enabled';
            this.#autoPlayModeManager = this.#getFreeSpins();
            console.log('Auto-play mode is enabled.');
        }

        if (!(this.#totalGames % 10) && this.#autoPlayMode !== 'enabled') {

            if (winningSectorsCache.length === 0) {
                winningSectorsCache = getRandomNumSubsets(
                    { min: 0, max: 13 },
                    { length: 5, size: 2, interval: 5, ratio: 1 / 10, timeLimit: 1e3 },
                    5 // exclude `freeSpins` sector from the winning sectors algorithm
                );

                console.log('Winning sectors cache:', winningSectorsCache);
            }
            

            this.#winningSectors = this.#getWinningSectors(winningSectorsCache);
            console.log('Current winning sectors set:', this.#winningSectors);

            randomSectorsCache = getRandomNumSubsets(
                { min: 0, max: 13 },
                { length: 1, size: 5, interval: 2, ratio: 1 / 10,  timeLimit: 2e3 },
                ...this.#winningSectors
            );

            console.log('Random sectors cache:', randomSectorsCache);

            this.#randomSectors = this.#getRandomSectors(randomSectorsCache);
            console.log('Current random sectors set:', this.#randomSectors);

            this.#arrangeGameSetSectors();

        }

        if (this.#autoPlayMode === 'enabled') {
            let { value, done } = this.#autoPlayModeManager.next();
            console.log('Auto-play finished:', done);

            this.#currentCollection = this.#autoPlayModeSectors;
            this.#currentSector = value;
            this.#previousSector = this.#currentSector;
            console.log(`Current sector ${this.#currentSector}`, this.#currentCollection);

            if (done) {
                this.#autoPlayMode = 'disabled';
                this.#autoPlayModeManager = null;
            };

            return this.#currentSector;
        }

        this.#currentCollection = this.#gameSet;
        this.#currentSector =  this.#currentCollection[this.#currentGame];
        console.log(`Current sector ${this.#currentSector}`, this.#currentCollection);
        console.log(`Game ${this.#currentGame} of ${this.#currentCollection.length} / Total: ${this.#totalGames}`);
        this.#previousSector = this.#currentSector;
        this.#currentGame = (this.#currentGame + 1) % this.#currentCollection.length;
        this.#totalGames++;
        return this.#currentSector;
    }

    #getFreeSpins() {
        let sectorIdx = 0;
        let autoPlayModeSectors = [ ...this.#autoPlayModeSectors ];

        function next() {
            console.log('Current auto-play spin sector index', sectorIdx);
            let value = autoPlayModeSectors[sectorIdx++];
            let done = !(sectorIdx < autoPlayModeSectors.length);
            return { value, done };
        }

        return { next };
    }

    loop() {
        return this.#currentGame < this.#gameSet.length;
    }
    
}

function* gameManager() {

    const game = new Game();

    while (game.loop()) {
        let sector = game.getGameSetData();
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