export type ConstructorType<T extends abstract new (...args: never) => unknown> = new (
    ...params: ConstructorParameters<T>
) => InstanceType<T>;