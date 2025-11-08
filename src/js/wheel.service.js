import { HttpClient } from './http-client/index.js';
import appConfig from '../../app.config.js';
import { extractUrlParams, AppMode } from "./helpers.js";

const urlParams = extractUrlParams();

let appMode = (appConfig?.development ?? true) ? AppMode.Development : AppMode.Production;
const appModeOverride = urlParams?.get('mode');

if (appModeOverride.trim() && Object.values(AppMode).includes(appModeOverride)) appMode = appModeOverride;

let apiUrl = appMode === AppMode.Development 
    ? 'http://localhost:5006/' 
    : 'https://wheel-of-fortune-c222da430610.herokuapp.com/';

const apiUrlOverride = AppMode.Development ? urlParams?.get("apiUrl") : '';

if (apiUrlOverride.trim()) apiUrl = apiUrlOverride;

const initDataUrlEndpoint = '';
const gameDataUrlEndPoint = 'game';

const getRequestOptions = {
    headers: { 'Content-Type': 'application/json' }, 
    responseType: 'json'
}

export function getUIRenderData$() {
    const url = apiUrl + initDataUrlEndpoint;
    return HttpClient.get(url, getRequestOptions);
}

export function getGameData$() {
    const url = apiUrl + gameDataUrlEndPoint;
    return HttpClient.get(url, getRequestOptions);
}
