export const startPolling = (
    callback,
    interval,
) => {
    return setInterval(() => {
        callback();
    }, interval);
};

export const stopPolling = intervalRef => {
    if (intervalRef) {
        clearInterval(intervalRef);
    }
};