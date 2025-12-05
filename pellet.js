const PELLET_RADIUS = 4;

class Pellet {
    constructor(x, y, gameState) {
        this.x = x;
        this.y = y;

        this.eaten = false;

        this.foodValue = gameState.newFoodValue ?? 1;
    }

    eat() {
        if (this.eaten) {
            return 0;
        }

        this.eaten = true;
        return this.foodValue;
    }

    draw(ctx) {
        ctx.fillStyle = {
            1: 'black',
            2: 'gold',
            3: 'darkgreen',
            4: 'white',
        }[this.foodValue];

        ctx.fillRect(this.x - PELLET_RADIUS, this.y - PELLET_RADIUS, PELLET_RADIUS * 2, PELLET_RADIUS * 2);
    }
}