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
 * @class
 * @classdesc Constructs HttpRequest observable object. 
 */
export class HttpRequest {

    #supportedHttpMethods = [ 'GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS' ];
    #subscribers = new Map();

    /**
     * Constructs HttpRequest observable object.
     * @constructor
     * @param {string} url 
     * @param {'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'} method 
     * @param {any} data 
     * @param {Partial<HttpRequestOptions>} options 
     * @param {boolean} async
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
    constructor(
        url, 
        method = 'GET', 
        data = null,
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
        if (url == null || typeof url !== 'string') {
            throw new TypeError('Url param should be a valid url string.');
        }

        if (method && !this.#supportedHttpMethods.includes(method)) {
            throw new TypeError(`Method param should be either ${this.#supportedHttpMethods.join(', ')}.`);
        }

        method = method ?? 'GET';
        options.headers = options.headers ?? {};
        options.params = options.params ?? {};
        options.observe = options.observe ?? 'body';
        options.responseType = options.responseType ?? 'text';
        options.reportProgress = options.reportProgress ?? false;
        options.withCredentials = options.withCredentials ?? false;

        if (new.target == null) {
            let alertMsg = new Error('Class was invoked without the new keyword.');
            console.error(alertMsg.message);
            return Reflect.construct(HttpRequest, [ url, method, options, sync ]);
        }

        this.url = url;
        this.method = method;
        this.data = data;
        this.options = options;
        this.async = async;
    }

    /**
     * Creates `GET` http request observable object.
     * @param {string} url 
     * @param {Partial<HttpRequestOptions>} options 
     * @param {boolean} async 
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
    static get(
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
        return Reflect.construct(this, [ url, 'GET', null, options, async ]);
    }

    /**
     * Subscribe to HTTP request.
     * @param {(error: any, data: any) => void} observer 
     * @returns 
     */
    subscribe(observer) {
        this.controller = new AbortController();
        const { signal } = this.controller;
        const xhr = new XMLHttpRequest();
        this.#subscribers.set(observer, xhr);

        const signalAbortHandler = () => {
            console.log('Unsubscribed from request event listener.');
        };
        signal.addEventListener('abort', signalAbortHandler);

        if (this.options.observe === 'events') {

            xhr.addEventListener('loadstart', (ev) => {
                this.#notify(observer, null, ev);
            }, { signal });

            xhr.addEventListener('load', (ev) => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    this.#notify(observer, null, ev);
                } else {
                    this.#notify(observer, new Error(`HTTP Error: ${xhr.status} ${xhr.statusText}`), ev);
                }
            }, { signal });

            xhr.addEventListener('loadend', (ev) => {
                this.#notify(observer, null, ev);
            }, { signal });

            if (this.options.reportProgress) {

                xhr.addEventListener('progress', (ev) => {
                    if (ev.lengthComputable) {
                        console.log(`Loaded ${ev.loaded} of ${ev.total}`);
                    } else {
                        console.log(`Loaded ${ev.loaded}`);
                    }
                    
                    this.#notify(observer, null, ev);
                }, { signal });

            }

            xhr.addEventListener('abort', (ev) => {
                console.log(`Aborted ongoing request to ${this.url}`);
                this.#notify(observer, null, ev);
            }, { signal });

            xhr.addEventListener('error', (ev) => {
                console.log(`Error occurred on request to ${this.url}`);
                this.#notify(observer, null, ev);
            }, { signal });

            xhr.addEventListener('timeout', (ev) => {
                console.log(`Request to ${this.url} timedout`);
                this.#notify(observer, null, ev);
            })

        } else {

            xhr.addEventListener('load', (ev) => {
                const response = {
                    status: xhr.status,
                    statusText: xhr.statusText,
                    headers: xhr.getAllResponseHeaders(),
                    body: xhr.response
                };

                const result = this.options.observe === 'response' ? response : response.body;

                if (xhr.status >= 200 && xhr.status < 300) {
                    this.#notify(observer, null, result);
                } else {
                    this.#notify(observer, new Error(`HTTP Error: ${xhr.status} ${xhr.statusText}`), result);
                }
            }, { signal });

            xhr.addEventListener('abort', (ev) => {
                console.log(`Aborted ongoing request to ${this.url}`);
                this.#notify(observer, null, ev);
            }, { signal });

        }

        this.#sendRequest(observer);

        // Unsubscribe function
        return () => {
            if (!this.#subscribers.has(observer)) return;

            const xhr = this.#subscribers.get(observer);

            if (xhr) {
                this.#abortRequest(xhr);
                this.controller.abort('Unsubscribed from request event listener.');
                if (signal.aborted) {
                    signal.removeEventListener('abort', signalAbortHandler);
                }
                this.#subscribers.delete(observer);
            }            
        };
    }

    /**
     * Pass error/response data to the current observer.
     * @param {(error: any, data: any) => void} observer 
     * @param {any} error 
     * @param {any} response 
     */
    #notify(observer, error, response) {
        observer(error, response);
    }

    /**
     * Send AJAX request.
     * @param {(error: any, data: any) => void} observer 
     * @returns 
     */
    #sendRequest(observer) {
        if (!this.#subscribers.has(observer)) return;

        const xhr = this.#subscribers.get(observer);
        if (xhr.readyState === 0) {
            xhr.open(this.method, this.url, this.async);
            xhr.responseType = this.options.responseType;
            xhr.withCredentials = this.options.withCredentials;

            const headers = this.options.headers && Object.entries(this.options.headers);

            if (headers) {
                headers.forEach(([ name, content ]) => {
                    xhr.setRequestHeader(name, content);
                });
            }

            if ([ 'POST', 'PUT', 'PATCH' ].includes(this.method)) {
                xhr.send(this.data);
                return;
            }

            xhr.send();
        }
    }

    /**
     * Abort ongoing AJAX request.
     * @param {XMLHttpRequest} xhr 
     */
    #abortRequest(xhr) {
        const states = [ 'OPENED', 'HEADERS_RECEIVED', 'LOADING' ];
        states.map(state => xhr[state]);
        const abortAllowed = states.includes(xhr.readyState);
        console.log(`Request to '${this.url}' with state ${xhr.readyState} abortabale ${abortAllowed}`);
        if (abortAllowed) {
            xhr.abort();
        }
    }
}