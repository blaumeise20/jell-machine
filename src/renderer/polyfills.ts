Array.prototype.orderBy = function (fn) {
    return [...this].sort((a, b) => {
        const newA = fn(a);
        const newB = fn(b);
        return newA > newB ? 1 : newB > newA ? -1 : 0;
    });
};

export {};
