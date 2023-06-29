import * as api from '../../api/index.js';
import { WheelComponent } from './wheel.js';

const rootElementRef = document.querySelector('.app-wrapper');

const wheel = new WheelComponent(rootElementRef, api.data.length, {});
wheel.initialize(api.data);