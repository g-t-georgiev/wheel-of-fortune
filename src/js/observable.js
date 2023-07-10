/** 
 * Creates an observable object 
 * @example
 * **Create a delayed observable execution, pushing multiple values**
 * 
 * ```
 * const observable1 = new Observable(function (subscriber) {
 *   // Async observable execution
 *   const timeoutId = setTimeout(() => {
 *      // Push multiple values to consumers
 *      subscriber.next('HTTP response data');
 *      subscriber.next('HTTP response data');
 *      subscriber.next('HTTP response data');
 *      subscriber.next('HTTP response data');
 *      // Close observer for receiving values
 *      subscriber.complete();
 *      // Receiving values is ignored
 *      subscriber.next('Should not be displayed.');
 *      subscriber.next('Should not be displayed.');
 *      subscriber.next('Should not be displayed.');
 *      subscriber.next('Should not be displayed.');
 *   }, 1000);
 *   
 *   // Clean-up on observable sources
 *   return function () {
 *       clearTimeout(timeoutId);
 *       console.log('Observable execution canceled');
 *   };
 * });
 *
 * const subscription1 = observable1.subscribe({
 *    next: data => console.log('Received data:', data),
 *    error: error => console.error('Error:', error),
 *    complete: () => console.log('Request complete')
 * });
 *
 * let t1 = setTimeout(function () {
 *    clearTimeout(t1);
 *    // Unsubscribe from observer
 *    subscription1.unsubscribe();
 * }, 500);
 * ```
 * 
 * @example
 * **Create a delayed observable execution, and pushing a single value every second**
 * 
 * ```
 * const observable2 = new Observable(function (subscriber) {
 * let i = 1;
 * const intervalId = setInterval(() => {
 *    subscriber.next(i++);
 * }, 1000);
 * 
 * return function () {
 *    clearInterval(intervalId);
 *    console.log('Interval execution was canceled.');
 * }
 * });
 * 
 * const subscription2 = observable2.subscribe({
 *    next: (data) => console.log('Timer#1:', data)
 * });
 * 
 * const subscription3 = observable2.subscribe({
 *    next: (data) => console.log('Timer#2:', data)
 * });
 * 
 * // Put together multiple subscriptions
 * subscription2.add(subscription3);
 * 
 * let t2 = setTimeout(function () {
 *    clearTimeout(t2);
 *    // Unsubcribe from observer
 *    subscription2.unsubscribe();
 * }, 11e3);
 * ```
 */
export class Observable {
    /**
     * An executor function passed to the Observable constructor,
     * internally passing Observer instance and introducing the  
     * logic for linking the source with the subscriber.
     * @param {Observer} subscriber 
     * @returns {function (): void}
     */
    #subscribeFn = function (subscriber) { return function () { } };

    /**
     * Creates an Observable instance taking as argument 
     * an executor function internally passing Observer instance 
     * and introducing the logic for linking the source with the subscriber.
     * @constructor
     * @param {(subscriber: Observer) => function(): void} subscribeFn 
     */
    constructor(subscribeFn) {
        this.#subscribeFn = subscribeFn;
    }

    /**
     * Creates an Observer instance invoking the executor function and 
     * passing the Observer instance as argument. The return value is 
     * a Subscription instance holding the unsubscribing logic from the 
     * Observer. The relationship is 1 observer : 1 subscription.
     * @param {object} subscriber
     * @param {(value: any) => void} subscriber.next 
     * @param {(error: any) => void} subscriber.error 
     * @param {() => void} subscriber.complete 
     * @returns {Subscription}
     */
    subscribe({ next, error, complete } = {}) {
        const observer = new Observer(next, error, complete);
        const cleanUpHandler = this.#subscribeFn(observer);
        return new Subscription(() => {
            if (!observer.closed) {
                observer.closed = true;
            }

            cleanUpHandler?.();
        });
    }

    /**
     * Takes a set of functions, each receiving a value, 
     * passsing the result to the next one. Returns an Observable.
     * @param  {...((source: Observable) => Observable)} fns 
     * @returns {Observable}
     */
    pipe(...fns) {
        return fns.reduce((source, fn) => fn(source), this);
    }
}

export class Observer {
    #next;
    #error;
    #complete;
    #closed = false;

    /**
     * Creates an Observer instance.
     * @param {(value: any) => void} next 
     * @param {(error: any) => void} [error] 
     * @param {() => void} [complete] 
     * @returns {Observer}
     */
    constructor(next, error, complete) {
        this.#next = next != null && typeof next === 'function' ? next : null;
        this.#error = error != null && typeof error === 'function' ? error : null;
        this.#complete = complete != null && typeof complete === 'function' ? complete : null;
        this.next = this.next.bind(this);
        this.error = this.error.bind(this);
        this.complete = this.complete.bind(this);
    }

    get closed() {
        return this.#closed;
    }

    set closed(value) {
        this.#closed = value;
    }

    next(value) {
        if (!this.closed) {
            this.#next?.(value);
        }
    }

    error(error) {
        if (!this.closed) {
            this.#error?.(error);
        }
    }

    complete() {
        if (!this.closed) {
            this.closed = true;
            this.#complete?.();
        }
    }
}

export class Subscription {
    #closed = false;
    #unsubscribe;
    #childSubscriptions = new Set();

    /**
     * Creates a Subscription instance. The 
     * most important method is the `unsubscribe` 
     * method, which invokes the main logic for 
     * unsubscribing from an oberver and closing it.
     * @param {() => void} unsubscribeHandler 
     */
    constructor(unsubscribeHandler) {
        this.#unsubscribe = unsubscribeHandler != null && typeof unsubscribeHandler === 'function' ? unsubscribeHandler : null;
    }

    /**
     * Puts multiple subscriptions together. So,
     * when parent subscription is unsubscribed, all 
     * child subscriptions are unsubscribed as well.
     * @param {...Subscription} childSubscriptions  
     */
    add(...childSubscriptions) {
        if (!this.#closed) {
            childSubscriptions.forEach(subscription => {
                let isSubscriptionInstance = subscription instanceof Subscription;
                let hasUnsubscribeMethod = 'unsubscribe' in subscription && typeof subscription.unsubscribe === 'function';

                if (isSubscriptionInstance || hasUnsubscribeMethod) {
                    this.#childSubscriptions.add(subscription);
                }
            });
        }
    }

    /**
     * Removes a child subscription.
     * @param {Subscription} childSubscription 
     */
    remove(childSubscription) {
        if (!this.#closed) {
            this.#childSubscriptions.delete(childSubscription);
        }
    }

    /**
     * Unsubscribe method for canceling an observer and clean up resources. 
     * @returns
     */
    unsubscribe() {
        if (!this.closed) {
            this.#closed = true;

            for (const childSubscription of this.#childSubscriptions) {
                childSubscription.unsubscribe?.();
            }

            this.#childSubscriptions.clear();
            this.#unsubscribe?.();
        }
    }
}

export class Subject {
    #observers = new Set();
    #closed = false;

    /**
     * Creates a Subject instance.
     */
    constructor() {
        this.next = this.next.bind(this);
        this.error = this.error.bind(this);
        this.complete = this.complete.bind(this);
    }

    /**
     * Creates an Observer instance invoking the executor function and 
     * passing the Observer instance as argument. The return value is 
     * a Subscription instance holding the unsubscribing logic from the 
     * Observer. The relationship is many observers : 1 subject.
     * @param {object} subscriber
     * @param {(value: any) => void} subscriber.next 
     * @param {(error: any) => void} subscriber.error 
     * @param {() => void} subscriber.complete 
     * @returns {Subscription}
     */
    subscribe({ next, error, complete }) {
        const observer = new Observer(next, error, complete);
        this.#observers.add(observer);
        return new Subscription(() => {
            this.#observers.delete(observer);
        });
    }

    get closed() {
        return this.#closed;
    }

    set closed(value) {
        this.#closed = value;
    }

    get observers() {
        return this.#observers;
    }

    next(value) {
        if (this.closed) return;

        for (const observer of this.observers) {
            if (!observer.closed) {
                observer.next(value);
            }
        }
    }

    error(error) {
        if (this.closed) return;

        for (const observer of this.observers) {
            if (!observer.closed) {
                observer.error(error);
            }
        }
    }

    complete() {
        if (this.closed) return;
        this.closed = true;

        for (const observer of this.observers) {
            if (!observer.closed) {
                observer.complete();
            }
        }
    }

    /**
     * Returns an observable only output from the subject.
     * @returns {Observable}
     * @example
     * **Convert a Subject into Observable**
     * 
     * ```
     * const subject = new Subject();
     * const subject$ = subject.asObservable();
     * 
     * subject$.subscribe({
     *    next(value) {
     *       console.log('Observer 1', value);
     *    }
     * });
     * 
     * const subscription2 = subject$.subscribe({
     *    next(value) {
     *       console.log('Observer 2', value);
     *    }
     * });
     * 
     * subject.next(1);
     * subject.next(2);
     * subject.next(3);
     * 
     * subscription2.unsubscribe();
     * 
     * subject.next(4);
     * ```
     */
    asObservable() {
        const _subject = this;
        return new Observable(function (subscriber) {
            let _subscription;

            try {
                _subscription = _subject.subscribe({
                    next(value) {
                        subscriber.next(value);
                    },
                    error(e) {
                        subscriber.error(e);
                    },
                    complete() {
                        subscriber.complete();
                    }
                });
            } catch (e) {
                subscriber.error(e);
            }

            return function () {
                _subscription.unsubscribe?.();
                // console.log('Unsubscribed from subject');
            }
        });
    }
}

/**
 * Obserbable that immediately emits a complete action 
 * when subscribed to.
 */
export const EMPTY = new Observable(function (subscriber) {
    subscriber.complete();
});

/**
 * Creates an observable that will create an error instance and push it to the consumer as an error immediately upon subscription.
 * @param {() => any} errorFactory 
 * @returns {Observable} 
 * 
 * @example <caption>Create a simple observable that will emit a new error with a timestamp.</caption>
 * let errorCount = 0;
 * 
 * const errorWithTimestamp$ = throwError(() => {
 *    const error = new Error(`This is error number ${++errorCount}`);
 *    error.timestamp = Date.now();
 *    return error;
 * });
 * 
 * errorWithTimestamp$.subscribe({
 *    error: err => console.log(err.timestamp, err.message)
 * });
 *    
 * errorWithTimestamp$.subscribe({
 *    error: err => console.log(err.timestamp, err.message)
 * });
 */
export function throwError(errorFactory) {
    return new Observable(function (destination) {
        try {
            const errorInstance = errorFactory();
            destination.error(errorInstance);
        } catch (e) {
            destination.error(e);
        }

        return function () {
            // console.log('Unsubscribed from `throwError` factory method.');
        }
    });
}

/**
 * Creates an observable that will wait for a specified time period, or exact date, before emitting the number 0.
 * @param {number | Date} dueTime 
 * @returns {Observable}
 */
export function timer(dueTime) {
    return new Observable(function (destination) {
        let timerId;
        try {
            const start = Date.now();
            let delay = dueTime instanceof Date ? dueTime - start : dueTime;
            delay = delay <= 0 ? 0 : delay;
    
            timerId = globalThis.setTimeout(() => {
                destination.next(0);
                globalThis.clearTimeout(timerId);
            }, delay);
        } catch (e) {
            destination.error(e);
        }

        return function () {
            globalThis.clearTimeout(timerId);
            // console.log('Unsubscribe from `timer` observable.');
        }
    });
}

/**
 * Creates an Observable that emits sequential numbers every specified interval of time.
 * @param {number} period 
 * @returns {Observable}
 */
export function interval(period = 0) {
    return new Observable(function (destination) {
        let intervalId;
        try {
            let integer = 0;

            intervalId = globalThis.setInterval(function () {
                destination.next(integer++);
            }, period);
        } catch (e) {
            destination.error(e);
        }

        return function () {
            globalThis.clearInterval(intervalId);
            // console.log('Unsubscribed from `interval` observable.');
        }
    });
}

/**
 * Creates an Observable that emits events of a specific type coming from the given event target.
 * @param {EventTarget | HTMLElement | HTMLCollection | NodeList} target 
 * @param {string} eventName 
 * @param {EventListenerOptions | boolean} options 
 * @returns 
 */
export function fromEvent(target, eventName, options) {
    return new Observable(function (destination) {
        const handleEvent = function (ev) {
            destination.next(ev);

            if (options && typeof options === 'object' && options.once) {
                destination.complete();
            }
        }

        try {
            if (!(
                'addEventListener' in target && 
                'removeEventListener' in target
            )) {
                throw new Error('The provided `target` interface does implement add/remove event listener functionality.');
            }

            target.addEventListener(eventName, handleEvent, options);
        } catch (e) {
            destination.error(e);
        }

        return function () {
            target.removeEventListener(eventName, handleEvent);
            // console.log('Unsubscribed from `fromEvent` observable.');
        }
    });
}

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