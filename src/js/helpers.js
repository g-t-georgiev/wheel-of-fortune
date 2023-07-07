/**
 * Abstact class serving as a static helper methods library.
 */
export class Polygon {
    /**
     * Returns polygon side length depending on the radius and sides count, 
     * according to the forumula: 2r sin(π/n)
     * @param {number} n number of sides
     * @param {number} r inner radius
     */
    static getSideLen(n, r) {
        if (isNaN(r)) {
            throw new TypeError('Radius value should be a number.');
        }
    
        if (isNaN(n)) {
            throw new TypeError('Sides count value should be a number.');
        }
    
        return (2 * r) * Math.sin(Math.PI / n);
    }
}

/**
 * Rounds a given number to the specified fraction length.
 * @param {number} value 
 * @param {number} [fraction] 
 * @returns 
 */
export function roundNumberToFractionLen(value, fraction = 2) {
    if (fraction < 0) {
        throw new RangeError('Invalid fraction length value. Fraction length cannot be negative.');
    }

    if (fraction == null || fraction === 0) {
        return Math.trunc(value);
    }

    return Number(Number.prototype.toFixed.call(value, fraction));
}

/**
 * A rotation angle value, measured in degrees is 
 * normalized to a range between 0 and 360. 
 * @param {number} rotation 
 * @returns 
 */
export function normalizeRotationAngleDeg(rotation) {
    return rotation % 360;
}

export function calcFrameRate(currentTimestamp, prevTimestamp) {
    if (currentTimestamp == null || prevTimestamp == null) return;

    let fps = Math.floor(1e3 / (currentTimestamp - prevTimestamp));
    return fps;
}

/**
 * Returns a random number between the interval of a min and max value.
 * The min and max tresholds are inclusive.
 * @param {number} min 
 * @param {number} max 
 * @returns 
 */
export function rand(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min) // min and max inclusive
}

/**
 * Creates an HTMLElement with the given attributes, properties, child nodes and optionally, 
 * appended to a parent element.
 * @param {{ name: string, attributes?: {}, properties?: {}, parentElement?: HTMLElement }} config 
 * @param  {...any} childNodes 
 * @returns 
 */
export function createElement({ name, attributes = {}, properties = {}, parentElement = null }, ...childNodes) {
    const element = document.createElement(name);

    for (const attributeName in attributes) {
        const attributeValue = attributes[attributeName];
        
        if (attributeName === 'classList') {
            element.classList.add(...(Array.isArray(attributeValue) ? attributeValue : [ attributeValue ]));
        } else if (attributeName === 'dataSet') {
            let dataSetEntries = Object.entries(attributeValue);
            dataSetEntries.forEach(([ prop, val ]) => element.dataset[prop] = val);
        } else if (attributeName === 'stylesList') {
            let stylesListEntries = Object.entries(attributeValue);
            stylesListEntries.forEach(([ prop, val ]) => element.style.setProperty(prop, val));
        } else {
            element.setAttribute(attributeName, attributeValue)
        }
    }

    for (const propertyName in properties) {
        const propoertyValue = properties[propertyName];
        element[propertyName] = propoertyValue;
    }

    childNodes.forEach(childNode => {
        if (childNode instanceof HTMLElement) {
            element.append(childNode);
        } else if ([ 'input', 'textarea' ].includes(name)) {
            element.value = childNode;
        } else {
            element.textContent = childNode;
        }
    });

    if (parentElement) parentElement.append(element);

    return element;
}

/**
 * Removes the last element of given array recursively,
 * until no more elements in the array. A callback function 
 * is called for every popped item, passing it to the callback.
 * @param {Array<any>} array 
 * @param {(item: any) => void} cb 
 * @returns 
 */
export function loopAndPopArrayItems(array, cb) {
    let item = array.pop();
    if (item) cb(item);
    if (array.length === 0) return;
    loopAndPopArrayItems(array, cb);
}

/**
 * Parse response body. 
 * If error, returns the original input string.
 * @param {string} body 
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
 * Parse response headers.
 * @param {string} headers 
 * @returns {any}
 */
export function parseResponseHeaders(headers) {
    try {
        return headers
            .trim()
            .split(/\r\n/g)
            .filter(v => v.length !== 0)
            .map(v => v.split(/: /))
            .reduce((o, [k, v]) => ({ ...o, [k]: v }), {});
    } catch (e) {
        console.error('Error occurred while parsing response headers.\n', e);
        return headers;
    }
}