// @ts-ignore
export function diff(obj1, obj2) {
    return Object.keys(obj2)
        .filter(key => obj1[key] !== obj2[key])
        .reduce((res, key) => {
            // @ts-ignore
            res[key] = obj2[key];
            return res;
        }, {})
}