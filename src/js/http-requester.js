import { Observable } from './observable.js';
import { parseResponseHeaders, parseResponseBody, parseRequestBody } from './helpers.js';

/**
 * @typedef {object} HttpRequestOptions
 * @property {{ [header: string]: string | string[] }} headers 
 * @property {'body' | 'events' | 'response'} observe 
 * @property {{ [param: string]: string | number | boolean | ReadonlyArray<string | number | boolean> }} params 
 * @property {boolean} reportProgress 
 * @property {'arraybuffer'|'blob'|'json'|'text'} responseType 
 * @property {boolean} withCredentials 
 * @property {boolean} async 
 */


/**
 * Handles HTTP requests. Class can be instantiated in the standard way through 
 * the `constructor` or using the static method for the respective HTTP request method.
 * @class 
 * @extends Observable 
 */
export class HttpRequest extends Observable {
    #xhr;
    #controller;
    #url;
    #method;
    #body;
    #options;

    /**
     * Constructs HttpRequest observable object.
     * @constructor
     * @param {string} url 
     * @param {'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'} method 
     * @param {any} body 
     * @param {Partial<HttpRequestOptions>} options  
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
                const options = this.#options;
                // signal.addEventListener('abort', signalAbortHandler);

                if (options.observe === 'body' || options.observe === 'response') {
                    xhr.addEventListener('load', () => {
                        const result = options.observe === 'response' ? this.#response : this.#response.body;

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
                        subscriber.complete();
                    }, { signal });

                    xhr.addEventListener('timeout', () => {
                        console.log(`Request to ${this.#url} timedout.`);
                        subscriber.complete();
                    }, { signal });

                    xhr.addEventListener('abort', (ev) => {
                        console.log(`Aborted request to ${this.#url}.`);
                        subscriber.complete();
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
        this.#url = new URL(url);
        this.#method = method;
        this.#body = body;
        this.#options = options;
    }

    /**
     * Creates `GET` http request observable object.
     * @param {string} url 
     * @param {Partial<HttpRequestOptions>} options 
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
    static get(url, options = {}) {
        return new this(url, 'GET', null, options);
    }

    get #request() {
        return {
            url: this.#url,
            method: this.#method,
            body: this.#body,
            options: this.#options
        }
    }

    get #response() {
        return {
            status: this.#xhr.status,
            statusText: this.#xhr.statusText,
            headers: parseResponseHeaders(this.#xhr.getAllResponseHeaders()),
            body: this.#xhr.responseType === 'text' ? parseResponseBody(this.#xhr.response) : this.#xhr.response
        }
    }

    get url() {
        return this.#url;
    }

    get method() {
        return this.#method;
    }

    get body() {
        return this.#body;
    }

    get options() {
        return this.#options;
    }

    #sendAJAXRequest() {
        const xhr = this.#xhr;
        const request = this.#request;
        const params = Object.entries(request.options.params);
        if (xhr && xhr.readyState === 0) {
            if (params.length > 0) {
               params.forEach(([k, v]) => {
                    request.url.searchParams.set(k, v);
                });
            }

            xhr.open(request.method, request.url, request.options.async);
            xhr.responseType = request.options.responseType;
            xhr.withCredentials = request.options.withCredentials;

            const headers = request.options.headers && Object.entries(request.options.headers);

            if (headers) {
                headers.forEach(([ name, content ]) => {
                    xhr.setRequestHeader(name, content);
                });
            }

            if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
                xhr.send(parseRequestBody(request.body));
                return;
            }

            xhr.send();
        }
    }

    #abortAJAXRequest() {
        const xhr = this.#xhr;
        const url = this.#url;

        if (xhr) {
            const states = ['OPENED', 'HEADERS_RECEIVED', 'LOADING'];
            states.map(state => xhr[state]);
            const abortAllowed = states.includes(xhr.readyState);
            // console.log(`Request to '${decodeURIComponent(url)}' with state ${xhr.readyState} is ${abortAllowed ? '' : 'not'} abortabale.`);
            if (abortAllowed) {
                xhr.abort();
            }
        }
    }
}