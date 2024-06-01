import { WheelComponent } from './wheel.js';
import { getUIRenderData$ } from './wheel.service.js';

const rootElementRef = document.querySelector('.app-wrapper');

const subscription = getUIRenderData$().subscribe({
    next: function (data) {
        // console.log(data);
        const wheel = new WheelComponent(rootElementRef, data.length, {});
        wheel.initialize(data);
    },
    error: function (e) {
        console.error(`Something went wrong. \n${e}`);
    },
    complete: function () {
        subscription.unsubscribe();
    }
});