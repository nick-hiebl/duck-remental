const RADIUS = 10;

const IDLE_DECEL = 0.1;
const STOP_DECEL = 1;
const ACCEL_RATE = 120;

const SPEED = 100;

const EAT_DIST = 40;

const MAX_EATING_SPEED = 0.1;

class Creature {
    constructor(x, y) {
        this.x = x;
        this.y = y;

        this.vx = 0;
        this.vy = 0;

        this.score = 0;

        this.target = null;
    }

    draw(ctx) {
        ctx.fillStyle = '#0f0';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, RADIUS, RADIUS, 0, 0, 2 * Math.PI);
        ctx.fill();
    }

    strategy(items) {
        if (items.length === 0) {
            return { id: 'STOP', rate: IDLE_DECEL };
        }

        let closestItem;

        if (items.includes(this.target)) {
            closestItem = this.target;
        } else if (items.length === 1) {
            closestItem = items[0];
        } else {
            const weights = items.map(item => {
                return {
                    weight: 1 / (Math.pow(dist(this, item), 3) + 1),
                    item,
                };
            });

            const total = weights.reduce((total, { weight }) => total + weight, 0);
            const index = Math.random() * total;

            [, closestItem] = weights.reduce(([ind, chosen], { weight, item }) => {
                if (ind >= 0 && ind < weight) {
                    return [-1, item];
                } else if (ind < 0) {
                    return [-1, chosen];
                } else {
                    return [ind - weight, chosen];
                }
            }, [index, items[0]]);
        }

        if (dist(this, closestItem) < EAT_DIST) {
            if (Math.hypot(this.vx, this.vy) <= MAX_EATING_SPEED) {
                return { id: 'EAT', target: closestItem };
            }

            return { id: 'STOP', rate: STOP_DECEL };
        }

        return { id: 'APPROACH', target: closestItem };
    }

    update(deltaTime, items) {
        const strategy = this.strategy(items);

        if (strategy.id === 'EAT') {
            this.score += strategy.target.eat();
        } else if (strategy.id === 'STOP') {
            this.vx = approach(this.vx, 0, strategy.rate);
            this.vy = approach(this.vy, 0, strategy.rate);
        } else if (strategy.id === 'APPROACH') {
            this.target = strategy.target;
            const target = strategy.target;

            const offset = { x: target.x - this.x, y: target.y - this.y };

            const distance = dist(target, this);

            const targetSpeed = { x: offset.x * SPEED / distance, y: offset.y * SPEED / distance };

            this.vx = approach(this.vx, targetSpeed.x, ACCEL_RATE * deltaTime * Math.abs(offset.x / distance));
            this.vy = approach(this.vy, targetSpeed.y, ACCEL_RATE * deltaTime * Math.abs(offset.y / distance));
        }

        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
    }
}
