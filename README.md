# Task 
*Task description as it was given to me:*

Създаване на колело на късмета, с определен брой сектори /14-18/.
При натискане на бутон "Старт", колелото започва да се върти по посока
на часовниковата стрелка /въртенето да продължи около 5 сек./. След това
да изкара печалбата на играча.

1. При 10 завъртания на колелото то трябва да спре 3 пъти на един конкретен
сектор и 2 пъти в друг сектор, като не трябва да спира два последователни пъти в тези сектори два сектора.

2. Да има сектор "FreeSpins", при попадането в който, играча
получава 3 завъртания на колелото, които трябва да се стартират и изиграят автоматично без интеракция от страна
на играча. Да се изведе общата стойност на печалба от FreeSpins, след приключването на последното автоматично завъртане.

# Project setup and description

The projects stack includes HTML, CSS and Javascript.

The project uses a custom code only written by me, e.g. handling HTTP requests and animations by recreating the behavior of the famous RxJS observables. Project file structure and eco system mimics Angular's by separating component's business logic from external dependencies introducing services. Currently only one component exists, although the play button coudl be separated into its own component. 
The decision for the above choices were heavily influenced by my Angular inclined usage at the time of creation and the simplicity and flexibility of RxJS and my desire to recreate the logic and behavior of the respective packages, thus show casing skills and knowledge extending the current project's scope.

On page load the app requests data for constructing the wheel segments, buiding the elements dynamically first, setting the appropriate styles. When the wheel UI is rendered, the user can click the start button, which requests data from the API for the segment's index to land on and initiates the spin. The buttons is locked from the start of the network request, during the spinning animation and during autoplay mode (which is only available on free spins, for now).

The spinning animation logic is inspired by GSAP's. For the purposes of simplicity and flexibility, I have created tweening functions, which use my custom observables under the hood, as well, instead of, e.g. event driven system or callbacks, for getting the start, update (runned on every request animation frame tick) and complete states of the current tweening animation.

Currently the app back-end does not support multiple users, so on every page visit, a new instance of a game is initiated, discarding current one. This is primarily a BE issue, which is not relevant for mainly front-end demonstration purposes. But will be taken for consideration and further improvements and optimizations will follow.