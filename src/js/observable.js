/** 
 * Creates an observable object 
 * @example <caption>Create a delayed observable execution, pushing multiple values</caption>
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
 * 
 * @example <caption>Create a delayed observable execution, and pushing a single value every second.</caption>
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
    subscribe({ next, error, complete }) {
        const observer = new Observer(next, error, complete);
        const cleanUpHandler = this.#subscribeFn(observer);
        return new Subscription(() => {
            if (!observer.closed) {
                observer.closed = true;
            }

            cleanUpHandler?.();
        });
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
        childSubscriptions.forEach(subscription => {
            let isSubscriptionInstance = subscription instanceof Subscription;
            let hasUnsubscribeMethod = 'unsubscribe' in subscription && typeof subscription.unsubscribe === 'function';

            if (isSubscriptionInstance || hasUnsubscribeMethod) {
                this.#childSubscriptions.add(subscription);
            }
        });
    }

    /**
     * Removes a child subscription.
     * @param {Subscription} childSubscription 
     */
    remove(childSubscription) {
        this.#childSubscriptions.delete(childSubscription);
    }

    /**
     * Unsubscribe method for canceling an observer and clean up resources. 
     * @returns
     */
    unsubscribe() {
        for (const childSubscription of this.#childSubscriptions) {
            childSubscription.unsubscribe?.();
        }

        this.#childSubscriptions.clear();
        this.#unsubscribe?.();
    }
}

export class Subject {
    #observers = new Set();
    #closed = false;

    constructor() {
        this.next = this.next.bind(this);
        this.error = this.error.bind(this);
        this.complete = this.complete.bind(this);
    }

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
}