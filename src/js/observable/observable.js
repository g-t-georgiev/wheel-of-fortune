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
     * Creates an observer instance invoking an executor function, 
     * passing the observer as an argument. The return value is 
     * a subscription instance, initialized with a teardown/unsubscribe logic.
     * @param {{ next(v: any): void, error(e: any): void, complete(): void } | (v: any) => void} [subscriberOrNext] 
     * @returns {Subscription}
     */
    subscribe(subscriberOrNext) {
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
            throw new TypeError('[Subject#subscribe]: Non subscriber-like passed as argument.');
        }

        const observer = new Observer(subscriber.next, subscriber.error, subscriber.complete);
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

    async next(value) {
        if (!this.closed) {
            this.#next?.(value);
        }
    }

    async error(error) {
        if (!this.closed) {
            this.#error?.(error);
        }
    }

    async complete() {
        if (!this.closed) {
            this.closed = true;
            this.#complete?.();
        }
    }
}

export class Subscription {
    #closed = false;
    #initialTeardown;

    /**
     * @type Set<Subscription | () => void>
     */
    #actions = new Set();

    get closed() {
        return this.#closed;
    }

    /**
     * Creates a Subscription instance. The 
     * most important method is the `unsubscribe` 
     * method, which invokes the main logic for 
     * unsubscribing from an oberver and closing it.
     * @param {() => void} initialTeardown
     */
    constructor(initialTeardown) {
        this.#initialTeardown = initialTeardown != null && typeof initialTeardown === 'function' ? initialTeardown : null;
    }

    /**
     * Adds a finalizer to this subscription so that finalization will be unsubscribed/called 
     * when this subscription is unsubscribed. If this subscription is already closed, 
     * because it has already been unsubscribed, then whatever finalizer is passed to i
     * t will automatically be executed (unless the finalizer itself is also a closed subscription).
     * @param {...(Subscription | () => void)} teardown 
     * @returns {void}
     */
    add(...teardown) {
        // console.log('Added teardown logic.', ...teardown);
        if (!this.#closed) {
            let isSubscriptionInstance = teardown instanceof Subscription;
            let hasUnsubscribeMethod = 'unsubscribe' in teardown && typeof teardown.unsubscribe === 'function';

            teardown.forEach(member => {
                if (isSubscriptionInstance || 
                    hasUnsubscribeMethod || 
                    typeof teardown === 'function'
                ) {
                    this.#actions.add(member);
                }
            });
        }
    }

    /**
     * Removes a previously added finalizer from this subscription.
     * @param {Subscription | () => void} teardown 
     * @returns {void}
     */
    remove(teardown) {
        if (!this.#closed) {
            this.#actions.delete(teardown);
        }
    }

    /**
     * Unsubscribe method for canceling an observer and clean up resources. 
     * Important to know is that the method is being executed **synchronously**.
     * @returns {void}
     */
    unsubscribe() {
        if (!this.closed) {
            this.#closed = true;

            // console.log('Initial teardown', this.#initialTeardown);
            if (this.#initialTeardown) {
                this.#initialTeardown();
            }

            for (const teardown of this.#actions) {
                let isSubscriptionInstance = teardown instanceof Subscription;
                let hasUnsubscribeMethod = 'unsubscribe' in teardown && typeof teardown.unsubscribe === 'function';
    
                if ((isSubscriptionInstance || hasUnsubscribeMethod)) {
                    teardown.unsubscribe();
                } else {
                    teardown();
                }
            }
    
            this.#actions.size > 0 && this.#actions.clear();
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
     * Creates an observer instance invoking an executor function, 
     * passing the observer as an argument. The return value is 
     * a subscription instance, initialized with a teardown/unsubscribe logic.
     * @param {{ next(v: any): void, error(e: any): void, complete(): void } | (v: any) => void} [subscriberOrNext] 
     * @param {(e: any) => void} [error] 
     * @param {() => void} [complete]  
     * @returns {Subscription}
     */
    subscribe(subscriberOrNext, error, complete) {
        let subscriber = {};
        if (typeof subscriberOrNext === 'function') {
            subscriber.next = subscriberOrNext;
            error && typeof error === 'function' && (subscriber.error = error);
            complete && typeof complete === 'function' && (subscriber.complete = complete);
        } else if (
            typeof subscriberOrNext === 'object' && 
            [ 'next', 'error', 'complete' ].some(m => Object.prototype.hasOwnProperty.call(subscriberOrNext, m) && typeof subscriberOrNext[m] === 'function')
        ) {
            subscriber = { ...subscriberOrNext };
        } else {
            throw new TypeError('[Subject#subscribe]: Non subscriber-like passed as argument.');
        }

        const observer = new Observer(subscriber.next, subscriber.error, subscriber.complete);
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

    async next(value) {
        if (this.closed) return;

        for (const observer of this.observers) {
            if (!observer.closed) {
                observer.next(value);
            }
        }
    }

    async error(error) {
        if (this.closed) return;

        for (const observer of this.observers) {
            if (!observer.closed) {
                observer.error(error);
            }
        }
    }

    async complete() {
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

    // return function () {
    //     console.log('[EMPTY] Unsubscribed from observable.');
    // }
});

/**
 * Creates an observable that will create an error instance and push it to the consumer as an error immediately upon subscription.
 * @param {() => any} errorFactory 
 * @returns {Observable} 
 * 
 * @example
 * **Create a simple observable that will emit a new error with a timestamp**
 * 
 * ```
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
 * ```
 */
export function throwError(errorFactory) {
    return new Observable(function (destination) {
        try {
            const errorInstance = errorFactory();
            destination.error(errorInstance);
        } catch (e) {
            destination.error(e);
        }

        // return function () {
        //     console.log('[throwError] Unsubscribed from observable.');
        // }
    });
}

/**
 * Creates an Observable that emits a sequence of numbers within a specified range.
 * @param {number} start First integer value from the sequence.
 * @param {number} count Count of integer values to generate.
 */
export function range(start, count) {
    return new Observable(function (subscriber) {
        let closed = false;

        const cleanUpHandler = function () {
            closed = true;
            console.log(`[range] Unsubscribed from observable.`);
            console.log(`[range] (${start}..${count})`);
        };

        try {
            let int = start;

            if (count < start) {
                throw new RangeError('[range] Error: Count cannot be less than start value.');
            }

            while (int <= count) {
                if (subscriber.closed || closed) break;

                subscriber.next(int);
                int++;
            }

            subscriber.complete();
        } catch (e) {
            subscriber.error(e);
        }

        return cleanUpHandler;
    });
}

/**
 * Creates an observable that will wait for a specified time period, or exact date, before emitting the number 0.
 * @param {number | Date} dueTime 
 * @param {boolean} [repeat]
 * @returns {Observable}
 */
export function timer(dueTime, repeat = false) {
    return new Observable(function (destination) {
        let timerId = null;
        let closed = false;

        const cleanUpHandler = function () {
            closed = true;
            globalThis.clearTimeout(timerId);
            console.log(`[timer] Unsubscribed from observable.`);
            console.log(`[timer] Delay: ${dueTime}.`);
        };

        try {
            const start = Date.now();
            let delay = dueTime instanceof Date ? dueTime - start : dueTime;
            delay = delay < 0 ? 0 : delay;

            let n = 0;

            const timerHandler = function handler() {
                globalThis.clearTimeout(timerId);

                if (closed || destination.closed) {
                    // console.log('[timer] Exiting..');
                    return;
                }

                // console.log('[timer] Thicking..');
                destination.next(n++);

                if (!repeat) {
                    cleanUpHandler();
                    destination.complete();
                    return;
                }
                
                timerId = globalThis.setTimeout(handler, delay);
            };

            timerId = globalThis.setTimeout(timerHandler, delay);
        } catch (e) {
            destination.error(e);
            // cleanUpHandler();
        }

        return cleanUpHandler;
    });
}

/**
 * Creates an Observable that emits sequential numbers every specified interval of time.
 * @param {number} period 
 * @returns {Observable}
 */
export function interval(period = 0) {
    return new Observable(function (destination) {
        let subscription = null;
        let closed = false;
        let repeat = true;

        const cleanUpHandler = function () {
            if (subscription) {
                closed = true;
                subscription.unsubscribe();
                console.log(`[interval] Unsubscribed from observable.`);
                console.log(`[interval] Delay: ${period}.`);
            }
        };

        try {
            if (period < 0) {
                period = 0;
            }

            if (!closed || !destination.closed) {
                subscription = timer(period, repeat).subscribe(destination);
            }
            
            
        } catch (e) {
            destination.error(e);
            // cleanUpHandler();
        }

        return cleanUpHandler;
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
        const cleanUpHandler = function () {
            target.removeEventListener(eventName, handleEvent);
            // console.log('[fromEvent] Unsubscribed from observable.');
        };

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
                throw new Error('[fromEvent] Error: `target` does not implement add/remove event listener functionality.');
            }

            target.addEventListener(eventName, handleEvent, options);
        } catch (e) {
            destination.error(e);
        }

        return cleanUpHandler;
    });
}

/**
 * Creates an output Observable which sequentially emits all values from the 
 * first given Observable and then moves on to the next.
 * @param  {...Observable} sources 
 * @returns {Observable}
 */
export function concat(...sources) {
    return new Observable(function (destination) {
        let closed = false;
        let idx = 0;
        let timerId = null;
        let subscription = null;

        const cleanUpHandler = function () {
            closed = true;
            globalThis.clearTimeout(timerId);

            if (subscription && subscription instanceof Subscription) {
                console.log('[concat] Unsubscribed from observable.');
                subscription.unsubscribe();
            }
        };

        let subscribeNext = function () {
            if (subscription) {
                subscription.unsubscribe();
            }

            if (idx >= sources.length) {
                console.log('[concat] All sources completed.');
                destination.complete();
                return;
            }
            

            console.log(`${idx}/${sources.length}`);

            const source = sources[idx];
            subscription = source.subscribe({
                ...destination,
                complete() {
                    if (closed) return;

                    console.log('[concat] Source completed.');
                    idx += 1;
                    if (!destination.closed) {
                        timerId && globalThis.clearTimeout(timerId);
                        timerId = globalThis.setTimeout(subscribeNext, 0);
                    } 
                }
            });
        };

        try {
            subscribeNext();
        } catch (e) {
            destination.error(e);
            console.error('[concat] Error caught', e);
            // cleanUpHandler();
        }

        return cleanUpHandler;
    });
}

/**
 * Creates an output Observable which concurrently emits all values from every given input Observable.
 * @param  {...Observable} sources
 * @returns {Observable}
 */
export function merge(...sources) {
    return new Observable(function (destination) {
        let closed = false;
        let activeTasks = 0;
        let finishedTasks = 0;
        let totalTasks = 0;
        let timeoutId = null;
        let concurrentTasks = typeof sources[sources.length - 1] === 'number' ? sources.pop() : sources.length;
        totalTasks = sources.length;
        const tasksQueue = [ ...sources ];
        const subscription = new Subscription();

        const cleanUpHandler = function () {
            !closed && (closed = true);
            timeoutId && globalThis.clearTimeout(timeoutId);
            
            if (subscription) {
                console.log('[merge] Unsubscribed from observable.');
                subscription.unsubscribe();
            }
        };

        const subscribeNext = function () {
            if (closed || destination.closed) return;

            while (activeTasks < concurrentTasks) {
                if (tasksQueue.length === 0) break;

                activeTasks++;
                const source = tasksQueue.shift();
                const taskSub = source.subscribe({
                    ...destination,
                    complete() {
                        activeTasks = Math.max(0, activeTasks - 1);
                        finishedTasks++;

                        if (finishedTasks < totalTasks) {
                            timeoutId && globalThis.clearTimeout(timeoutId);
                            timeoutId = globalThis.setTimeout(subscribeNext, 0);
                            return;
                        }

                        closed = true;
                        destination.complete();
                    }
                });

                subscription.add(taskSub);
            }
        };

        if (sources.length === 0) {
            destination.complete();
            return cleanUpHandler;
        }

        try {
            subscribeNext(sources);
        } catch (e) {
            destination.error(e);
            console.error('[merge] Error caught', e);
            // cleanUpHandler();
        }

        return cleanUpHandler;
    });
}