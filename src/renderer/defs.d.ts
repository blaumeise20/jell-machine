declare interface Array<T> {
    orderBy(fn: (element: T) => any): T[];
}
