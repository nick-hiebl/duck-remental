function scenes(sceneKey) {
    const canvas = document.getElementById('canvas');

    const clearControls = (gameState) => {
        document.getElementById('all-controls').dataset.hidden = true;

        document.body.style.margin = '0';

        const onResize = () => {
            const w = window.innerWidth, h = window.innerHeight;

            gameState.width = w;
            gameState.height = h;

            canvas.width = w;
            canvas.height = h;

            gameState.items = gameState.items.filter(item => item.x <= w && item.y <= h);
        };

        window.addEventListener('resize', onResize);
        onResize();
    };

    if (sceneKey === 'gecko' || sceneKey === 'geckoMore') {
        const gameState = {
            ...constructDefaultGameState(),
            // Scene-specific config
            newFoodValue: 16,
            foodRate: 0.6,
            foodClusterSize: 15,
            multiClusterBase: 1,
            maxFood: 500,
            // Visual/gamemode config
            noUI: true,
        };

        clearControls(gameState);

        gameState.creatures.push(new Gecko(200, 200, gameState));
        gameState.creatures.push(new Gecko(600, 200, gameState));
        gameState.creatures.push(new Gecko(200, 400, gameState));
        gameState.creatures.push(new Gecko(600, 400, gameState));

        if (sceneKey === 'geckoMore') {
            gameState.creatures.push(new Gecko(300, 300, gameState));
            gameState.creatures.push(new Gecko(700, 300, gameState));
            gameState.creatures.push(new Gecko(300, 500, gameState));
            gameState.creatures.push(new Gecko(700, 500, gameState));
        }

        const firstGecko = gameState.creatures[0];
        firstGecko.config.eatingCooldown = 0;

        GECKO_UPGRADES.find(list => list[0].text === 'Faster')[3].upgrade(firstGecko.config);

        return gameState;
    }
}

const constructDefaultGameState = () => {
    const state = {
        // Persistent
        unspentPoints: 0,
        creatures: [],
        upgrades: [], // Will be overridden once we can get a reference to gameState
        // Upgrade-based
        newFoodValue: 1,
        foodRate: 2.4,
        foodClusterSize: 1,
        multiClusterBase: 0,
        maxFood: 50,
        // State
        items: [],
        // Graphical
        timePassed: 0,
        // Visual/gamemode config
        width: 800,
        height: 600,
        noUI: false,
    };

    state.upgrades = GAME_UPGRADES.map(list => {
        return new Upgrade(list, { gameState: state });
    });

    return state;
};

const Game = () => {
    const search = new URLSearchParams(location.search);

    const sceneKey = search.get('scene');

    const gameStateFromScene = scenes(sceneKey);

    const gameState = gameStateFromScene ?? STORAGE_INSTANCE.load();

    window.gameState = gameState;

    const gameControlBox = document.getElementById('game-controls');

    gameState.upgrades.forEach(upgrade => {
        gameControlBox.appendChild(upgrade.button);
    });

    const save = () => {
        if (!gameStateFromScene) {
            STORAGE_INSTANCE.save(gameState);
        }
    };

    const deleteSave = () => {
        STORAGE_INSTANCE.clear();
    };

    document.getElementById('save').addEventListener('click', save);

    document.getElementById('delete').addEventListener('click', deleteSave);

    const placeFood = () => {
        const numBundles = Math.ceil(Math.random() + gameState.multiClusterBase);

        for (let j = 0; j < numBundles; j++) {
            const pos = { x: Math.random() * gameState.width, y: Math.random() * gameState.height };
            const bundleRadius = gameState.foodClusterSize * 5;
            for (let i = 0; i < gameState.foodClusterSize; i++) {
                const off = { x: Math.random() * bundleRadius - bundleRadius / 2, y: Math.random() * bundleRadius - bundleRadius / 2 };
                const spot = v_add(pos, off);
                gameState.items.push(new Pellet(spot.x, spot.y, gameState));
            }
        }
    };

    if (gameState.creatures.length === 0) {
        gameState.creatures.push(new Duck(100, 300, gameState));
    }

    if (gameState.upgrades.every(up => up.progress === 0)) {
        for (let i = 0; i < 20; i++) {
            placeFood();
        }
    }

    let foodTimer = 0;

    const draw = (ctx) => {
        ctx.fillStyle = '#47e';
        ctx.fillRect(0, 0, gameState.width, gameState.height);

        gameState.items.forEach(item => item.draw(ctx));
        gameState.upgrades.forEach(upgrade => upgrade.draw());

        gameState.creatures.forEach(creature => creature.draw(ctx));

        document.getElementById('crumbs').textContent = gameState.unspentPoints;
    };

    const update = deltaTime => {
        gameState.timePassed += deltaTime;
        gameState.creatures.sort((a, b) => {
            return a.config.size - b.config.size;
        });

        gameState.creatures.forEach(creature => {
            creature.update(deltaTime, gameState.items);
            gameState.unspentPoints += creature.score;
            creature.score = 0;
        });

        gameState.items = gameState.items.filter(item => !item.eaten);
        gameState.items.forEach(item => item.update(deltaTime));

        foodTimer += deltaTime;

        if (foodTimer >= gameState.foodRate && gameState.items.length < gameState.maxFood) {
            placeFood();
            foodTimer = 0;
        }
    };

    return {
        draw,
        update,
        save,
        deleteSave,
    };
};

const MAX_FRAME_DUR = 50;

const main = () => {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    const game = Game();
    window.game = game;

    let lastFrameTime = performance.now();

    const loop = () => {
        const thisFrameTime = performance.now();
        const elapsedTime = Math.min(MAX_FRAME_DUR, thisFrameTime - lastFrameTime);
        lastFrameTime = thisFrameTime;

        game.update(elapsedTime / 1000);
        game.draw(ctx);

        requestAnimationFrame(loop);
    };

    setInterval(() => {
        game.save();
    }, 5000);

    requestAnimationFrame(loop);
};

window.onload = () => {
    main();
};

const GAME_UPGRADES = [
    [
        { cost: 10, value: 2 },
        { cost: 100, value: 3 },
        { cost: 500, value: 4 },
        { cost: 2000, value: 5 },
        { cost: 5000, value: 6 },
        { cost: 8000, value: 8 },
        { cost: 10000, value: 10 },
        { cost: 40000, value: 12 },
        { cost: 100000, value: 16 },
    ]
        .map(({ cost, value }) => ({
            id: 'food-value',
            text: 'More valuable food',
            tooltip: 'Individual food items count for multiple',
            cost,
            upgrade: config => {
                config.gameState.newFoodValue = value;
            },
        })),
    [
        { cost: 20, value: 1.9 },
        { cost: 50, value: 1.75 },
        { cost: 100, value: 1.55 },
        { cost: 200, value: 1.4 },
        { cost: 500, value: 1.25 },
        { cost: 1000, value: 1.1 },
        { cost: 1500, value: 1 },
        { cost: 5000, value: 0.9 },
        { cost: 10000, value: 0.8 },
        { cost: 20000, value: 0.7 },
        { cost: 50000, value: 0.63 },
        { cost: 100000, value: 0.6 },
        { cost: 200000, value: 0.55 },
        { cost: 500000, value: 0.52 },
        { cost: 1000000, value: 0.5 },
        { cost: 2000000, value: 0.48 },
        { cost: 5000000, value: 0.45 },
        { cost: 10000000, value: 0.42 },
        { cost: 20000000, value: 0.4 },
    ]
        .map(({ cost, value }) => ({
            id: 'food-speed',
            text: 'Throw food faster',
            tooltip: 'Cooldown between food dropping is reduced',
            cost,
            upgrade: config => {
                config.gameState.foodRate = value;
            },
        })),
    [
        { cost: 10, value: 2 },
        { cost: 30, value: 3 },
        { cost: 80, value: 4 },
        { cost: 120, value: 5 },
        { cost: 200, value: 7 },
        { cost: 400, value: 10 },
        { cost: 800, value: 12 },
        { cost: 1200, value: 14 },
        { cost: 2000, value: 16 },
        { cost: 5000, value: 18 },
        { cost: 10000, value: 20 },
        { cost: 20000, value: 25 },
        { cost: 50000, value: 30 },
    ]
        .map(({ cost, value }) => ({
            id: 'food-group',
            text: 'Bigger handfuls',
            tooltip: 'More food pellets will be dropped per throw',
            cost,
            upgrade: config => {
                config.gameState.foodClusterSize = value;
            },
        })),
    [
        { cost: 50, value: 0.1 },
        { cost: 300, value: 0.4 },
        { cost: 1000, value: 0.6 },
        { cost: 5000, value: 0.8 },
        { cost: 10000, value: 1 },
        { cost: 30000, value: 1.3 },
        { cost: 50000, value: 1.5 },
        { cost: 100000, value: 1.8 },
        { cost: 200000, value: 2 },
        { cost: 500000, value: 2.25 },
        { cost: 1000000, value: 2.5 },
    ]
        .map(({ cost, value }) => ({
            id: 'food-clusters',
            text: 'More handfuls chance',
            tooltip: 'Chance rises for multiple handfuls of food to be thrown at once',
            cost,
            upgrade: config => {
                config.gameState.multiClusterBase = value;
            }
        })),
    [
        { cost: 10, value: 70 },
        { cost: 500, value: 100 },
        { cost: 2000, value: 150 },
        { cost: 5000, value: 200 },
        { cost: 12000, value: 300 },
        { cost: 25000, value: 400 },
        { cost: 50000, value: 500 },
        { cost: 100000, value: 650 },
        { cost: 250000, value: 750 },
        { cost: 500000, value: 1000 },
    ]
        .map(({ cost, value }) => ({
            id: 'food-max',
            text: 'More max food',
            cost,
            upgrade: config => {
                config.gameState.maxFood = value;
            },
        })),
    [
        { cost: 10 },
        { cost: 100 },
        { cost: 1000 },
        { cost: 10000 },
        { cost: 100000 },
        { cost: 1000000 },
        { cost: 10000000 },
        { cost: 100000000 },
    ]
        .map(({ cost }) => ({
            id: 'count-duck',
            text: 'Another duck',
            cost,
            upgrade: config => {
                config.gameState.creatures.push(new Duck(400, 300, config.gameState));
            },
        })),
    [
        { cost: 30 },
        { cost: 300 },
        { cost: 3000 },
        { cost: 30000 },
        { cost: 300000 },
        { cost: 3000000 },
        { cost: 30000000 },
        { cost: 300000000 },
    ]
        .map(({ cost }) => ({
            id: 'count-crab',
            text: 'A crab',
            cost,
            upgrade: config => {
                config.gameState.creatures.push(new Crab(400, 300, config.gameState));
            },
        })),
    [
        { cost: 70 },
        { cost: 700 },
        { cost: 7000 },
        { cost: 70000 },
        { cost: 700000 },
        { cost: 7000000 },
        { cost: 70000000 },
        { cost: 700000000 },
    ]
        .map(({ cost }) => ({
            id: 'count-frog',
            text: 'A frog',
            cost,
            upgrade: config => {
                config.gameState.creatures.push(new Frog(400, 300, config.gameState));
            },
        })),
    [
        { cost: 50 },
        { cost: 500 },
        { cost: 5000 },
        { cost: 50000 },
        { cost: 500000 },
        { cost: 5000000 },
        { cost: 50000000 },
        { cost: 500000000 },
    ]
        .map(({ cost }) => ({
            id: 'count-gecko',
            text: 'A gecko',
            cost,
            upgrade: config => {
                config.gameState.creatures.push(new Gecko(400, 300, config.gameState));
            },
        })),
];
