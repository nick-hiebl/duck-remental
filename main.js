const ITEM_RADIUS = 4;

const Game = () => {
    const creatures = [new Creature(100, 300), new Creature(200, 300), new Creature(300, 300), new Creature(400, 300)];

    let items = [new Pellet(100, 100), new Pellet(550, 200)];
    let foodTimer = 0;
    let foodRate = 0.2;
    let maxFood = 50;

    const draw = (ctx) => {
        ctx.fillStyle = '#59f';
        ctx.fillRect(0, 0, 800, 600);

        items.forEach(item => item.draw(ctx));

        creatures.forEach(creature => creature.draw(ctx));
    };

    const update = (deltaTime, keys) => {
        creatures.forEach(creature => creature.update(deltaTime, items));

        items = items.filter(item => !item.eaten);

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

    let lastFrameTime = performance.now();

    const keys = {};

    document.addEventListener('keydown', event => {
        keys[event.key] = true;
    });
    document.addEventListener('keyup', event => {
        delete keys[event.key];
    });

    const loop = () => {
        const thisFrameTime = performance.now();
        const elapsedTime = Math.min(MAX_FRAME_DUR, thisFrameTime - lastFrameTime);
        lastFrameTime = thisFrameTime;

        game.update(elapsedTime / 1000, keys);
        game.draw(ctx);

        requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
};

window.onload = () => {
    main();
};
