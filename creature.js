const RADIUS = 10;

const DECEL_RATE = 360;
const IDLE_DECEL = 1 / 12;
const STOP_DECEL = 1.0;
const ORBIT_DECEL = 5 / 12;
const ACCEL_RATE = 120;

const SPEED = 100;

const EAT_DIST = 20;

const MAX_EATING_SPEED = 0.1;

class Creature {
    constructor(x, y) {
        this.id = Math.random().toString().slice(2);

        this.x = x;
        this.y = y;

        this.vx = 0;
        this.vy = 0;

        this.score = 0;

        this.target = null;

        this.config = new CreatureConfig();
    }

    get pos() {
        return { x: this.x, y: this.y };
    }

    set pos(v) {
        this.x = v.x;
        this.y = v.y;
    }

    get vel() {
        return { x: this.vx, y: this.vy };
    }

    set vel(v) {
        this.vx = v.x;
        this.vy = v.y;
    }

    draw(ctx) {
        ctx.strokeStyle = '#ff0';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.config.eatDist, this.config.eatDist, 0, 0, 2 * Math.PI);
        ctx.stroke();

        if (this.target) {
            ctx.strokeStyle = '#ff0';
            ctx.beginPath();
            ctx.ellipse(this.target.x, this.target.y, 8, 8, 0, 0, 2 * Math.PI);
            ctx.stroke();

            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.target.x, this.target.y);
            ctx.stroke();
        }


        ctx.fillStyle = '#0f0';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.config.size, this.config.size, 0, 0, 2 * Math.PI);
        ctx.fill();
    }

    strategy(items) {
        if (items.length === 0) {
            this.target = null;
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

        if (dist(this, closestItem) < this.config.eatDist) {
            if (v_mag(this.vel) <= this.config.maxEatingSpeed) {
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
            this.vel = v_set_magnitude(
                this.vel,
                Math.max(v_mag(this.vel) - this.config.decelRate * strategy.rate * deltaTime, 0),
            );
        } else if (strategy.id === 'APPROACH') {
            this.target = strategy.target;
            const target = strategy.target;

            const offset = { x: target.x - this.x, y: target.y - this.y };

            this.vel = v_cap_magnitude(
                v_add(this.vel, v_cap_magnitude(offset, this.config.accelRate * deltaTime)),
                this.config.speed,
            );

            // Kill orbital behaviour by decelerating the creature if it is going in the wrong direction
            if (dot_product(this.vel, offset) < 0) {
                this.vel = v_set_magnitude(
                    this.vel,
                    Math.max(v_mag(this.vel) - this.config.decelRate * ORBIT_DECEL, 0),
                );
            }
        }

        this.pos = v_add(this.pos, v_scale(this.vel, deltaTime));
    }
}

class CreatureConfig {
    constructor() {
        this.eatDist = EAT_DIST;
        this.size = RADIUS;

        this.decelRate = 360;
        this.maxEatingSpeed = MAX_EATING_SPEED;
        this.accelRate = ACCEL_RATE;
        this.speed = SPEED;
    }
}
