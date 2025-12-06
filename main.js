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
    [
        {
            text: 'Double food',
            cost: 10,
            upgrade: config => {
                config.gameState.newFoodValue = 2;
            },
        },
        {
            text: 'Triple food',
            cost: 100,
            upgrade: config => {
                config.gameState.newFoodValue = 3;
            },
        },
        {
            text: 'Quadruple food',
            cost: 500,
            upgrade: config => {
                config.gameState.newFoodValue = 4;
            },
        },
    ],
    [
        {
            text: 'Faster food',
            cost: 20,
            upgrade: config => {
                config.gameState.foodRate = 1.9;
            },
        },
        {
            text: 'Faster food',
            cost: 50,
            upgrade: config => {
                config.gameState.foodRate = 1.75;
            },
        },
        {
            text: 'Faster food',
            cost: 100,
            upgrade: config => {
                config.gameState.foodRate = 1.55;
            },
        },
        {
            text: 'Faster food',
            cost: 200,
            upgrade: config => {
                config.gameState.foodRate = 1.4;
            },
        },
        {
            text: 'Faster food',
            cost: 500,
            upgrade: config => {
                config.gameState.foodRate = 1.25;
            },
        },
        {
            text: 'Faster food',
            cost: 1000,
            upgrade: config => {
                config.gameState.foodRate = 1.1;
            },
        },
        {
            text: 'Faster food',
            cost: 1500,
            upgrade: config => {
                config.gameState.foodRate = 1;
            },
        },
    ],
    [
        {
            text: 'Bigger handfuls',
            cost: 10,
            upgrade: config => {
                config.gameState.foodClusterSize = 2;
            },
        },
        {
            text: 'Bigger handfuls',
            cost: 30,
            upgrade: config => {
                config.gameState.foodClusterSize = 3;
            },
        },
        {
            text: 'Bigger handfuls',
            cost: 80,
            upgrade: config => {
                config.gameState.foodClusterSize = 4;
            },
        },
        {
            text: 'Bigger handfuls',
            cost: 120,
            upgrade: config => {
                config.gameState.foodClusterSize = 5;
            },
        },
        {
            text: 'Bigger handfuls',
            cost: 200,
            upgrade: config => {
                config.gameState.foodClusterSize = 7;
            },
        },
        {
            text: 'Bigger handfuls',
            cost: 400,
            upgrade: config => {
                config.gameState.foodClusterSize = 10;
            },
        },
        {
            text: 'Bigger handfuls',
            cost: 1000,
            upgrade: config => {
                config.gameState.foodClusterSize = 15;
            },
        },
    ],
    [
        {
            text: 'More food capacity',
            cost: 10,
            upgrade: config => {
                config.gameState.maxFood = 70;
            },
        },
        {
            text: 'Even more food',
            cost: 500,
            upgrade: config => {
                config.gameState.maxFood = 100;
            },
        },
        {
            text: 'Lots of space for food',
            cost: 2000,
            upgrade: config => {
                config.gameState.maxFood = 150;
            },
        },
    ],
    [
        {
            text: 'A second creature',
            cost: 10,
            upgrade: config => {
                config.gameState.creatures.push(new Creature(400, 300, config.gameState));
            },
        },
        {
            text: 'A third creature',
            cost: 100,
            upgrade: config => {
                config.gameState.creatures.push(new Creature(400, 300, config.gameState));
            },
        },
        {
            text: 'A fourth creature',
            cost: 1000,
            upgrade: config => {
                config.gameState.creatures.push(new Creature(400, 300, config.gameState));
            },
        },
    ],
];
