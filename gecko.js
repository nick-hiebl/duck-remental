class Gecko {
    constructor(x, y, gameState, init) {
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

        // Persistent
        const hue = init?.hue ?? randInt(320, 480);
        const saturation = init?.saturation ?? randInt(80, 100);
        const lightness = init?.lightness ?? randInt(60, 80);
        const hueShiftSign = init?.hueShiftSign ?? chooseRandom([-1, -0.5, 0, 0.5, 1]);
        this.hue = hue;
        this.saturation = saturation;
        this.lightness = lightness;
        this.hueShiftSign = hueShiftSign;

        // Derived
        this.mainColor = `hsla(${hue}, ${saturation}%, ${lightness}%, 1.00)`;

        const SEG_LENGTHS = [7, 9, 12, 10, 8, 6, 5, 5, 4, 4, 3, 3, 2, 1];

        const ARMS = [9, 6];

        let runningX = x;

        this.segments = [];

        let i = 0;
        for (const seg of SEG_LENGTHS) {
            i += hueShiftSign * seg;
            runningX -= seg * .8;

            const segment = {
                pos: { x: runningX, y },
                length: seg * .8,
                radius: seg,
                color: `hsla(${hue + i}, ${saturation}%, ${lightness}%, 1.00)`,
            };

            if (ARMS.includes(seg)) {
                const ARM_LENGTH = seg === 9 ? 15 : 17;
                segment.armLength = ARM_LENGTH;
                segment.arms = [
                    { grounded: { x: runningX, y: y - ARM_LENGTH }, actual: { x: runningX, y: y - ARM_LENGTH } },
                    { grounded: { x: runningX, y: y + ARM_LENGTH }, actual: { x: runningX, y: y + ARM_LENGTH } },
                ];
            }

            this.segments.push(segment);
        }
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
        ctx.strokeStyle = this.mainColor;

        ctx.lineWidth = this.config.size * 0.45;
        ctx.lineCap = 'round';

        this.segments.forEach((_, segmentIndex) => {
            const segment = this.segments[this.segments.length - segmentIndex - 1];

            ctx.fillStyle = segment.color;
            ctx.strokeStyle = segment.color;

            v_circle(ctx, segment.pos, segment.radius);

            if (segment.arms) {
                segment.arms.forEach(({ actual }, index) => {
                    const armV = v_sub(actual, segment.pos);
                    const armDirection = (index === 0 ? -0.2 : 0.2) * (segmentIndex > 8 ? 1 : -1);

                    const midpoint = v_add(
                        v_lerp(actual, segment.pos, 0.33),
                        v_set_magnitude(
                            v_right_angle(armV),
                            v_mag(armV) * armDirection,
                        ),
                    );

                    v_line(ctx, segment.pos, midpoint);
                    v_line(ctx, midpoint, actual);
                    v_circle(ctx, actual, this.config.size * 0.35);
                });
            }
        });

        v_circle(ctx, this, this.config.size);

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

        this.config.draw();
    }

    strategy(items) {
        const closestItem = selectTarget(
            this.config.gameState,
            this.target,
            this,
            item => dist(item, this) < this.config.eatDist,
        );

        if (!closestItem) {
            this.target = null;
            return { id: 'STOP', rate: IDLE_DECEL };
        } else if (dist(this, closestItem) < this.config.eatDist) {
            return { id: 'EAT', rate: STOP_DECEL, target: closestItem };
        }

        return { id: 'APPROACH', target: closestItem };
    }

    update(deltaTime, items) {
        this.timeSinceEating += deltaTime;
        const strategy = this.strategy(items);

        if (strategy.id === 'EAT') {
            strategy.target.claimed = true;
            if (this.timeSinceEating >= this.config.eatingCooldown) {
                this.score += strategy.target.eat();
                this.timeSinceEating = 0;
                this.target = null;
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
            target.claimed = true;

            const offset = v_sub(target, this);
            const offsetAngle = v_angle(offset);

            const currentHeading = v_angle(this.heading);

            const angleWobble = Math.sin(this.distanceTravelled / 12);

            if (relative_angle(currentHeading, offsetAngle) < angleWobble / 1) {
                this.heading = v_for_angle(currentHeading - this.config.turningRate * deltaTime);
            } else {
                this.heading = v_for_angle(currentHeading + this.config.turningRate * deltaTime);
            }

            const currentVelocity = v_mag(this.vel);

            const targetVelocity = v_mag(offset) < this.config.slowDist ? this.config.speed / 4 : this.config.speed;

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
            throw new Error('Invalid position');
        }

        let priorPos = this.pos;
        for (let i = 0; i < this.segments.length; i++) {
            const segment = this.segments[i];
            const segmentV = v_sub(segment.pos, priorPos);

            segment.pos = v_add(priorPos, v_cap_magnitude(segmentV, segment.length));

            if (segment.arms) {
                const legV = v_set_magnitude(v_right_angle(segmentV), segment.armLength);
                const leftIdealPos = v_add(segment.pos, legV, v_set_magnitude(segmentV, -segment.armLength * 1.3));
                const rightIdealPos = v_add(segment.pos, v_scale(legV, -1), v_set_magnitude(segmentV, -segment.armLength * 1.3));

                const leftArm = segment.arms[0];

                const LEG_STEP = 30;

                if (dist(leftArm.grounded, leftIdealPos) > LEG_STEP) {
                    leftArm.actual = leftArm.grounded;
                    // leftArm.grounded = v_add(leftArm.grounded, v_set_magnitude(v_sub(leftIdealPos, leftArm.grounded), LEG_STEP * 1.8))
                    leftArm.grounded = leftIdealPos;
                }

                const rightArm = segment.arms[1];

                if (dist(rightArm.grounded, rightIdealPos) > LEG_STEP) {
                    rightArm.actual = rightArm.grounded;
                    // rightArm.grounded = v_add(rightArm.grounded, v_set_magnitude(v_sub(rightIdealPos, rightArm.grounded), LEG_STEP * 1.8))
                    rightArm.grounded = rightIdealPos;
                }

                leftArm.actual = v_lerp(leftArm.actual, leftArm.grounded, 0.1);
                rightArm.actual = v_lerp(rightArm.actual, rightArm.grounded, 0.1);
            }

            priorPos = segment.pos;
        }
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

        if (!gameState.noUI) {
            box.appendChild(myDiv);
        }
    }

    draw() {
        this.upgrades.forEach(upgrade => upgrade.draw());
    }
}

const GECKO_UPGRADES = [
    [
        { cost: 5, speed: 130, accel: 150, decel: 480 },
        { cost: 10, speed: 170, accel: 190, decel: 600 },
        { cost: 75, speed: 250, accel: 280, decel: 720 },
        { cost: 500, speed: 400, accel: 400, decel: 900 },
        { cost: 2000, speed: 550, accel: 800, decel: 1200 },
        { cost: 5000, speed: 720, accel: 1000, decel: 1800 },
        { cost: 75000, speed: 800, accel: 1100, decel: 2000 },
    ]
        .map(({ cost, speed, accel, decel }) => ({
            id: 'gecko-speed',
            text: 'Faster',
            cost,
            upgrade: config => {
                config.speed = speed;
                config.accelRate = accel;
                config.decelRate = decel;
                config.turningRate = speed * 0.04;
                config.slowDist = speed * 0.3;
            },
        })),
    [
        { cost: 2, value: 1.55 },
        { cost: 20, value: 1.25 },
        { cost: 150, value: 0.95 },
        { cost: 500, value: 0.7 },
        { cost: 2000, value: 0.35 },
        { cost: 5000, value: 0.27 },
        { cost: 20000, value: 0.205 },
        { cost: 150000, value: 0.18 },
        { cost: 750000, value: 0.15 },
    ]
        .map(({ cost, value }) => ({
            id: 'gecko-eat',
            text: 'Eat faster',
            cost,
            upgrade: config => {
                config.eatingCooldown = value;
            },
        })),
];
