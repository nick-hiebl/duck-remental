

class Frog {
    constructor(x, y, gameState) {
        this.id = Math.random().toString().slice(2);

        this.x = x;
        this.y = y;

        this.z = 0;

        this.vx = 0;
        this.vy = 0;

        this.vz = 0;

        this.heading = { x: 1, y: 0 };

        this.score = 0;
        this.timeSinceEating = 0;

        this.timeSinceLanding = 0;

        this.tongueGoingOut = false;
        this.tonguePos = null;

        this.target = null;

        this.config = FrogConfig.get(gameState);

        this.color = `hsla(${randInt(110, 140)}, ${randInt(50, 90)}%, ${randInt(20, 50)}%, 1.00)`;
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
        if (this.tonguePos) {
            ctx.strokeStyle = 'pink';
            ctx.fillStyle = 'pink';
            ctx.lineWidth = this.config.size * 0.3;
            v_line(ctx, this, this.tonguePos);
            v_circle(ctx, this.tonguePos, this.config.size * 0.4);
        }

        if (this.z > 0) {
            ctx.fillStyle = '#0002';
            v_circle(ctx, this.pos, this.config.size);
        }

        const zOffset = -0.2 * this.z * this.config.size;

        ctx.save();
        ctx.translate(0, zOffset);

        const heading = v_angle(this.heading);

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.config.size, this.config.size * 1.2, heading, 0, 2 * Math.PI);
        ctx.fill();

        ctx.fillStyle = 'black';
        const eyeCenter = v_add(this, v_scale(this.heading, this.config.size * 0.6));
        const eyeOff = v_scale(v_right_angle(this.heading), this.config.size * 0.5);
        v_circle(ctx, v_add(eyeCenter, eyeOff), this.config.size * 0.2);
        v_circle(ctx, v_sub(eyeCenter, eyeOff), this.config.size * 0.2);

        ctx.restore();

        this.config.draw();
    }

    strategy(items) {
        items = items.filter(item => !item.eaten);
        if (items.length === 0) {
            this.target = null;
            return { id: 'STOP' };
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
                    weight: 1 / (dist(this, item) + 1),
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

        const distToTarget = dist(this, closestItem);

        if (distToTarget <= this.config.tongueDist && distToTarget >= this.config.minTongueDist) {
            return { id: 'EAT', target: closestItem };
        }

        return { id: 'APPROACH', target: closestItem };
    }

    update(deltaTime, items) {
        if (this.tonguePos) {
            this.heading = v_set_magnitude(v_sub(this.tonguePos, this), 1);
        } else if (this.vx !== 0 || this.vy !== 0) {
            this.heading = v_set_magnitude(this.vel, 1);
        }

        this.timeSinceEating += deltaTime;
        const tongueSpeed = this.config.size * this.config.tongueSpeed;

        if (this.z > 0) {
            this.vz += this.config.gravity * deltaTime;
            this.z += this.vz * deltaTime;

            this.pos = v_add(this.pos, v_scale(this.vel, deltaTime));

            if (this.z < 0) {
                this.timeSinceLanding = 0;
                this.z = 0;
                this.vx = 0;
                this.vy = 0;
            }

            return;
        } else {
            this.timeSinceLanding += deltaTime;
        }

        const strategy = this.strategy(items);

        if (strategy.id !== 'EAT' && this.tongueGoingOut) {
            this.tongueGoingOut = false;
        }

        if (!this.tongueGoingOut && this.tonguePos) {
            const tongueToMe = v_sub(this.pos, this.tonguePos);
            const distance = dist(this.tonguePos, this.pos);

            if (distance < tongueSpeed * deltaTime) {
                this.tongueGoingOut = false;
                this.tonguePos = null;
            } else {
                this.tonguePos = v_add(this.tonguePos, v_cap_magnitude(tongueToMe, tongueSpeed * deltaTime));
            }

            return;
        }

        if (strategy.id === 'EAT') {
            this.target = strategy.target;
            const target = strategy.target;

            if (this.timeSinceEating >= this.config.eatingCooldown) {
                if (this.tongueGoingOut) {
                    const tongueToTarget = v_sub(target, this.tonguePos);
                    const distance = dist(target, this.tonguePos);

                    if (distance < tongueSpeed * deltaTime) {
                        this.tongueGoingOut = false;
                        this.tonguePos = { x: target.x, y: target.y };
                        this.score += strategy.target.eat();
                        this.timeSinceEating = 0;
                        this.target = null;
                    } else {
                        this.tonguePos = v_add(this.tonguePos, v_cap_magnitude(tongueToTarget, tongueSpeed * deltaTime));
                    }
                } else {
                    this.tongueGoingOut = true;
                    const tongueToTarget = v_sub(target, this.pos);
                    const distance = dist(target, this.pos);
                    this.tonguePos = v_add(this.pos, v_cap_magnitude(tongueToTarget, Math.min(distance, tongueSpeed * deltaTime)));
                }
                // Idk draw eating or smth
            } else {
                // Wait ig
            }
        } else if (strategy.id === 'STOP') {
            // Wait ig
        } else if (strategy.id === 'APPROACH') {
            if (this.timeSinceLanding < this.config.landingCooldown) {
                // Froggy needs a rest before jumping again
                return;
            }

            this.target = strategy.target;
            const target = strategy.target;

            const offset = v_sub(target, this);

            const distanceToTarget = v_mag(offset);

            if (distanceToTarget < this.config.minTongueDist) {
                this.vel = v_set_magnitude(v_sub(this, target), this.config.speed);
            } else {
                this.vel = v_set_magnitude(offset, this.config.speed);
            }

            const idealDistance = (this.config.minTongueDist + this.config.tongueDist) / 2;
            const distanceNeededToTravel = Math.abs(idealDistance - distanceToTarget);
            const desiredAirtime = distanceNeededToTravel / this.config.speed;

            const desiredZVel = Math.abs(desiredAirtime * this.config.gravity / 2);

            this.vz = Math.min(desiredZVel, this.config.initialJumpVelocity);
            this.z = this.vz * deltaTime;
        }
    }
}

class FrogConfig {
    static instance = null;

    static get(gameState) {
        return FrogConfig.instance ?? (FrogConfig.instance = new FrogConfig(gameState));
    }

    constructor(gameState) {
        this.gameState = gameState;

        this.size = 10;
        this.minTongueDist = 15;
        this.tongueDist = 45;

        this.tongueSpeed = 9;

        this.speed = 50;
        this.initialJumpVelocity = 30;
        this.gravity = -90;
        this.landingCooldown = 0.3;

        this.eatingCooldown = 2;

        const title = createElement('strong', { text: 'Frog' });

        this.upgrades = FROG_UPGRADES.map(list => new Upgrade(list, this));

        const myDiv = createElement('div', {
            classList: ['creature-control-box'],
            children: [title, ...this.upgrades.map(u => u.button)],
        });

        document.getElementById('controls').appendChild(myDiv);
    }

    draw() {
        this.upgrades.forEach(upgrade => upgrade.draw());
    }
}

const FROG_UPGRADES = [
    [
        { cost: 1, size: 12 },
        { cost: 10, size: 14 },
        { cost: 100, size: 16 },
        { cost: 1000, size: 18 },
        { cost: 10000, size: 20 },
        { cost: 100000, size: 22 },
    ]
        .map(({ cost, size }) => ({
            text: 'Bigger',
            cost,
            upgrade: config => {
                config.size = size;
                config.minTongueDist = 1.5 * size;
                config.tongueDist = 4.5 * size;
            },
        })),
    [
        { cost: 1, speed: 15 },
        { cost: 10, speed: 21 },
        { cost: 50, speed: 27 },
        { cost: 100, speed: 33 },
        { cost: 250, speed: 40 },
    ]
        .map(({ cost, speed }) => ({
            text: 'Faster tongue',
            cost,
            upgrade: config => {
                config.tongueSpeed = speed;
            },
        })),
    [
        { cost: 1, value: 1.6 },
        { cost: 10, value: 1.3 },
        { cost: 50, value: 1.0 },
        { cost: 250, value: 0.75 },
        { cost: 1000, value: 0.4 },
        { cost: 5000, value: 0.3 },
        { cost: 25000, value: 0.22 },
    ]
        .map(({ cost, value }) => ({
            text: 'Eat faster',
            cost,
            upgrade: config => {
                config.eatingCooldown = value;
            },
        })),
    [
        { cost: 1, speed: 65, gravity: -110, cd: 0.25 },
        { cost: 10, speed: 80, gravity: -130, cd: 0.20 },
        { cost: 25, speed: 100, gravity: -140, cd: 0.15 },
        { cost: 100, speed: 135, gravity: -160, cd: 0.1 },
        { cost: 250, speed: 160, gravity: -190, cd: 0.085 },
        { cost: 1000, speed: 190, gravity: -200, cd: 0.08 },
        { cost: 2500, speed: 210, gravity: -210, cd: 0.07 },
    ]
        .map(({ cost, speed, gravity, cd }) => ({
            text: 'Move faster',
            cost,
            upgrade: config => {
                config.speed = speed;
                config.gravity = gravity;
                config.landingCooldown = cd;
            },
        })),
];
