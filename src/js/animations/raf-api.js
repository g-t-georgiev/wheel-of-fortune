export const requestAnimationFrame = (function () {
    return (
        globalThis.requestAnimationFrame || 
        globalThis.mozRequestAnimationFrame || 
        globalThis.oRequestAnimationFrame || 
        globalThis.msRequestAnimationFrame || 
        function (cb) {
            if (!globalThis.setTimeout) {
                throw new Error('Implement `setTimeout` functionality.');
            }
            return globalThis.setTimeout(cb, 1e3 / 60);
        }
    );
})();

export const cancelAnimationFrame = (function () {
    return (
        globalThis.cancelAnimationFrame || 
        globalThis.mozCancelAnimationFrame || 
        function (id) {
            if (!globalThis.clearTimeout) {
                throw new Error('Implement `clearTimeout` functionality.');
            }
            globalThis.clearTimeout(id);
        }
    );
})();