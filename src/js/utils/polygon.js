/**
 * Returns polygon side length depending on the radius and sides count, 
 * according to the forumula: 2r sin(π/n)
 * @param {number} n number of sides
 * @param {number} r inner radius
 */
export function getSideLen(n, r) {
    if (isNaN(r)) {
        throw new TypeError('Radius value should be a number.');
    }

    if (isNaN(n)) {
        throw new TypeError('Sides count value should be a number.');
    }

    return (2 * r) * Math.sin(Math.PI / n);
}