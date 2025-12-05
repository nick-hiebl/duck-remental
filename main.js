const Game = () => {
    const gameState = {
        unspentPoints: 0,
        newFoodValue: 1,
        foodRate: 0.2,
        maxFood: 50,
    };

    const creatures = [
        new Creature(100, 300, gameState),
    ];
    window.creatures = creatures;
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

    let foodTimer = 0;

    const draw = (ctx) => {
        ctx.fillStyle = '#59f';
        ctx.fillRect(0, 0, 800, 600);

        items.forEach(item => item.draw(ctx));
        gameUpgrades.forEach(upgrade => upgrade.draw());

        creatures.forEach(creature => creature.draw(ctx));

        document.getElementById('crumbs').textContent = gameState.unspentPoints;
    };

    const update = deltaTime => {
        creatures.forEach(creature => {
            creature.update(deltaTime, items);
            gameState.unspentPoints += creature.score;
            creature.score = 0;
        });

        items = items.filter(item => !item.eaten);
        window.items = items;

        foodTimer += deltaTime;

        if (foodTimer >= gameState.foodRate && items.length < gameState.maxFood) {
            items.push(new Pellet(Math.random() * 800, Math.random() * 600, gameState));
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
                config.gameState.foodRate = 0.15;
            },
        },
        {
            text: 'Even faster food',
            cost: 500,
            upgrade: config => {
                config.gameState.foodRate = 0.1;
            },
        },
        {
            text: 'Better food rate',
            cost: 2000,
            upgrade: config => {
                config.gameState.foodRate = 0.05;
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
];
