/**
 * Parse response body. If error occurs, returns the original input.
 * @param {string | any} body 
 * @returns {any}
 */
export function parseResponseBody(body) {
    try {
        return JSON.parse(body);
    } catch (e) {
        console.error('Error occurred while parsing response body.\n', e);
        return body;
    }
}

/**
 * Parse request body. If error occurs, returns the original input.
 * @param {any} body 
 * @returns {string | any}
 */
export function parseRequestBody(body) {
    try {
        return JSON.stringify(body);
    } catch (e) {
        console.error('Error occurred while parsing request body.\n', e);
        return body;
    }
}

/**
 * Parse response headers. If error occurs, returns the original string input.
 * @param {string} headers 
 * @returns {{ [header: string]: string | string[] } | string}
 */
export function parseResponseHeaders(headers) {
    try {
        let parsedV;
        return headers
            .trim()
            .split(/\r\n/g)
            .filter(v => v.length !== 0)
            .map(v => v.split(/: /))
            .reduce((o, [k, v]) => ({ ...o, [k]: (parsedV = v.split(/\s*,\s*/g), parsedV.length > 1 ? parsedV : parsedV[0]) }), {});
    } catch (e) {
        console.error('Error occurred while parsing response headers.\n', e);
        return headers;
    }
}