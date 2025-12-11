{
    const _saveShape = {
        saveDataVersion: 'string',
        unspentPoints: 0,
        creatures: [
            { type: 'gecko', hue: 0, saturation: 0, lightness: 0, hueShiftSign: 0 },
            { type: 'crab', hue: 0, saturation: 0, lightness: 0 },
            { type: 'duck', beakColor: '', headColor: '', bodyColor: '' },
            { type: 'frog', color: '' },
        ],
        upgrades: [
            { type: 'game', id: 'fast', level: 0 },
            { type: 'gecko', id: 'fast', level: 0 },
            { type: 'crab', id: 'fast', level: 0 },
            { type: 'duck', id: 'fast', level: 0 },
            { type: 'frog', id: 'fast', level: 0 },
        ],
    };
}

class Storage {
    static LS_KEY = 'duck-remental-save';

    constructor() {
    }

    save(gameState) {
        const data = {
            saveDataVersion: '0.1.0',
        };

        data.unspentPoints = gameState.unspentPoints;

        data.upgrades = [];

        const addUpgrades = type => upgrade => {
            data.upgrades.push({ type, id: upgrade.id, level: upgrade.progress });
        };

        gameState.upgrades.forEach(addUpgrades('game'));
        if (GeckoConfig.instance) {
            GeckoConfig.get(gameState).upgrades.forEach(addUpgrades('gecko'));
        }
        if (CrabConfig.instance) {
            CrabConfig.get(gameState).upgrades.forEach(addUpgrades('crab'));
        }
        if (DuckConfig.instance) {
            DuckConfig.get(gameState).upgrades.forEach(addUpgrades('duck'));
        }
        if (FrogConfig.instance) {
            FrogConfig.get(gameState).upgrades.forEach(addUpgrades('frog'));
        }

        data.creatures = gameState.creatures.map(creature => {
            if (creature instanceof Gecko) {
                return {
                    type: 'gecko',
                    hue: creature.hue,
                    saturation: creature.saturation,
                    lightness: creature.lightness,
                    hueShiftSign: creature.hueShiftSign,
                };
            } else if (creature instanceof Crab) {
                return {
                    type: 'crab',
                    hue: creature.hue,
                    saturation: creature.saturation,
                    lightness: creature.lightness,
                };
            } else if (creature instanceof Duck) {
                return {
                    type: 'duck',
                    beakColor: creature.beakColor,
                    headColor: creature.headColor,
                    bodyColor: creature.bodyColor,
                };
            } else if (creature instanceof Frog) {
                return {
                    type: 'frog',
                    color: creature.color,
                };
            }

            return null;
        }).filter(x => x);

        localStorage.setItem(Storage.LS_KEY, JSON.stringify(data));
    }
    
    fromSave(saveData) {
        const gameState = constructDefaultGameState();

        if (!saveData) {
            return gameState;
        }

        gameState.unspentPoints = saveData.unspentPoints ?? 0;

        const setUpgrade = (config, upgradeData) => {
            const upgrade = config.upgrades.find(up => up.id === upgradeData.id);

            if (upgrade) {
                upgrade.setLevel(upgradeData.level);
            }
        };

        saveData.upgrades?.forEach(upgradeData => {
            if (upgradeData.type === 'game') {
                const upgrade = gameState.upgrades.find(up => up.id === upgradeData.id);

                if (upgrade) {
                    upgrade.setLevel(upgradeData.level);
                }
            } else if (upgradeData.type === 'gecko') {
                setUpgrade(GeckoConfig.get(gameState), upgradeData);
            } else if (upgradeData.type === 'crab') {
                setUpgrade(CrabConfig.get(gameState), upgradeData);
            } else if (upgradeData.type === 'duck') {
                setUpgrade(DuckConfig.get(gameState), upgradeData);
            } else if (upgradeData.type === 'frog') {
                setUpgrade(FrogConfig.get(gameState), upgradeData);
            }
        });

        gameState.creatures = [];

        // Loading creatures AFTER upgrades as upgrades may create creatures which we don't want to keep
        saveData.creatures?.forEach((creatureData, index) => {
            const ClassName = {
                gecko: Gecko,
                crab: Crab,
                duck: Duck,
                frog: Frog,
            }[creatureData.type];

            if (!ClassName) {
                return;
            }

            const randomX = Math.random() * 600 + 100;
            const randomY = Math.random() * 400 + 100;

            gameState.creatures.push(
                new ClassName(randomX, randomY, gameState, creatureData),
            );
        });

        return gameState;
    }

    load() {
        const data = JSON.parse(localStorage.getItem(Storage.LS_KEY));

        return this.fromSave(data);        
    }

    clear() {
        localStorage.removeItem(Storage.LS_KEY);
    }
}

const STORAGE_INSTANCE = new Storage();
