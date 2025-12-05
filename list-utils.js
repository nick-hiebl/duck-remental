const bestNItems = (list, maxItems) => {
    const l2 = list.slice();
    l2.sort((a, b) => {
        return b.weight - a.weight;
    });

    return l2.slice(0, maxItems);
    return list.reduce((bestList, { weight, item }) => {
        if (bestList.length < maxItems) {
            return bestList.concat({ weight, item });
        }

        if (weight < bestList[maxItems - 1].weight) {
            const newList = bestList.slice(0, maxItems - 1).concat({ weight, item });
            newList.sort((a, b) => a.weight - b.weight);
            console.log(newList);

            return newList;
        }

        return bestList;
    }, []);
};

const chooseRandom = list => {
    return list[Math.floor(Math.random() * list.length)];
};
