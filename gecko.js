class Gecko {
    constructor(x, y, gameState) {
        this.id = Math.random().toString().slice(2);

        this.x = x;
        this.y = y;

        this.vx = 0;
        this.vy = 0;

        this.score = 0;
        this.timeSinceEating = 0;

        this.target = null;

        this.config = GeckoConfig.get(gameState);

        this.heading = { x: 1, y: 0 };
        this.distanceTravelled = 0;

        this.mainColor = `hsla(${randInt(0, 360)}, ${randInt(80, 100)}%, ${randInt(60, 80)}%, 1.00)`;
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

        ctx.fillStyle = this.mainColor;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.config.size, this.config.size, heading, 0, 2 * Math.PI);
        ctx.fill();


        ctx.fillStyle = 'black';
        ctx.beginPath();
        const eyeRadius = 0.2 * this.config.size;
        const eyeOffsetRadius = this.config.size * 0.6;
        const eye1Angle = heading + Math.PI * 3 / 10;
        const eye1Pos = v_add(this.pos, v_scale({ x: Math.cos(eye1Angle), y: Math.sin(eye1Angle) }, eyeOffsetRadius));
        ctx.ellipse(eye1Pos.x, eye1Pos.y, eyeRadius, eyeRadius, 0, 0, 2 * Math.PI);
        const eye2Angle = heading - Math.PI * 3 / 10;
        const eye2Pos = v_add(this.pos, v_scale({ x: Math.cos(eye2Angle), y: Math.sin(eye2Angle) }, eyeOffsetRadius));
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
            return { id: 'EAT', rate: STOP_DECEL, target: closestItem };
        }

        return { id: 'APPROACH', target: closestItem };
    }

    update(deltaTime, items) {
        this.timeSinceEating += deltaTime;
        const strategy = this.strategy(items);

        if (strategy.id === 'EAT') {
            if (this.timeSinceEating >= this.config.eatingCooldown) {
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
            const offsetAngle = v_angle(offset);

            const currentHeading = v_angle(this.heading);

            const angleWobble = Math.sin(this.distanceTravelled / 8);

            if (relative_angle(currentHeading, offsetAngle) < angleWobble / 2) {
                this.heading = v_for_angle(currentHeading - this.config.turningRate * deltaTime);
            } else {
                this.heading = v_for_angle(currentHeading + this.config.turningRate * deltaTime);
            }

            const currentVelocity = v_mag(this.vel);

            const targetVelocity = v_mag(offset) < this.config.slowDist ? this.config.speed / 3 : this.config.speed;

            const nextVelocity = approach(
                currentVelocity,
                targetVelocity,
                this.config.accelRate * deltaTime,
            );

            this.vel = v_scale(this.heading, nextVelocity);

            if (isNaN(this.vel.x) || isNaN(this.vel.y)) {
                console.log(offset, target, this.config);
            }
        }

        this.distanceTravelled += v_mag(this.vel) * deltaTime;
        this.pos = v_add(this.pos, v_scale(this.vel, deltaTime));

        if (this.vel.x !== 0 || this.vel.y !== 0) {
            this.heading = v_set_magnitude(this.vel, 1);
        }

        if (isNaN(this.pos.x) || isNaN(this.pos.y)) {
            console.log(this.vel, deltaTime);
        }

        // this.beakOffset = v_add(v_scale(this.beakOffset, 0.9), v_scale(this.getBeakOffset(), 0.1));
    }
}

class GeckoConfig {
    static instance = null;

    static get(gameState) {
        if (GeckoConfig.instance) {
            return GeckoConfig.instance;
        }

        const i = new GeckoConfig(gameState);
        GeckoConfig.instance = i;

        return i;
    }

    constructor(gameState) {
        this.gameState = gameState;

        this.size = 10;
        this.eatDist = this.size;
        this.slowDist = 30;

        this.decelRate = 360;
        this.maxEatingSpeed = MAX_EATING_SPEED;
        this.accelRate = ACCEL_RATE;
        this.speed = 100;

        this.turningRate = 3;

        this.eatingCooldown = 2;

        const box = document.getElementById('controls');

        const title = createElement('strong', { text: 'Gecko' });

        this.upgrades = GECKO_UPGRADES.map(list => {
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

const GECKO_UPGRADES = [
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
                config.turningRate = speed * 0.03;
                config.slowDist = speed * 0.3;
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
