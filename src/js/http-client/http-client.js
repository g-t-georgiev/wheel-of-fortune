import { Observable } from '../observable.js';
import { parseResponseHeaders, parseResponseBody, parseRequestBody } from './http-utils.js';

import { HttpRequest } from './models/index.js'

/**
 * Handles HTTP requests. Class can be instantiated in the standard way through 
 * the `constructor` or using the static method for the respective HTTP request method.
 * @class 
 * @extends Observable 
 * 
 * @example 
 * **Handle GET requests**
 * 
 * ```
 * new HttpClient(
 *   'https://api.example.com/data', 
 *   'GET', 
 *   {
 *     headers: {},
 *     params: {},
 *     observe: 'body',
 *     responseType: 'json',
 *     reportProgress: false,
 *     withCredentials: false
 *   }
 * ).subscribe({
 *   next(data) {
 *     // Handle success response
 *     consol.log(data);
 *   },
 *   error(e) {
 *     // Handle error response
 *     console.error(e);
 *   },
 *   complete() {
 *     // On complete logic
 *     console.log('Completed');
 *   }
 * });
 * ```
 *
 * @example 
 * **Handle POST requests**
 * 
 * ```
 * const data = { name: 'John', age: 25 };
 * new HttpClient(
 *   'https://api.example.com/data', 
 *   data, 
 *   'POST', 
 *   {
 *     headers: {},
 *     params: {},
 *     observe: 'body',
 *     responseType: 'json',
 *     reportProgress: false,
 *     withCredentials: false
 *   }
 * ).subscribe({
 *   next(data) {
 *     // Handle success response
 *     consol.log(data);
 *   },
 *   error(e) {
 *     // Handle error response
 *     console.error(e);
 *   },
 *   complete() {
 *     // On complete logic
 *     console.log('Completed');
 *   }
 * });
 * ```
 */
export class HttpClient extends Observable {
    #xhr;
    #controller;
    #request;

    /**
     * Handles HTTP requests.
     * @constructor
     * @param {string} url 
     * @param {'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'} method 
     * @param {any} body 
     * @param {Partial<HttpRequestOptions>} options  
     */
    constructor(url, method = 'GET', body = null, options = {}) {
        if (url == null || typeof url !== 'string') {
            throw new TypeError('Url param should be a valid url string.');
        }
    
        const supportedHttpMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
    
        if (method && !supportedHttpMethods.includes(method)) {
            throw new TypeError(`Method param should be either ${supportedHttpMethods.join(', ')}.`);
        }

        method = method ?? 'GET';
        options = typeof options !== 'object' ? {} : options;
        options.headers = options.headers ?? {};
        options.params = options.params ?? {};
        options.observe = options.observe ?? 'body';
        options.responseType = options.responseType ?? 'text';
        options.reportProgress = options.reportProgress ?? false;
        options.withCredentials = options.withCredentials ?? false;
        options.async = options.async ?? true;

        const xhr = new XMLHttpRequest();
        const controller = new AbortController();

        super((subscriber) => {
            try {
                // AbortController signal
                const { signal } = this.#controller;
                // signal.addEventListener('abort', signalAbortHandler);

                if (this.request.observe === 'body' || this.request.observe === 'response') {
                    xhr.addEventListener('load', () => {
                        const result = this.request.observe === 'response' ? this.#response : this.#response.body;

                        if (this.#response.status >= 200 && this.#response.status < 300) {
                            subscriber.next(result);
                        } else {
                            subscriber.next(result);

                            if (this.#response.status >= 400) {
                                subscriber.error(new Error(`HTTP Error: ${this.#response.status} ${this.#response.statusText}`));
                            }
                        }

                        if (xhr.readyState === 4) {
                            // console.log('XHR completed');
                            subscriber.complete();
                        }
                    }, { signal });

                    xhr.addEventListener('error', () => {
                        subscriber.error(new Error(`Network error`));
                    }, { signal });

                    xhr.addEventListener('timeout', () => {
                        subscriber.error(new Error(`Request to ${this.request.url} timedout.`));
                    }, { signal });

                    xhr.addEventListener('abort', () => {
                        subscriber.error(`Aborted request to ${this.request.url}.`);
                    }, { signal });
                }

                this.#sendAJAXRequest();

                // Unsubscribe handler
                return () => {
                    this.#abortAJAXRequest();
                    controller.abort('Unsubscribed from request event listener.');
                    // signal.removeEventListener('abort', signalAbortHandler);
                };
            } catch (err) {
                subscriber.error(err);
            }
        });

        this.#xhr = xhr;
        this.#controller = controller;
        this.#request = new HttpRequest(url, method, body, options);
    }

    /**
     * Creates `GET` http request observable object.
     * @param {string} url 
     * @param {Partial<HttpRequestOptions>} options 
     * 
     * @example 
     * **Handle GET requests**
     * 
     * ```
     * new HttpClient(
     *   'https://api.example.com/data', 
     *   'GET', 
     *   {
     *     headers: {},
     *     params: {},
     *     observe: 'body',
     *     responseType: 'json',
     *     reportProgress: false,
     *     withCredentials: false
     *   }
     * ).subscribe({
     *   next(data) {
     *     // Handle success response
     *     consol.log(data);
     *   },
     *   error(e) {
     *     // Handle error response
     *     console.error(e);
     *   },
     *   complete() {
     *     // On complete logic
     *     console.log('Completed');
     *   }
     * });
     * ```
     */
    static get(url, options = {}) {
        return new this(url, 'GET', null, options);
    }

    /**
     * Current HTTP request.
     * @returns {HttpRequest} 
     * @readonly
     */
    get request() {
        return this.#request;
    }

    /**
     * @readonly 
     * @return {{ ok: boolean, status: number, statusText: string, headers: string | { [header: string]: string | string[] }, body: any | null }}
     */
    get #response() {
        return {
            ok: this.#xhr.status < 400,
            status: this.#xhr.status,
            statusText: this.#xhr.statusText,
            headers: parseResponseHeaders(this.#xhr.getAllResponseHeaders()),
            body: this.#xhr.responseType === 'text' ? parseResponseBody(this.#xhr.response) : this.#xhr.response
        }
    }

    /**
     * Sets HTTP request headers. 
     * @returns {void} 
     * @private
     */
    #setHttpHeaders() {
        const xhr = this.#xhr;
        const headers = this.request.headers && Object.entries(this.request.headers);

        if (headers) {
            headers.forEach(([ name, content ]) => {
                if (Array.isArray(content)) {
                    content.forEach(value => {
                        xhr.setRequestHeader(name, value);
                    });
                } else {
                    xhr.setRequestHeader(name, content);
                }
            });
        }
    }
    
    /**
     * Send HTTP request.
     * @returns {void} 
     * @private
     */
    #sendAJAXRequest() {
        const xhr = this.#xhr;

        if (xhr && xhr.readyState === 0) {
            xhr.open(this.request.method, this.request.url, this.request.async);
            xhr.responseType = this.request.responseType;
            xhr.withCredentials = this.request.withCredentials;

            this.#setHttpHeaders();

            if (['POST', 'PUT', 'PATCH'].includes(this.request.method)) {
                xhr.send(parseRequestBody(this.request.body));
                return;
            }

            xhr.send();
        }
    }

    /**
     * Abort HTTP request.
     * @returns {void}
     * @private
     */
    #abortAJAXRequest() {
        const xhr = this.#xhr;

        if (xhr) {
            const states = ['OPENED', 'HEADERS_RECEIVED', 'LOADING'];
            states.map(state => xhr[state]);
            const abortAllowed = states.includes(xhr.readyState);
            // console.log(`Request to '${decodeURIComponent(this.#request.url)}' with state ${xhr.readyState} is ${abortAllowed ? '' : 'not'} abortabale.`);
            if (abortAllowed) {
                xhr.abort();
            }
        }
    }
}