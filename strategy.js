const notClaimedIfEnabled = (items, claimingEnabled) => {
    if (!claimingEnabled) {
        return items;
    }

    return items.filter(item => !item.claimed);
};

const DEFAULT_STRATEGY_CONFIG = {
    claimingEnabled: false,
    allowIdealChoice: true,
};

const selectTarget = (
    items,
    existingTarget,
    creaturePosition,
    strategyConfig,
    idealChoice,
) => {
    if (existingTarget) {
        if (existingTarget.eaten) {
            // RAGE QUIT
            // console.log('rage quit');
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

        const BEST_TO_CHOOSE = 3;

        const result = chooseRandom(bestNItems(weights, BEST_TO_CHOOSE));

        if (result) {
            return result.item;
        } else {
            throw Error('Failed to select item');
        }
    }
};
