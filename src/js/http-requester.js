import { Observable } from './observable.js';

/**
 * @typedef {object} HttpRequestOptions
 * @property {{ [header: string]: string | string[] }} headers 
 * @property {'body' | 'events' | 'response'} observe 
 * @property {{ [param: string]: string | number | boolean | ReadonlyArray<string | number | boolean> }} params 
 * @property {boolean} reportProgress 
 * @property {'arraybuffer'|'blob'|'json'|'text'} responseType 
 * @property {boolean} withCredentials 
 */

/**
 * Constructs HttpRequest observable object.
 * @constructor
 * @param {string} url 
 * @param {'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'} method 
 * @param {any} data 
 * @param {Partial<HttpRequestOptions>} options 
 * @param {boolean} async 
 * @returns {Observable} 
 * 
 * @example <caption>Creating a GET request:</caption>
 * const getRequest = new HttpRequest('https://api.example.com/data', 'GET', {
 *   headers: {},
 *   params: {},
 *   observe: 'body',
 *   responseType: 'json',
 *   reportProgress: false,
 *   withCredentials: false
 * });
 *
 * @example <caption>Creating a POST request:</caption>
 * const data = { name: 'John', age: 25 };
 * const postRequest = new HttpRequest('https://api.example.com/data', data, 'POST', {
 *   headers: {},
 *   params: {},
 *   observe: 'body',
 *   responseType: 'json',
 *   reportProgress: false,
 *   withCredentials: false
 * });
 */
export function HttpRequest(
    url,
    method = 'GET',
    data = null,
    options = {
        headers: {},
        params: {},
        observe: 'body',
        reportProgress: false,
        responseType: 'json',
        withCredentials: false
    },
    async = true
) {
    if (url == null || typeof url !== 'string') {
        throw new TypeError('Url param should be a valid url string.');
    }

    const supportedHttpMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

    if (method && !supportedHttpMethods.includes(method)) {
        throw new TypeError(`Method param should be either ${supportedHttpMethods.join(', ')}.`);
    }

    method = method ?? 'GET';
    options.headers = options.headers ?? {};
    options.params = options.params ?? {};
    options.observe = options.observe ?? 'body';
    options.responseType = options.responseType ?? 'text';
    options.reportProgress = options.reportProgress ?? false;
    options.withCredentials = options.withCredentials ?? false;

    /**
     * Sends AJAX request.
     * @param {string} url 
     * @param {'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'} method 
     * @param {any} [data] 
     * @param {Pick<HttpRequestOptions, "headers" | "responseType" | "withCredentials">} options 
     * @param {boolean} async 
     * @returns 
     */
    function _sendAJAXRequest(url, method = 'GET', data = null, options, async = true) {
        if (this.readyState === 0) {
            this.open(method, url, async);
            this.responseType = options.responseType;
            this.withCredentials = options.withCredentials;

            const headers = options.headers && Object.entries(options.headers);

            if (headers) {
                headers.forEach(([ name, content ]) => {
                    this.setRequestHeader(name, content);
                });
            }

            if (['POST', 'PUT', 'PATCH'].includes(method)) {
                this.send(data);
                return;
            }

            this.send();
        }
    }

    /**
     * Aborts AJAX request.
     * @param {string} url 
     */
    function _abortAJAXRequest(url) {
        const states = ['OPENED', 'HEADERS_RECEIVED', 'LOADING'];
        states.map(state => this[state]);
        const abortAllowed = states.includes(this.readyState);
        console.log(`Request to '${url}' with state ${this.readyState} abortabale ${abortAllowed}`);
        if (abortAllowed) {
            this.abort();
        }
    }

    /**
     * A wrapper method for invoking the 
     * `_abortAJAXRequest` internally with the 
     * current `xhr` as `this`.
     * @param {XMLHttpRequest} xhr 
     */
    let abortAJAXRequest = function (xhr) {
        _abortAJAXRequest.call(xhr, url);
    };

    /**
     * A wrapper method for invoking the 
     * `_sendAJAXRequest` internnally with the 
     * current `xhr` as `this`.
     * @param {XMLHttpRequest} xhr 
     */
    let sendAJAXRequest = function (xhr) {
        _sendAJAXRequest.call(xhr, url, method, data, options, async);
    };

    return Reflect.construct(Observable, [function (subscriber) {

        // Initialize XHR and Controller
        const controller = new AbortController();
        const { signal } = controller;
        const xhr = new XMLHttpRequest();
    
        // Add event listeners
        const abortHandler = () => {
            console.log('Unsubscribed from request event listener.');
        };
        signal.addEventListener('abort', abortHandler);
        
        if (options.observe === 'events') {

            xhr.addEventListener('loadstart', (ev) => {
                subscriber.next(ev);
            }, { signal });

            xhr.addEventListener('load', (ev) => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    subscriber.next(ev);
                }
            }, { signal });

            xhr.addEventListener('loadend', (ev) => {
                subscriber.next(ev);
                subscriber.complete();
            }, { signal });

            if (options.reportProgress) {

                xhr.addEventListener('progress', (ev) => {
                    if (ev.lengthComputable) {
                        console.log(`Loaded ${ev.loaded} of ${ev.total}`);
                    } else {
                        console.log(`Loaded ${ev.loaded}`);
                    }

                    subscriber.next(ev);
                }, { signal });

            }

            xhr.addEventListener('abort', (ev) => {
                console.log(`Aborted ongoing request to ${this.url}`);
                subscriber.next(ev);
                subscriber.complete();
            }, { signal });

            xhr.addEventListener('error', (ev) => {
                console.log(`Error occurred on request to ${this.url}`);
                subscriber.next(ev);
                subscriber.complete();
            }, { signal });

            xhr.addEventListener('timeout', (ev) => {
                console.log(`Request to ${this.url} timedout`);
                subscriber.next(ev);
                subscriber.complete();
            })

        } else {

            xhr.addEventListener('load', (ev) => {
                const response = {
                    status: xhr.status,
                    statusText: xhr.statusText,
                    headers: xhr.getAllResponseHeaders(),
                    body: xhr.response
                };

                const result = options.observe === 'response' ? response : response.body;

                if (xhr.status >= 200 && xhr.status < 300) {
                    subscriber.next(result);
                } else {
                    subscriber.next(result);
                    subscriber.error(new Error(`HTTP Error: ${xhr.status} ${xhr.statusText}`));
                }

                if (xhr.readyState === 4) {
                    // console.log('XHR ready state from load event handler', xhr.readyState);
                    subscriber.complete();
                }
            }, { signal });

            xhr.addEventListener('abort', (ev) => {
                console.log(`Aborted ongoing request to ${this.url}`);
                subscriber.complete();
            }, { signal });

        }

        sendAJAXRequest(xhr);

        // Unsubscribe handler
        return () => {
            abortAJAXRequest(xhr);
            controller.abort('Unsubscribed from request event listener.');
            if (signal.aborted) {
                signal.removeEventListener('abort', abortHandler);
            }
        };
    }]);
}

/**
 * Creates `GET` http request observable object.
 * @param {string} url 
 * @param {Partial<HttpRequestOptions>} options 
 * @param {boolean} async 
 * @returns {Observable} 
 * 
 * @example <caption>Creating a GET request:</caption>
 * const getRequest = HttpRequest.get('https://api.example.com/data', {
 *   headers: {},
 *   params: {},
 *   observe: 'body',
 *   responseType: 'json',
 *   reportProgress: false,
 *   withCredentials: false
 * });
 */
HttpRequest.get = function (
    url,
    options = {
        headers: {},
        observe: 'body',
        params: {},
        reportProgress: false,
        responseType: 'json',
        withCredentials: false
    },
    async = true
) {
    return HttpRequest(url, 'GET', null, options, async);
}