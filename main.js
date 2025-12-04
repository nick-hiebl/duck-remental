const ITEM_RADIUS = 4;

const Game = () => {
    const creatures = [new Creature(400, 300)];

    const items = [{ x: 100, y: 100 }, { x: 550, y: 200 }];

    const draw = (ctx) => {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 800, 600);

        creatures.forEach(creature => creature.draw(ctx));

        ctx.fillStyle = 'black';

        items.forEach(item => ctx.fillRect(item.x - ITEM_RADIUS, item.y - ITEM_RADIUS, ITEM_RADIUS * 2, ITEM_RADIUS * 2));
    };

    const update = (deltaTime, keys) => {
        creatures.forEach(creature => creature.update(deltaTime, items));
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
