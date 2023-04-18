declare interface Array<T> {
    orderBy(fn: (element: T) => any): T[];
}

declare module "*?blob" {
    const blob: Blob;
    export default blob;
}
