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

The project uses a lot of custom code for handling HTTP requests and animations by simulating the behavior of the famous RxJS observables. Project file structure and eco system mimics Angular's by separating component's business logic from external dependencies introducing services. The decision for this choices were heavily influenced by my Angular inclined usage at the time of creation and the simplicity and flexibility of RxJS.