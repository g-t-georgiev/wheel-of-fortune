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

            console.log(this.#initialTeardown);
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
    //     console.log('Unsubscribed from `EMPTY` observable.');
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
        //     console.log('Unsubscribed from `throwError` factory method.');
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
        try {
            let int = start;

            if (count < start) {
                throw new RangeError('From `range` observable: Count argument value cannot be less than start argument value.');
            }

            while (int <= count) {
                if (subscriber.closed) break;

                subscriber.next(int);
                int++;
            }

            subscriber.complete();
        } catch (e) {
            subscriber.error(e);
        }

        return function () {
            console.log(`Unsubscribed from 'range' (${start}..${count}) observable.`);
        }
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
        let timerId;
        try {
            const start = Date.now();
            let delay = dueTime instanceof Date ? dueTime - start : dueTime;
            delay = delay < 0 ? 0 : delay;

            let n = 0;

            timerId = globalThis.setTimeout(function handler() {
                console.log(`[timer] Ticking...`);
                !destination.closed && destination.next(n++);
                globalThis.clearTimeout(timerId);
                !repeat && destination.complete();
                repeat && !destination.closed && (timerId = globalThis.setTimeout(handler, delay));
            }, delay);
        } catch (e) {
            destination.error(e);
        }

        return function () {
            globalThis.clearTimeout(timerId);
            console.log(`Unsubscribed from 'timer' with delay ${dueTime}`);
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
        let subscription;
        try {
            if (period < 0) {
                period = 0;
            }

            !destination.closed && (subscription = timer(period, true).subscribe(destination));
        } catch (e) {
            destination.error(e);
        }

        return function () {
            if (subscription) {
                subscription.unsubscribe();
                console.log(`Unsubscribed from 'interval' with delay ${period}.`);
            }
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

/**
 * 
 * @param  {...Observable} sources 
 * @returns {Observable}
 */
export function concat(...sources) {
    let closed = false;
    return new Observable(function (destination) {
        let idx = 0;
        let subscription = new Subscription();

        let subscribeFn = function () {
            if (idx >= sources.length) {
                console.log('All sources completed.');
                destination.complete();
                return;
            }

            console.log(`${idx}/${sources.length}`);

            if (subscription) {
                const source = sources[idx];
                const innerSubscription = source.subscribe({
                    ...destination,
                    complete() {
                        console.log('Source completed.');
                        idx += 1;
                        (!closed || !destination.closed) && queueMicrotask(subscribeFn);
                    }
                });
    
                subscription.add(
                    innerSubscription
                );
            }
        };

        subscribeFn();

        return function () {
            closed = true;

            if (subscription && subscription instanceof Subscription) {
                console.log('Unsubscribed from `concat` observable.');
                subscription.unsubscribe();
                subscription = null;
            }
        }
    });
}