const PELLET_RADIUS = 4;

class Pellet {
    constructor(x, y) {
        this.x = x;
        this.y = y;

        this.eaten = false;

        this.foodValue = 1;
    }

    eat() {
        if (this.eaten) {
            return 0;
        }

        this.eaten = true;
        return this.foodValue;
    }

    draw(ctx) {
        ctx.fillStyle = 'black';

        ctx.fillRect(this.x - PELLET_RADIUS, this.y - PELLET_RADIUS, PELLET_RADIUS * 2, PELLET_RADIUS * 2);
    }
}