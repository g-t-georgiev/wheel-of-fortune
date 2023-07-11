import { Observable } from './observable.js';

// Creation operators

/**
 * Takes an iterable or array-like value and 
 * returns an observable which emits the values.
 * @param {Iterable<any> | ArrayLike<any>} iterable 
 * @returns {Observable}
 */
export function from(iterable) {
    const convertedArray = (Array.isArray(iterable) && iterable) || Array.from(iterable);
    return new Observable(function (destination) {
        try {
            convertedArray.forEach(item => {
                destination.next(item);
            });

            destination.complete();
        } catch (e) {
            // console.error('Error caught in `catch` block of `from` operator function. Reason:', err);
            destination.error(e);
        }

        return function () {
            // console.log('Unsubscribed from `from` factory method.');
        }
    });
}

// Pipable operators

/**
 * Used to perform side-effects for notifications from the source observable.
 * @param {Observer | (value: any) => void} [observerOrNext] 
 * @param {(error: any) => void} [error] 
 * @param {() => void} [complete]  
 * @returns {(source: Observable) => Observable}
 */
export function tap(observerOrNext = {}, error, complete) {
    let observer = typeof observerOrNext === 'function'
        ? {
            next: observerOrNext,
            ...(error && typeof error === 'function' ? { error } : {}),
            ...(complete && typeof complete === 'function' ? { complete } : {})
        } : observerOrNext;

    return function (source) {
        return new Observable(function (destination) {
            let _subscription;

            try {
                _subscription = source.subscribe({
                    ...destination,
                    next(value) {
                        observer.next?.(value);
                        destination.next(value);
                    },
                    error(e) {
                        observer.error?.(e);
                        destination.error(e);
                    },
                    complete() {
                        observer.complete?.();
                        destination.complete();
                    }
                });

            } catch (e) {
                destination.error(e);
            }

            return function () {
                _subscription?.unsubscribe();
                // console.log('Unsubscribed from `tap` operator observable.');
            }
        });
    }
}

/**
 * Applies a given `project` function to each value emitted by the source Observable, and emits the resulting values as an Observable.
 * @param {(value: any, index: number) => void} project 
 * @param {any} thisArg 
 * @returns {(source: Observable) => Observable}
 */
export function map(project, thisArg) {
    return function (source) {
        return new Observable(function (destination) {
            let _subscription;
            let index;

            try {
                _subscription = source.subscribe({
                    ...destination,
                    next(value) {
                        const mappedValue = project.call(thisArg, value, index++);
                        destination.next(mappedValue);
                    }
                });
            } catch (e) {
                // console.log('Error caught in the `catch` block of `map` operator function.', e);
                destination.error(e);
            }

            return function () {
                _subscription?.unsubscribe();
                // console.log('Unsubscribed from `map` operator observable.');
            }
        });
    }
}

/**
 * Filter items emitted by the source Observable by only emitting those that satisfy a specified `predicate`.
 * @param {(value: any, index: number) => boolean} predicate 
 * @param {any} thisArg 
 * @returns {(source: Observable) => Observable}
 */
export function filter(predicate, thisArg) {
    return function (source) {
        return new Observable(function (destination) {
            let _subscription;
            let index = 0;

            try {
                _subscription = source.subscribe({
                    ...destination,
                    next(value) {
                        if (predicate.call(thisArg, value, index++)) {
                            destination.next(value);
                        }
                    }
                });
            } catch (e) {
                destination.error(e);
            }

            return function () {
                _subscription?.unsubscribe();
                // console.log('Unsubscribed from `filter` operator observable.');
            }
        });
    }
}

/**
 * Emits only the first `count` values emitted by the source Observable.
 * @param {number} count 
 * @returns {(source: Observable) => Observable} 
 */
export function take(count) {
    return function (source) {
        return new Observable(function (destination) {
            let emitted = 0;
            let _subscription;

            try {
                _subscription = source.subscribe({
                    ...destination,
                    next(value) {
                        if (count === 0) {
                            destination.complete();
                            return;
                        }

                        if (emitted < count) {
                            destination.next(value);
                            emitted++;
                            return;
                        }

                        destination.complete();
                    }
                });
            } catch (e) {
                destination.error(e);
            }

            return function () {
                // console.log('Unsubscribed from `take` operator observable.');
                _subscription?.unsubscribe();
            }
        });
    }
}

/**
 * Emits values emitted by the source Observable so long as each value satisfies 
 * the given `predicate`, and then completes as soon as this predicate is not satisfied.
 * @param {(value: any) => boolean} predicate 
 * @returns {(source: Observable) => Observable}
 */
export function takeWhile(predicate) {
    return function (source) {
        return new Observable(function (destination) {
            let _subscription;

            try {
                _subscription = source.subscribe({
                    ...destination,
                    next(value) {
                        if (predicate(value)) {
                            destination.next(value);
                            return;
                        }

                        destination.complete();
                    }
                });
            } catch (e) {
                destination.error(e);
            }

            return function () {
                _subscription?.unsubscribe();
                // console.log('Unsubscribed from `takeWhile` operator observable.');
            }
        });
    }
}

/**
 * Emits the values emitted by the source Observable until a notifier Observable emits a value.
 * @param {Observable} notifier 
 * @returns {(source: Observable) => Observable}
 */
export function takeUntil(notifier) {
    return function (source) {
        return new Observable(function (destination) {
            let _subscription;

            try {
                _subscription = notifier.subscribe({
                    ...destination,
                    next() {
                        destination.complete();
                    }
                });

                !destination.closed && (_subscription.add(source.subscribe(destination)));

            } catch (e) {
                destination.error(e);
            }

            return function () {
                _subscription?.unsubscribe();
                // console.log('Unsubscribed from `takeUntil` operator observable.');
            }
        });
    }
}

/**
 * Returns an Observable that skips the first `count` items emitted by the source Observable.
 * @param {number} count 
 * @returns {(source: Observable) => Observable} 
 */
export function skip(count) {
    return function (source) {
        return new Observable(function (destination) {
            let skipped = 0;
            let emitted = 0;
            let _subscription;

            try {
                _subscription = source.subscribe({
                    ...destination,
                    next(value) {
                        if (skipped < count) {
                            skipped++;
                            return;
                        }

                        destination.next(value);
                        emitted++;
                    },
                    complete() {
                        if (emitted === 0) {
                            throw new RangeError('Skip count cannot be greater than total emitions count.');
                        }

                        destination.complete();
                    }
                });
            } catch (e) {
                destination.error(e);
            }

            return function () {
                _subscription?.unsubscribe();
                // console.log('Unsubscribed from `skip` operator observable.');
            }
        });
    }
}

/**
 * Delays the emission of items from the source Observable by a given timeout or until a given Date.
 * @param {number | Date} due 
 * @returns {(source: Observable) => Observable}
 */
export function delay(due) {
    return function (source) {
        return new Observable(function (destination) {
            const timerIds = new Set();
            const start = new Date();
            let hasCompleted = false;
            let _subscription;

            try {
                _subscription = source.subscribe({
                    ...destination,
                    next(value) {
                        let delay = due instanceof Date ? due - start : due;
                        delay = delay <= 0 ? 0 : delay;
                        const timerId = globalThis.setTimeout(function () {
                            destination.next(value);
                            timerIds.delete(timerId);
                            globalThis.clearTimeout(timerId);

                            if (hasCompleted && timerIds.size === 0) {
                                destination.complete();
                            }
                        }, delay);

                        timerIds.add(timerId);
                    },
                    complete() {
                        hasCompleted = true;

                        if (timerIds.size === 0) {
                            destination.complete();
                        }
                    }
                });
            } catch (e) {
                destination.error(e);
            }

            return function () {
                _subscription?.unsubscribe();
                // console.log('Unsubscribed from `delay` operator observable.');
                for (const timerId of timerIds) {
                    globalThis.clearTimeout(timerId);
                }
            }
        });
    }
}

/**
 * Catches errors on the observable to be handled by returning a new observable or throwing an error.
 * @param {(error: any, caught: Observable) => Observable} selector 
 * @returns {(source: Observable) => Observable}
 */
export function catchError(selector) {
    return function (source) {
        return new Observable(function (destination) {
            let _subscription;
            let _handledResult;
            let _syncUnsub = false;

            try {
                // Subscribe to source observable
                _subscription = source.subscribe({
                    ...destination,
                    error(e) {
                        // console.log('Destination closed (1)', destination.closed);
                        _handledResult = selector(e, catchError(selector)(source));

                        if (_subscription) {
                            _subscription.unsubscribe();
                            _subscription = null;
                            _subscription = _handledResult.subscribe(destination);
                        } else {
                            _syncUnsub = true;
                        }
                    }
                });

                if (_syncUnsub) {
                    // console.log('Destination closed (2)', destination.closed);
                    _subscription.unsubscribe();
                    // console.log('Destination closed (3)', destination.closed);
                    _subscription = null;
                    _subscription = _handledResult?.subscribe(destination);
                }
            } catch (e) {
                // console.log('Error caught in the `catch` blog of `catchError` operator function.', err);
                destination.error(e);
            }


            return function () {
                _subscription?.unsubscribe();
                console.log('Unsubscribed from `catchError` observable.');
            }
        });
    }
}

/**
 * Returns an observable that, at the moment of subscription, will synchronously emit all 
 * values provided to this operator, then subscribe to the source and mirror all of its emissions to subscribers.
 * @param  {...any} values 
 * @returns {(source: Observable) => Observable}
 */
export function startWith(...values) {
    return function (source) {
        return new Observable(function (destination) {
            let _subscription;

            try {
                // First emit arguments
                for (const value of values) {
                    destination.next(value);
                }

                // Subscribe to source observable
                _subscription = source.subscribe(destination);
            } catch (e) {
                destination.error(e);
            }

            return function () {
                _subscription?.unsubscribe();
                // console.log('Unsubscribed from `startWith` operator observable.');
            }
        });
    }
}

/**
 * Returns an observable that will emit all values from the source, then synchronously 
 * emit the provided value(s) immediately after the source completes.
 * @param  {...any} values 
 * @returns {(source: Observable) => Observable}
 */
export function endWith(...values) {
    return function (source) {
        return new Observable(function (destination) {
            let _subscription;

            try {
                // Subscribe to source observable
                _subscription = source.subscribe({
                    ...destination,
                    complete() {
                        // After source completes,
                        // emit all provided value arguments
                        for (const value of values) {
                            destination.next(value);
                        }

                        destination.complete();
                    }
                })
            } catch (e) {
                destination.error(e);
            }

            return function () {
                _subscription?.unsubscribe();
                // console.log('Unsubscribed from `endWith` operator observable.');
            }
        });
    }
}