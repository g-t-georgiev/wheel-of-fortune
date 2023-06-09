const CLR_LIST = {
    RED: 'red',
    BLUE:'blue',
    GREEN: 'green',
    YELLOW: 'yellow',
    ORANGE: 'orange',
    PURPLE: 'purple',
    PINK: 'pink', 
    SALMON: 'salmon', 
    BROWN: 'brown',
    BLACK: 'black', 
    LIGHTGRAY: 'lightgray',
    LIGHTGREEN: 'lightgreen',
    DARKORANGE: 'darkorange',
    DARKBLUE: 'darkblue',
    DARKRED: 'darkred',
};

export default {
    sectorsCount: 14, 
    get anglePerSector() {
        return 360 / this.sectorsCount;
    },
    data: [
        {
            id: 1,
            value: 80,
            text: '80', 
            color: CLR_LIST.RED,
        },
        {
            id: 2,
            value: 120,
            text: '120', 
            color: CLR_LIST.BLUE,
        },
        {
            id: 3,
            value: 15,
            text: '15', 
            color: CLR_LIST.GREEN,
        },
        {
            id: 4,
            value: 135,
            text: '135',
            color: CLR_LIST.YELLOW,
        },
        {
            id: 5,
            value: 58,
            text: '58', 
            color: CLR_LIST.PINK,
        },
        {
            id: 6,
            value: 'freeSpins',
            text: 'Free Spins', 
            color: CLR_LIST.LIGHTGRAY,
        },
        {
            id: 7,
            value: 65,
            text: '65', 
            color: CLR_LIST.PURPLE,
        },
        {
            id: 8,
            value: 145,
            text: '145', 
            color: CLR_LIST.DARKORANGE,
        },
        {
            id: 9,
            value: 220,
            text: '220', 
            color: CLR_LIST.LIGHTGREEN,
        },
        {
            id: 10,
            value: 20,
            text: '20',
            color: CLR_LIST.DARKRED,
        },
        {
            id: 11,
            value: 150,
            text: '150', 
            color: CLR_LIST.DARKBLUE
        },
        {
            id: 12,
            value: 'looseAll',
            text: 'Booooom!', 
            color: CLR_LIST.BLACK,
        },
        {
            id: 13,
            value: 350,
            text: '350', 
            color: CLR_LIST.SALMON,
        },
        {
            id: 14,
            value: 175,
            text: '175',
            color: CLR_LIST.ORANGE,
        },
    ]
};