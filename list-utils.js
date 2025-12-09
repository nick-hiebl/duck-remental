const bestNItems = (list, maxItems) => {
    const l2 = list.slice();
    l2.sort((a, b) => {
        return b.weight - a.weight;
    });

    return l2.slice(0, maxItems);
};

const chooseRandom = list => {
    return list[Math.floor(Math.random() * list.length)];
};

const randInt = (low, high) => {
    return Math.floor(Math.random() * (high - low) + low);
};
