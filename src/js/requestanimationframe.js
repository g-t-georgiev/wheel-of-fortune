export const _requestAnimationFrame = (function (globalThisObj, postfix) {
    let name,
        func,
        prefixes = [ '', 'webkit', 'moz', 'ms' ].map(prefix => prefix + (prefix.length ? 'R' : 'r'));

    for (let prefix of prefixes) {
        name = prefix + postfix;
        // console.log(name);
        func = globalThisObj[name];
        if (func) break;
    }

    // Fallback to a `setTimeout` implementation
    if (func == null) {
        func = function reqeustAnimationFrameFallback(callback) { setTimeout(callback, 60) };
    }

    return func;
})(globalThis, 'equestAnimationFrame');

export const _cancelAnimationFrame = (function (globalThisObj, postfix) {
    let name,
        func,
        prefixes = [ '', 'moz' ].map(prefix => prefix + (prefix.length ? 'C' : 'c'));

    for (let prefix of prefixes) {
        name = prefix + postfix;
        // console.log(name);
        func = globalThisObj[name];
        if (func) break;
    }

    // Fallback to a `clearTimeout`
    if (func == null) {
        func = function cancelAnimationFrameFallback(timerId) { clearTimeout(timerId) };
    }
    
    return func;
})(globalThis, 'ancelAnimationFrame')

// console.log(_requestAnimationFrame);