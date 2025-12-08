const RADIUS = 10;

const DECEL_RATE = 360;
const IDLE_DECEL = 1 / 12;
const STOP_DECEL = 1.0;
const ORBIT_DECEL = 5 / 12;
const ACCEL_RATE = 120;

const SPEED = 100;

const EAT_DIST = 20;

const MAX_EATING_SPEED = 0.1;

class Duck {
    constructor(x, y, gameState) {
        this.id = Math.random().toString().slice(2);

        this.x = x;
        this.y = y;

        this.vx = 0;
        this.vy = 0;

        this.score = 0;
        this.timeSinceEating = 0;

        this.target = null;

        this.config = DuckConfig.get(gameState);

        this.heading = { x: 1, y: 0 };
        this.beakOffset = this.getBeakOffset();
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
        const heading = Math.atan2(this.heading.y, this.heading.x);

        ctx.fillStyle = 'brown';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.config.size * 1.2, this.config.size, heading, 0, 2 * Math.PI);
        ctx.fill();

        const beakPosition = v_add(this.pos, this.beakOffset);
        const headPosition = this.getHeadPosition(beakPosition);

        const beakHeading = Math.atan2(beakPosition.y - headPosition.y, beakPosition.x - headPosition.x);

        ctx.fillStyle = 'yellow';
        ctx.beginPath();
        ctx.ellipse(beakPosition.x, beakPosition.y, this.config.headSize, this.config.headSize * 0.5, beakHeading, 0, 2 * Math.PI)
        ctx.fill();

        ctx.fillStyle = 'green';
        ctx.beginPath();
        ctx.ellipse(headPosition.x, headPosition.y, this.config.headSize, this.config.headSize, 0, 0, 2 * Math.PI);
        ctx.fill();

        ctx.fillStyle = 'black';
        ctx.beginPath();
        const eyeRadius = 0.25 * this.config.headSize;
        const eyeOffsetRadius = this.config.headSize * 0.6;
        const eye1Angle = beakHeading + Math.PI * 3 / 10;
        const eye1Pos = v_add(headPosition, v_scale({ x: Math.cos(eye1Angle), y: Math.sin(eye1Angle) }, eyeOffsetRadius));
        ctx.ellipse(eye1Pos.x, eye1Pos.y, eyeRadius, eyeRadius, 0, 0, 2 * Math.PI);
        const eye2Angle = beakHeading - Math.PI * 3 / 10;
        const eye2Pos = v_add(headPosition, v_scale({ x: Math.cos(eye2Angle), y: Math.sin(eye2Angle) }, eyeOffsetRadius));
        ctx.ellipse(eye2Pos.x, eye2Pos.y, eyeRadius, eyeRadius, 0, 0, 2 * Math.PI);
        ctx.fill();

        // if (this.target) {
        //     ctx.strokeStyle = 'yellow';
        //     ctx.beginPath();
        //     ctx.ellipse(this.target.x, this.target.y, 12, 12, 0, 0, 2 * Math.PI);
        //     ctx.stroke();

        //     ctx.beginPath();
        //     ctx.moveTo(this.x, this.y);
        //     ctx.lineTo(this.x + this.heading.x * 100, this.y + this.heading.y * 100);
        //     ctx.stroke();
        // }

        this.config.draw();
    }

    getBeakOffset() {
        if (this.target && !this.target.eaten) {
            const offset = v_sub(this.target, this);
            const distance = v_mag(offset);

            if (distance <= this.config.eatDist - 1 * this.config.headSize) {
                return v_sub(this.target, this.pos);
            } else if (distance <= this.config.eatDist) {
                return v_set_magnitude(offset, this.config.eatDist - this.config.headSize);
            }
        }

        return v_set_magnitude(this.heading, this.config.eatDist - this.config.headSize);
    }

    getHeadPosition(beakPosition) {
        const beakToBody = v_sub(this.pos, beakPosition);

        return v_add(beakPosition, v_set_magnitude(beakToBody, this.config.headSize));
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

        if (this.target && this.target.eaten && this.timeSinceEating > MAX_FRAME_DUR / 1000) {
            // Someone else ate my food, rage-quit
            closestItem = chooseRandom(items);
        } else if (items.includes(this.target)) {
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

            const offset = v_sub(target, this);
            const distance = v_mag(offset);

            const currentHeading = Math.atan2(this.heading.y, this.heading.x);
            const neededHeading = Math.atan2(offset.y, offset.x);

            const directionalOffset = dot_product(this.heading, v_set_magnitude(offset, 1));

            const currentVelocity = v_mag(this.vel);

            const turningRate = this.config.turningRate * (1 - 0.5 * directionalOffset) * (1 - 1 / 2 * currentVelocity / this.config.speed);
            const nextHeading = approach_angle(currentHeading, neededHeading, turningRate * deltaTime);

            this.heading = { x: Math.cos(nextHeading), y: Math.sin(nextHeading) };

            const shouldSlowDownForArrival = directionalOffset > 0.8 && currentVelocity * 0.2 > (distance - this.config.eatDist);
            const slowDownFactor = shouldSlowDownForArrival ? 0.2 : 1;

            const targetVelocity = this.config.speed *
                Math.pow(0.5 + 0.5 * directionalOffset, 10) *
                slowDownFactor;

            const nextVelocity = approach(
                currentVelocity,
                targetVelocity,
                shouldSlowDownForArrival
                    ? this.config.decelRate * deltaTime
                    : this.config.accelRate * deltaTime,
            );

            this.vel = v_scale(this.heading, nextVelocity);

            if (isNaN(this.vel.x) || isNaN(this.vel.y)) {
                console.log(offset, target, this.config);
            }
        }

        this.pos = v_add(this.pos, v_scale(this.vel, deltaTime));

        if (this.vel.x !== 0 || this.vel.y !== 0) {
            this.heading = v_set_magnitude(this.vel, 1);
        }

        if (isNaN(this.pos.x) || isNaN(this.pos.y)) {
            console.log(this.vel, deltaTime);
        }

        this.beakOffset = v_add(v_scale(this.beakOffset, 0.9), v_scale(this.getBeakOffset(), 0.1));
    }
}

class DuckConfig {
    static instance = null;

    static get(gameState) {
        if (DuckConfig.instance) {
            return DuckConfig.instance;
        }

        const i = new DuckConfig(gameState);
        DuckConfig.instance = i;

        return i;
    }

    constructor(gameState) {
        this.gameState = gameState;

        this.eatDist = EAT_DIST;
        this.size = RADIUS;
        this.headSize = RADIUS * 0.75;

        this.decelRate = 360;
        this.maxEatingSpeed = MAX_EATING_SPEED;
        this.accelRate = ACCEL_RATE;
        this.speed = SPEED;

        this.turningRate = 2.1;

        this.eatingCooldown = 2;

        const box = document.getElementById('controls');

        const title = createElement('strong', { text: 'Duck' });

        this.upgrades = DUCK_UPGRADES.map(list => {
            return new Upgrade(list, this);
        });

        const myDiv = createElement('div', {
            classList: ['creature-control-box'],
            children: [title, ...this.upgrades.map(u => u.button)],
        });

        box.appendChild(myDiv);
    }

    draw() {
        this.upgrades.forEach(upgrade => upgrade.draw());
    }
}

const DUCK_UPGRADES = [
    [
        { cost: 1, speed: 130, accel: 150, decel: 480, turning: 2.5 },
        { cost: 10, speed: 170, accel: 190, decel: 600, turning: 3.5 },
        { cost: 100, speed: 250, accel: 280, decel: 720, turning: 5 },
        { cost: 500, speed: 400, accel: 400, decel: 900, turning: 6.5 },
        { cost: 2000, speed: 550, accel: 800, decel: 1200, turning: 9 },
        { cost: 5000, speed: 720, accel: 1000, decel: 1800, turning: 11 },
    ]
        .map(({ cost, speed, accel, decel, turning }) => ({
            text: 'Faster',
            cost,
            upgrade: config => {
                config.speed = speed;
                config.accelRate = accel;
                config.decelRate = decel;
                config.turningRate = turning;
            },
        })),
    [
        { cost: 1, value: 1.6 },
        { cost: 10, value: 1.3 },
        { cost: 100, value: 1.0 },
        { cost: 500, value: 0.75 },
        { cost: 2000, value: 0.4 },
        { cost: 5000, value: 0.3 },
        { cost: 20000, value: 0.22 },
    ]
        .map(({ cost, value }) => ({
            text: 'Eat faster',
            cost,
            upgrade: config => {
                config.eatingCooldown = value;
            },
        })),
    [
        { cost: 1, value: 24 },
        { cost: 10, value: 27 },
        { cost: 100, value: 30 },
        { cost: 1000, value: 33 },
        { cost: 10000, value: 36 },
        { cost: 100000, value: 40 },
    ]
        .map(({ cost, value }) => ({
            text: 'Size',
            cost,
            upgrade: config => {
                config.eatDist = value;
                config.size = RADIUS / EAT_DIST * value;
                config.headSize = config.size * 0.75;
            },
        })),
];
