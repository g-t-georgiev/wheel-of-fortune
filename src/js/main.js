import { WheelComponent } from './wheel.js';
import { getUIRenderData } from './wheel.service.js';

const rootElementRef = document.querySelector('.app-wrapper');

getUIRenderData().subscribe((error, data) => {
    if (error) {
        console.error(error);
        return;
    }

    // console.log(data);
    const wheel = new WheelComponent(rootElementRef, data.length, {});
    wheel.initialize(data);
});