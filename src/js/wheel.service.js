import { HttpClient } from './http-client/index.js';
import appConfig from '../app.config.json';

console.log(appConfig);

const URL = true ? 
    'http://localhost:3001' : 
    'https://wheel-of-fortune-c222da430610.herokuapp.com/';

const API_ROOT_URL = URL;
const API_GET_WHEEL_DATA_URL = '/';
const API_GET_TARGET_SECTOR_DATA_URL = '/game';

const UNAUTHORIZED_GET_REQUESTS_OPTIONS = {
    headers: { 'Content-Type': 'application/json' }, 
    responseType: 'json'
}

export function getUIRenderData$() {
    const url = API_ROOT_URL + API_GET_WHEEL_DATA_URL;
    const http$ = HttpClient.get(url, UNAUTHORIZED_GET_REQUESTS_OPTIONS);
    return http$;
}

export function getGameData$() {
    const url = API_ROOT_URL + API_GET_TARGET_SECTOR_DATA_URL;
    const http$ = HttpClient.get(url, UNAUTHORIZED_GET_REQUESTS_OPTIONS);
    return http$;
}
