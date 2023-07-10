/**
 * @typedef {object} HttpRequestOptions
 * @property {{ [header: string]: string | string[] }} headers 
 * @property {'body' | 'events' | 'response'} observe 
 * @property {{ [param: string]: string | number | boolean | ReadonlyArray<string | number | boolean> }} params 
 * @property {boolean} reportProgress 
 * @property {'arraybuffer' | 'blob' | 'json' | 'text'} responseType 
 * @property {boolean} withCredentials 
 * @property {boolean} async 
 */

/**
 * @typedef {Omit<HttpRequestOptions, "async">} HttpContext 
 */

/** 
 * Create HttpRequest instance.
 * @class
 */
export class HttpRequest {
    #url;
    #method;
    #body;
    #options;

    /**
     * Constructs HttpRequest instance.
     * @constructor
     * @param {string} url 
     * @param {'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'} method 
     * @param {any} body 
     * @param {Partial<HttpRequestOptions>} options  
     */
    constructor(url, method = 'GET', body = null, options = {}) {
        method = method ?? 'GET';
        options = typeof options !== 'object' ? {} : options;
        options.headers = options.headers ?? {};
        options.params = options.params ?? {};
        options.observe = options.observe ?? 'body';
        options.responseType = options.responseType ?? 'text';
        options.reportProgress = options.reportProgress ?? false;
        options.withCredentials = options.withCredentials ?? false;
        options.async = options.async ?? true;

        const parsedUrl = new URL(url);

        Object.entries(options.params).forEach(([ k, v ]) => {
            parsedUrl.searchParams.append(k, v);
        });

        this.#url = parsedUrl;
        this.#method = method;
        this.#body = body;
        this.#options = options;
    }

    /**
     * The request url.
     * @readonly
     * @returns {string}
     */
    get url() {
        return this.#url.toString();
    }

    /**
     * The request method.
     * @readonly
     * @returns {'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'}
     */
    get method() {
        return this.#method;
    }

    /**
     * The request body, or null if one isn't set.
     * @readonly
     * @returns {any | null}
     */
    get body() {
        return this.#body;
    }

    /**
     * The request headers or empty object if none are set.
     * @readonly
     * @returns {{ [header: string]: string | string[] }}
     */
    get headers() {
        return { ...this.#options.headers };
    }

    /**
     * The request params or empty object if none are set.
     * @readonly
     * @returns {{ [param: string]: string | number | boolean | ReadonlyArray<string | number | boolean> }}
     */
    get params() {
        return { ...this.#options.params };
    }

    /**
     * Whether the body, the whole response or events are returned.
     * @readonly
     * @returns {'body' | 'events' | 'response'}
     */
    get observe() {
        return this.#options.observe;
    }

    /**
     * Whether this request should be made in a way that exposes progress events.
     * @readonly
     * @returns {boolean}
     */
    get reportProgress() {
        return this.#options.reportProgress;
    }

    /**
     * The expected response type of the server.
     * @readonly
     * @returns {'arraybuffer' | 'blob' | 'json' | 'text'}
     */
    get responseType() {
        return this.#options.responseType;
    }

    /**
     * Whether the request should be made asynchronously or not. 
     * By default, it is asynchronous.
     * @readonly 
     * @return {boolean}
     */
    get async() {
        return this.#options.async;
    }

    /**
     * Clone current HttpRequest object, optionally, 
     * with different context options.
     * @param {Partial<HttpContext>} [update]
     * @returns {HttpRequest}
     */
    clone(update = {}) {
        const url = decodeURIComponent(this.url);
        const method = this.method;
        const body = this.body;
        update.headers = update.headers ?? this.headers;
        update.params = update.params ?? this.params;
        update.observe = update.observe ?? this.observe;
        update.reportProgress = update.reportProgress ?? this.reportProgress;
        update.responseType = update.responseType ?? this.responseType;
        const clonedHttpRequest = new HttpRequest(url, method, body, update);
        return clonedHttpRequest;
    }
}