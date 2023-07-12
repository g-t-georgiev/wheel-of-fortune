import { Observable, Subscription, merge } from './observable.js';

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
            // console.error('[from] Error caught:', e);
            destination.error(e);
        }
    });
}

// Pipable operators

/**
 * Used to perform side-effects for notifications from the source observable.
 * @param {{ next(v: any): void, error(e: any): void, complete(): void } | (v: any) => void} [subscriberOrNext] 
 * @returns {(source: Observable) => Observable}
 */
export function tap(subscriberOrNext = {}, error, complete) {
    let subscriber = {};
    if (typeof subscriberOrNext === 'function') {
        subscriber.next = subscriberOrNext;
        subscriber.error = () => {};
        subscriber.complete = () => {};
    } else if (
        typeof subscriberOrNext === 'object' && 
        [ 'next', 'error', 'complete' ].some(m => Object.prototype.hasOwnProperty.call(subscriberOrNext, m) && typeof subscriberOrNext[m] === 'function')
    ) {
        subscriber = { ...subscriberOrNext };
    } else if (subscriberOrNext == null) {
        subscriber.next = () => {};
        subscriber.error = () => {};
        subscriber.complete = () => {};
    } else {
        throw new TypeError('[tap] Non subscriber-like passed as argument.');
    }


    return function (source) {
        return new Observable(function (destination) {
            let subscription = null;
            const cleanUpHandler = function () {
                if (subscription && subscription instanceof Subscription) {
                    // console.log('[tap] Unsubscribed from observable.');
                    subscription.unsubscribe();
                }
            };

            try {
                subscription = source.subscribe({
                    ...destination,
                    next(value) {
                        subscriber?.next(value);
                        destination.next(value);
                    },
                    error(e) {
                        subscriber?.error(e);
                        destination.error(e);
                    },
                    complete() {
                        subscriber?.complete();
                        destination.complete();
                    }
                });

            } catch (e) {
                destination.error(e);
            }

            return cleanUpHandler;
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
            let subscription;
            let index;
            const cleanUpHandler = function () {
                if (subscription && subscription instanceof Subscription) {
                    // console.log('[map] Unsubscribed from observable.');
                    subscription.unsubscribe();
                }
            }

            try {
                subscription = source.subscribe({
                    ...destination,
                    next(value) {
                        const mappedValue = project.call(thisArg, value, index++);
                        destination.next(mappedValue);
                    }
                });
            } catch (e) {
                // console.log('[map] Error caught:', e);
                destination.error(e);
            }

            return cleanUpHandler;
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
            let subscription;
            let index = 0;
            const cleanUpHandler = function () {
                if (subscription && subscription instanceof Subscription) {
                    // console.log('[filter] Unsubscribed from observable.');
                    subscription.unsubscribe();
                }
            };

            try {
                subscription = source.subscribe({
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

            return cleanUpHandler;
        });
    }
}

/**
 * Emits only the first `count` values emitted by the source Observable. 
 * Internally unsubscribes from the source observable and completes.
 * @param {number} count 
 * @returns {(source: Observable) => Observable} 
 */
export function take(count) {
    return function (source) {
        return new Observable(function (destination) {
            let emitted = 0;
            let subscription = null;
            const cleanUpHandler = function () {
                if (subscription && subscription instanceof Subscription) {
                    console.log(`[take] Unsubscribed from observable.`);
                    console.log('[take] Count:', count);
                    subscription.unsubscribe();
                }
            };

            try {
                subscription = source.subscribe({
                    ...destination,
                    next(value) {
                        if (destination.closed) {
                            return;
                        }

                        if (count === 0 || emitted >= count) {
                            subscription.unsubscribe();
                            destination.complete();
                            return;
                        }

                        destination.next(value);
                        emitted++;
                    }
                });
            } catch (e) {
                destination.error(e);
            }

            return cleanUpHandler;
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
            let subscription;
            const cleanUpHandler = function () {
                if (subscription && subscription instanceof Subscription) {
                    // console.log('[takeWhile] Unsubscribed from observable.');
                    subscription.unsubscribe();
                }
            };

            try {
                subscription = source.subscribe({
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

            return cleanUpHandler;
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
            let subscription;
            const cleanUpHandler = function () {
                if (subscription && subscription instanceof Subscription) {
                    // console.log('[takeUntil] Unsubscribed from observable.');
                    subscription.unsubscribe();
                }
            };

            try {
                subscription = notifier.subscribe({
                    ...destination,
                    next() {
                        destination.complete();
                    }
                });

                !destination.closed && (subscription.add(source.subscribe(destination)));

            } catch (e) {
                destination.error(e);
            }

            return cleanUpHandler;
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
            let subscription = null;
            const cleanUpHandler = function () {
                if (subscription && subscription instanceof Subscription) {
                    // console.log('[skip] Unsubscribed from observable.');
                    // console.log('[skip] Count:', count);
                    subscription.unsubscribe();
                }
            };

            try {
                subscription = source.subscribe({
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

            return cleanUpHandler;
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
            let subscription = null;
            const cleanUpHandler = function () {
                for (const timerId of timerIds) {
                    globalThis.clearTimeout(timerId);
                }

                if (subscription && subscription instanceof Subscription) {
                    // console.log('[delay] Unsubscribed from observable.');
                    // console.log('[delay] Due:', due);
                    subscription.unsubscribe();
                }
            };

            try {
                subscription = source.subscribe({
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

            return cleanUpHandler;
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
            let subscription = null;
            let handledResult;
            let syncUnsub = false;
            const cleanUpHandler = function () {
                if (subscription && subscription instanceof Subscription) {
                    console.log('[catchError] Unsubscribed from observable.');
                    subscription.unsubscribe();
                }
            };

            try {
                // Subscribe to source observable
                subscription = source.subscribe({
                    ...destination,
                    error(e) {
                        // console.log('[catchError] Destination closed (:411:)', destination.closed);
                        handledResult = selector(e, catchError(selector)(source));

                        if (subscription && subscription instanceof Subscription) {
                            subscription.unsubscribe();
                            subscription = null;
                            subscription = handledResult?.subscribe(destination);
                        } else {
                            syncUnsub = true;
                        }
                    }
                });

                if (syncUnsub) {
                    // console.log('[catchError] Destination closed (:425:)', destination.closed);
                    subscription?.unsubscribe();
                    // console.log('[catchError] Destination closed (:427:)', destination.closed);
                    subscription = null;
                    subscription = handledResult?.subscribe(destination);
                }
            } catch (e) {
                // console.log('[catchError] Error caught:', e);
                destination.error(e);
            }


            return cleanUpHandler;
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
            let subscription = null;
            const cleanUpHandler = function () {
                if (subscription && subscription instanceof Subscription) {
                    // console.log('[startWith] Unsubscribed from observable.');
                    // console.log('[startWith] Values', ...values);
                    subscription.unsubscribe();
                }
            };

            try {
                // First emit arguments
                for (const value of values) {
                    destination.next(value);
                }

                // Subscribe to source observable
                subscription = source.subscribe(destination);
            } catch (e) {
                destination.error(e);
            }

            return cleanUpHandler;
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
            let subscription = null;
            const cleanUpHandler = function () {
                if (subscription && subscription instanceof Subscription) {
                    // console.log('[endWith] Unsubscribed from observable.');
                    // console.log('[endWith] Values:', ...values);
                    subscription.unsubscribe();
                }
            };

            try {
                // Subscribe to source observable
                subscription = source.subscribe({
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

            return cleanUpHandler;
        });
    }
}

/**
 * Converts a higher-order Observable into a first-order Observable which 
 * concurrently delivers all values that are emitted on the inner Observables.
 * @param {number } concurrent 
 * @returns {(source: Observable) => Observable}
 */
export function mergeAll(concurrent = Infinity) {
    return function (higherOrderObservable) {
        return new Observable(function (destination) {
            let closed = false;
            let activeTasks = 0;
            let finishedTasks = 0;
            let totalTasks = 0;
            const tasksQueue = [];
            let subscription = null;
            let timeoutId = null;

            const cleanUpHandler = function () {
                !closed && (closed = true);

                if (subscription) {
                    subscription.unsubscribe();
                    console.log('[mergeAll] Unsubscribed from observable.');
                }
            };

            const doInnerSub = function () {
                while (activeTasks < concurrent) {
                    if (tasksQueue.length === 0) break;

                    activeTasks++;
                    const task = tasksQueue.shift();
                    const taskSub = task.subscribe({
                        ...destination,
                        complete() {
                            activeTasks = Math.max(0, activeTasks - 1);
                            finishedTasks++;

                            if (finishedTasks < totalTasks) {
                                timeoutId && globalThis.clearTimeout(timeoutId);
                                timeoutId = globalThis.setTimeout(doInnerSub, 0);
                                return;
                            }

                            closed && destination.complete();
                        }
                    });
    
                    subscription.add(taskSub);
                }
            };

            try {

                subscription = higherOrderObservable.subscribe({
                    ...destination,
                    next(task) {
                        totalTasks++;
                        tasksQueue.push(task);
                        timeoutId && globalThis.clearTimeout(timeoutId);
                        timeoutId = globalThis.setTimeout(doInnerSub, 0);
                    },
                    complete() {
                        closed = true;
                    }
                });

            } catch (e) {
                destination.error(e);
            }

            return cleanUpHandler;
        });
    }
}