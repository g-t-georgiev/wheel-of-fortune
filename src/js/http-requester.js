/**
 * @typedef {object} HttpRequestOptions
 * @property {{ [header: string]: string | string[] }} headers 
 * @property {'body' | 'events' | 'response'} observe 
 * @property {{ [param: string]: string | number | boolean | ReadonlyArray<string | number | boolean> }} params 
 * @property {boolean} reportProgress 
 * @property {'arraybuffer'|'blob'|'json'|'text'} responseType 
 * @property {boolean} withCredentials 
 */

export class HttpRequest {

    #subscribers = new Map();

    /**
     * Constructs HttpRequest observable object.
     * @param {string} endpointUrl 
     * @param {'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'} method 
     * @param {Partial<HttpRequestOptions>} options 
     */
    constructor(
        endpointUrl, 
        method = 'GET', 
        options = {
            headers: {},
            observe: 'body',
            params: {},
            reportProgress: false,
            responseType: 'json',
            withCredentials: false
        }
    ) {
        this.url = endpointUrl;
        this.method = method;
        this.options = options;
    }

    /**
     * Creates `GET` http request observable object.
     * @param {string} endpointUrl 
     * @param {Partial<HttpRequestOptions>} options 
     */
    static get(
        endpointUrl, 
        options = {
            headers: {},
            observe: 'body',
            params: {},
            reportProgress: false,
            responseType: 'json',
            withCredentials: false
        }
    ) {
        return new this(endpointUrl, 'GET', options);
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

    #notify(observer, error, response) {
        observer(error, response);
    }

    #sendRequest(observer) {
        if (!this.#subscribers.has(observer)) return;

        const xhr = this.#subscribers.get(observer);
        if (xhr.readyState === 0) {
            xhr.open(this.method, this.url, true);
            xhr.responseType = this.options.responseType;
            xhr.withCredentials = this.options.withCredentials;

            const headers = this.options.headers && Object.entries(this.options.headers);

            if (headers) {
                headers.forEach(([ name, content ]) => {
                    xhr.setRequestHeader(name, content);
                });
            }

            xhr.send();
        }
    }

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