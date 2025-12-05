const Game = () => {
    const gameState = {
        unspentPoints: 0,
    };

    const creatures = [
        new Creature(100, 300, gameState),
    ];
    window.creatures = creatures;
    window.gameState = gameState;

    const main = document.getElementById('info');

    let items = [new Pellet(100, 100), new Pellet(550, 200)];
    window.items = items;

    let foodTimer = 0;
    let foodRate = 0.2;
    let maxFood = 50;

    const draw = (ctx) => {
        ctx.fillStyle = '#59f';
        ctx.fillRect(0, 0, 800, 600);

        items.forEach(item => item.draw(ctx));

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

        if (foodTimer >= foodRate && items.length < maxFood) {
            items.push(new Pellet(Math.random() * 800, Math.random() * 600));
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
