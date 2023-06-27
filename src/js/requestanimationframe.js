export const _requestAnimationFrame = (function (globalThis, postfix) {
    let prefixes = [ '', 'webkit', 'moz', 'ms' ];
    prefixes = prefixes.map(prefix => prefix + (prefix.length ? 'R' : 'r'));

    let name, func;
    for (let prefix of prefixes) {
        name = prefix + postfix;
        // console.log(name);
        func = globalThis[name];
        if (func) break;
    }

    // Fallback to a `setTimeout` implementation
    if (func == null) {
        func = function reqeustAnimationFrameFallback(callback) { setTimeout(callback, 60) };
    }

    return func;
})(globalThis, 'equestAnimationFrame');

// console.log(_requestAnimationFrame);