const PELLET_RADIUS = 4;

class Pellet {
    constructor(x, y, gameState) {
        this.x = x;
        this.y = y;

        this.eaten = false;

        this.foodValue = gameState.newFoodValue ?? 1;

        this.age = Math.random() * -0.2;
    }

    eat() {
        if (this.eaten) {
            return 0;
        }

        this.eaten = true;
        return this.foodValue;
    }

    update(deltaTime) {
        this.age += deltaTime;
    }

    draw(ctx) {
        const primaryColor = {
            1: 'black',
            2: 'gold',
            3: 'darkgreen',
            4: 'white',
        }[this.foodValue];

        const FALL_TIME = 1;
        if (this.age < 0) {
            return;
        }

        if (this.age < FALL_TIME) {
            const landingFactor = (FALL_TIME - this.age) / FALL_TIME;
            ctx.fillStyle = '#0006';

            const parab = landingFactor - landingFactor * landingFactor;

            const shadowRadius = PELLET_RADIUS + parab * 3;

            ctx.filter = `opacity(${200 * parab}%)`
            ctx.beginPath();
            ctx.ellipse(this.x, this.y, shadowRadius * 1.5, shadowRadius, 0, 0, 2 * Math.PI);
            ctx.fill();

            ctx.filter = `opacity(${100 * (1 - landingFactor)}%)`
            ctx.fillStyle = primaryColor;
            const yOffset = (1 - (1 - landingFactor) * (1 - landingFactor)) * 200
            ctx.fillRect(this.x - PELLET_RADIUS, this.y - PELLET_RADIUS - yOffset, PELLET_RADIUS * 2, PELLET_RADIUS * 2);
            ctx.filter = 'none';
            return;
        }

        if (this.age < FALL_TIME * 2) {
            const rippleFactor = (this.age - FALL_TIME) / FALL_TIME;

            ctx.strokeStyle = 'rgba(38, 139, 255, 1)';
            ctx.lineWidth = 2;

            ctx.filter = `opacity(${100 * (1 - rippleFactor)}%)`;
            ctx.beginPath();
            const radius = 20 * Math.sqrt(rippleFactor);
            ctx.ellipse(this.x, this.y, radius * 1.5, radius, 0, 0, 2 * Math.PI);
            ctx.stroke();

            ctx.filter = 'none';
        }

        ctx.fillStyle = primaryColor;
        ctx.fillRect(this.x - PELLET_RADIUS, this.y - PELLET_RADIUS, PELLET_RADIUS * 2, PELLET_RADIUS * 2);
    }
}