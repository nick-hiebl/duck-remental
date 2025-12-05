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
        this.timeSinceEating = 0;

        this.target = null;

        this.hovered = false;

        this.config = new CreatureConfig(this);
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
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#ff0';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.config.eatDist, this.config.eatDist, 0, 0, 2 * Math.PI);
        ctx.stroke();

        if (this.target) {
            ctx.lineWidth = 1;
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

        if (this.hovered) {
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#f00';
            ctx.beginPath();
            ctx.ellipse(this.x, this.y, this.config.size * 1.2, this.config.size * 1.2, 0, 0, 2 * Math.PI);
            ctx.stroke();
        }

        ctx.fillStyle = 'blue';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.ellipse(this.x, this.y, this.config.size * 0.8, this.config.size * 0.8, 0, 0, 2 * Math.PI * Math.min(1, this.timeSinceEating / this.config.eatingCooldown));
        ctx.fill();
    }

    isEatingOnCooldown() {
        return this.timeSinceEating >= this.config.eatingCooldown;
    }

    strategy(items) {
        items = items.filter(item => !item.eaten);
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

            const BEST_TO_CHOOSE = 3;

            const result = chooseRandom(bestNItems(weights, BEST_TO_CHOOSE));

            if (result) {
                closestItem = result.item;
            } else {
                throw Error('Failed to select item');
            }
        }

        if (dist(this, closestItem) < this.config.eatDist) {
            if (v_mag(this.vel) <= this.config.maxEatingSpeed) {
                return { id: 'EAT', rate: STOP_DECEL, target: closestItem };
            }

            return { id: 'STOP', rate: STOP_DECEL };
        }

        return { id: 'APPROACH', target: closestItem };
    }

    update(deltaTime, items) {
        this.timeSinceEating += deltaTime;
        const strategy = this.strategy(items);

        if (strategy.id === 'EAT') {
            if (this.isEatingOnCooldown()) {
                this.score += strategy.target.eat();
                this.timeSinceEating = 0;
            } else {
                this.target = strategy.target;
                this.vel = v_set_magnitude(
                    this.vel,
                    Math.max(v_mag(this.vel) - this.config.decelRate * strategy.rate * deltaTime, 0),
                );
            }
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

            if (isNaN(this.vel.x) || isNaN(this.vel.y)) {
                console.log(offset, target, this.config);
            }

            // Kill orbital behaviour by decelerating the creature if it is going in the wrong direction
            if (dot_product(this.vel, offset) < 0) {
                this.vel = v_set_magnitude(
                    this.vel,
                    Math.max(v_mag(this.vel) - this.config.decelRate * ORBIT_DECEL, 0),
                );
            }
        }

        this.pos = v_add(this.pos, v_scale(this.vel, deltaTime));
        if (isNaN(this.pos.x) || isNaN(this.pos.y)) {
            console.log(this.vel, deltaTime);
        }
    }
}

class CreatureConfig {
    constructor(parent) {
        this.parent = parent;

        this.eatDist = EAT_DIST;
        this.size = RADIUS;

        this.decelRate = 360;
        this.maxEatingSpeed = MAX_EATING_SPEED;
        this.accelRate = ACCEL_RATE;
        this.speed = SPEED;

        this.eatingCooldown = 2;

        const box = document.getElementById('controls');

        const myDiv = createElement('div', {
            classList: ['creature-control-box'],
            children: [
                createTextNode(parent.id),
                createElement('button', {
                    text: 'More speed!',
                    eventHandlers: {
                        click: () => {
                            this.speed += 20;
                        },
                    },
                }),
                createElement('button', {
                    text: 'More accel!',
                    eventHandlers: {
                        click: () => {
                            this.accelRate += 20;
                            this.decelRate += 50;
                        },
                    },
                }),
                createElement('button', {
                    text: 'More eat radius!',
                    eventHandlers: {
                        click: () => {
                            this.eatDist += 20;
                        },
                    },
                }),
                createElement('button', {
                    text: 'Eat while moving faster!',
                    eventHandlers: {
                        click: () => {
                            this.maxEatingSpeed += 10;
                        },
                    },
                }),
                createElement('button', {
                    text: 'Eat more frequently!',
                    eventHandlers: {
                        click: () => {
                            this.eatingCooldown *= 0.75;
                        },
                    },
                }),
            ],
        });

        myDiv.addEventListener('mouseenter', () => {
            this.parent.hovered = true;
        });
        myDiv.addEventListener('mouseleave', () => {
            this.parent.hovered = false;
        });

        box.appendChild(myDiv);
    }
}
