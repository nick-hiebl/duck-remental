const Game = () => {
    const gameState = {
        unspentPoints: 0,
        newFoodValue: 1,
        foodRate: 2.4,
        foodClusterSize: 1,
        maxFood: 50,
        creatures: [],
    };

    gameState.creatures.push(new Creature(100, 300, gameState));

    window.gameState = gameState;

    const main = document.getElementById('info');

    const gameControlBox = document.getElementById('game-controls');

    const gameUpgrades = GAME_UPGRADES.map(list => {
        return new Upgrade(list, { gameState });
    });
    gameUpgrades.forEach(upgrade => {
        gameControlBox.appendChild(upgrade.button);
    });

    let items = [];
    window.items = items;

    const placeFood = () => {
        const pos = { x: Math.random() * 800, y: Math.random() * 600 };
        for (let i = 0; i < gameState.foodClusterSize; i++) {
            const off = { x: Math.random() * 40 - 20, y: Math.random() * 40 - 20 };
            const spot = v_add(pos, off);
            items.push(new Pellet(spot.x, spot.y, gameState));
        }
    };

    for (let i = 0; i < 20; i++) {
        placeFood();
    }

    let foodTimer = 0;

    const draw = (ctx) => {
        ctx.fillStyle = '#59f';
        ctx.fillRect(0, 0, 800, 600);

        items.forEach(item => item.draw(ctx));
        gameUpgrades.forEach(upgrade => upgrade.draw());

        gameState.creatures.forEach(creature => creature.draw(ctx));

        document.getElementById('crumbs').textContent = gameState.unspentPoints;
    };

    const update = deltaTime => {
        gameState.creatures.forEach(creature => {
            creature.update(deltaTime, items);
            gameState.unspentPoints += creature.score;
            creature.score = 0;
        });

        items = items.filter(item => !item.eaten);
        items.forEach(item => item.update(deltaTime));
        window.items = items;

        foodTimer += deltaTime;

        if (foodTimer >= gameState.foodRate && items.length < gameState.maxFood) {
            placeFood();
            foodTimer = 0;
        }
    };

    return {
        draw,
        update,
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

    requestAnimationFrame(loop);
};

window.onload = () => {
    main();
};

const GAME_UPGRADES = [
    [{ cost: 10, value: 2 }, { cost: 100, value: 3 }, { cost: 500, value: 4 }]
        .map(({ cost, value }) => ({
            text: 'More valuable food',
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
    ]
        .map(({ cost, value }) => ({
            text: 'Throw food faster',
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
        { cost: 1000, value: 15 },
    ]
        .map(({ cost, value }) => ({
            text: 'Bigger handfuls',
            cost,
            upgrade: config => {
                config.gameState.foodClusterSize = value;
            },
        })),
    [
        { cost: 10, value: 70 },
        { cost: 500, value: 100 },
        { cost: 2000, value: 150 },
    ]
        .map(({ cost, value }) => ({
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
    ]
        .map(({ cost }) => ({
            text: 'Another creature',
            cost,
            upgrade: config => {
                config.gameState.creatures.push(new Creature(400, 300, config.gameState));
            },
        })),
];
