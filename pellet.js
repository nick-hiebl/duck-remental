const PELLET_RADIUS = 4;

class Pellet {
    constructor(x, y, gameState) {
        this.x = x;
        this.y = y;

        this.eaten = false;
        this.claimed = false;

        this.foodValue = gameState.newFoodValue ?? 1;
        this.gameState = gameState;

        this.age = Math.random() * -0.2;

        this.hue = Math.floor(300 * Math.pow(1.618, this.foodValue - 1));
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
        if (this.foodValue === 16) {
            const pos = this.x * 3 + this.y + this.gameState.timePassed * 120;
            this.hue = pos / 10;
        }

        this.primaryColor = `hsla(${this.hue}, 90%, 50%, 1.00)`;

        const FALL_TIME = 1;
        if (this.age < 0) {
            return;
        }

        if (this.age < FALL_TIME) {
            const landingFactor = (FALL_TIME - this.age) / FALL_TIME;

            const parab = landingFactor - landingFactor * landingFactor;

            const shadowRadius = PELLET_RADIUS + parab * 3;

            const shadowColor = `hsla(0, 0%, 0%, ${0.7 * parab})`;

            ctx.fillStyle = shadowColor;
            ctx.beginPath();
            ctx.ellipse(this.x, this.y, shadowRadius * 1.5, shadowRadius, 0, 0, 2 * Math.PI);
            ctx.fill();

            ctx.fillStyle = `hsla(${this.hue}, 90%, 50%, ${1 - landingFactor})`;
            const yOffset = (1 - (1 - landingFactor) * (1 - landingFactor)) * 200;
            v_circle(ctx, v_add(this, { x: 0, y: -yOffset }), PELLET_RADIUS);
            return;
        }

        if (this.age < FALL_TIME * 2) {
            const rippleFactor = (this.age - FALL_TIME) / FALL_TIME;

            ctx.strokeStyle = `rgba(45, 95, 210, ${1 - rippleFactor})`;
            ctx.lineWidth = 2;

            ctx.beginPath();
            const radius = 20 * Math.sqrt(rippleFactor);
            ctx.ellipse(this.x, this.y, radius * 1.5, radius, 0, 0, 2 * Math.PI);
            ctx.stroke();
        }

        ctx.fillStyle = this.primaryColor;
        v_circle(ctx, this, PELLET_RADIUS);
    }
}