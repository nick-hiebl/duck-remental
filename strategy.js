const notClaimedIfEnabled = (items, claimingEnabled) => {
    if (!claimingEnabled) {
        return items;
    }

    return items.filter(item => !item.claimed);
};

const DEFAULT_STRATEGY_CONFIG = {
    claimingEnabled: false,
    segmentationSelect: false,
    allowIdealChoice: true,
    bestToChooseFrom: 5,
};

const clamp = (v, lo, hi) => Math.max(lo, Math.min(v, hi));

const chooseViaSegmentation = (gameState, creaturePosition) => {
    let gridScale = 5;

    while (gridScale < 20) {
        const W = gameState.width / gridScale;
        const H = gameState.height / gridScale;
        const bucket = ({ x, y }) => {
            const col = `${clamp(Math.floor(x / W), 0, gridScale - 1)}`;
            const row = `${clamp(Math.floor(y / H), 0, gridScale - 1)}`;

            return `${row}-${col}`;
        };

        const bucketToPoint = bucketKey => {
            const [row, col] = bucketKey.split('-').map(x => parseInt(x, 10));

            return {
                x: (col + 0.5) * W,
                y: (row + 0.5) * H,
            };
        };

        const creatureMap = {};
        const itemMap = {};

        gameState.items.forEach(item => {
            // Only count available items
            if (item.eaten || (item.claimed && gameState.strategyConfig.claimingEnabled)) {
                return;
            }

            const key = bucket(item);
            if (!itemMap[key]) {
                itemMap[key] = [];
            }
            itemMap[key].push(item);
        });
        gameState.creatures.forEach(creature => {
            const key = bucket(creature);
            creatureMap[key] = (creatureMap[key] ?? 0) + 1;
        });

        const buckets = Array.from(Object.keys(itemMap));

        const idealBuckets = buckets
            // Only choose a bucket with NO creatures already present
            .filter(b => !creatureMap[b]);

        if (idealBuckets.length === 0) {
            gridScale++;
            continue;
        }

        const bestBucket = idealBuckets.reduce((prev, currentBucket) => {
            if (!prev) {
                return currentBucket;
            }

            const prevPoint = bucketToPoint(prev);
            const currentPoint = bucketToPoint(currentBucket);

            if (dist(prevPoint, creaturePosition) < dist(currentPoint, creaturePosition)) {
                return prev;
            }

            return currentBucket;
        }, null);

        if (!bestBucket) {
            gridScale++;
            continue;
        }

        // Don't need to filter eaten or claimed items as they were filtered above
        return chooseRandom(itemMap[bestBucket]);
    }

    // If no good candidate return totally random item or null
    return chooseRandom(
        notClaimedIfEnabled(
            gameState.items.filter(item => !item.eaten),
            gameState.strategyConfig.claimingEnabled,
        ),
    ) ?? null;
};

const selectTarget = (
    gameState,
    existingTarget,
    creaturePosition,
    idealChoice,
) => {
    const items = gameState.items;
    const strategyConfig = gameState.strategyConfig;

    if (existingTarget) {
        if (existingTarget.eaten) {
            // RAGE QUIT
            if (strategyConfig.segmentationSelect) {
                return chooseViaSegmentation(gameState, creaturePosition);
            }

            return chooseRandom(
                notClaimedIfEnabled(
                    items.filter(item => !item.eaten),
                    strategyConfig.claimingEnabled,
                ),
            );
        } else {
            return existingTarget;
        }
    }

    const validItems = notClaimedIfEnabled(
        items.filter(item => !item.eaten),
        strategyConfig.claimingEnabled,
    );

    if (validItems.length === 0) {
        return null;
    } else if (validItems.length === 1) {
        return validItems[0];
    } else {
        if (idealChoice && strategyConfig.allowIdealChoice) {
            const bestChoices = validItems.filter(item => idealChoice(item));

            const ideal = chooseRandom(bestChoices);

            if (ideal) {
                return ideal;
            }
        }

        const weights = validItems.map(item => {
            return {
                weight: -dist(creaturePosition, item),
                item,
            };
        });

        const BEST_TO_CHOOSE = strategyConfig.bestToChooseFrom;

        const result = chooseRandom(bestNItems(weights, BEST_TO_CHOOSE));

        if (result) {
            return result.item;
        } else {
            throw Error('Failed to select item');
        }
    }
};
