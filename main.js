const PLAYER_SPEED = 300;
const Y_ACCEL = 0.8;

const Game = () => {
    const player = new Actor(100, 100, 30, 40);
    player.yVel = 0;

    const solids = [{ x: 20, y: 500, width: 640, height: 2 }];

    const draw = (ctx) => {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 800, 600);

        ctx.fillStyle = '#0f0';

        ctx.beginPath();
        ctx.ellipse(player.x + player.width / 2, player.y + player.height / 2, player.width / 2, player.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'black';

        solids.forEach(solid => ctx.fillRect(solid.x, solid.y, solid.width, solid.height));
    };

    const update = (deltaTime, keys) => {
        const xMove = (keys['a'] ? -1 : 0) + (keys['d'] ? 1 : 0);

        if (xMove !== 0) {
            player.moveX(xMove * PLAYER_SPEED * deltaTime, solids);
        }

        const grounding = getGroundingRect(player);

        if (solids.some(solid => overlaps(grounding, solid))) {
            player.yVel = 0;
        } else {
            const prevY = player.y;
            player.yVel += Y_ACCEL * deltaTime;
            player.moveY(player.yVel, solids);
            console.log(player.yVel, player.y, player.y - prevY);
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
