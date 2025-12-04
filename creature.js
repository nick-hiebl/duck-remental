const RADIUS = 10;

const DECEL_RATE = 0.1;
const ACCEL_RATE = 120;

const SPEED = 100;

class Creature {
    constructor(x, y) {
        this.x = x;
        this.y = y;

        this.vx = 0;
        this.vy = 0;
    }

    draw(ctx) {
        ctx.fillStyle = '#0f0';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, RADIUS, RADIUS, 0, 0, 2 * Math.PI);
        ctx.fill();
    }

    update(deltaTime, items) {
        if (items.length === 0) {
            this.vx = approach(this.vx, 0, DECEL_RATE);
            this.vy = approach(this.vy, 0, DECEL_RATE);
        } else {
            const closestItem = items.length === 1 ? items[0] : items.slice(1).reduce((best, current) => {
                if (dist(this, best) < dist(this, current)) {
                    return best;
                }

                return current;
            }, items[0]);

            const offset = { x: closestItem.x - this.x, y: closestItem.y - this.y };

            const distance = dist(closestItem, this);

            const targetSpeed = { x: offset.x * SPEED / distance, y: offset.y * SPEED / distance };

            this.vx = approach(this.vx, targetSpeed.x, ACCEL_RATE * deltaTime);
            this.vy = approach(this.vy, targetSpeed.y, ACCEL_RATE * deltaTime);
        }

        // console.log(this.vx, this.vy, this.x, this.y);

        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
    }
}
