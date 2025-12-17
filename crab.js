const CRAB_TARGET_ANGLE = 0.2;
const CRAB_LEG_PAIRS = 4;

class Crab {
    constructor(x, y, gameState, init) {
        this.id = Math.random().toString().slice(2);

        this.x = x;
        this.y = y;

        this.vx = 0;
        this.vy = 0;

        this.score = 0;
        this.timeSinceEating = 0;

        this.timeSinceEatingLeft = 3;
        this.timeSinceEatingRight = 3;

        this.target = null;

        this.config = CrabConfig.get(gameState);

        this.heading = { x: 1, y: 0 };

        this.leftArmOff = { x: 5, y: -30 };
        this.rightArmOff = { x: 5, y: 30 };

        this.actualLegEnds = this.getIdealLegEnds();
        this.visualLegEnds = [...this.actualLegEnds];

        // Persistent
        this.hue = init?.hue ?? randInt(0, 360);
        this.saturation = init?.saturation ?? randInt(70, 90);
        this.lightness = init?.lightness ?? randInt(40, 65);

        // Derived
        this.mainColor = `hsla(${this.hue}, ${this.saturation}%, ${this.lightness}%, 1.00)`;
        this.legColor = `hsla(${this.hue}, ${this.saturation}%, ${this.lightness - 10}%, 1.00)`;
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

        ctx.lineWidth = this.config.size * 0.35;
        ctx.strokeStyle = this.legColor;
        ctx.lineCap = 'round';
        const legBases = this.getLegBases();
        legBases.forEach((pos, index) => {
            v_circle(ctx, pos, 2);
            v_line(ctx, pos, this.visualLegEnds[index]);
        });

        ctx.lineCap = 'butt';

        ctx.fillStyle = this.mainColor;
        ctx.strokeStyle = this.mainColor;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.config.size, this.config.size * 2, heading, 0, 2 * Math.PI);
        ctx.fill();

        ctx.lineWidth = this.config.size * 0.4;
        const leftShoulder = v_add(this.pos, v_scale(v_for_angle(heading - Math.PI / 2), this.config.size * 1.9));
        ctx.beginPath();
        ctx.moveTo(leftShoulder.x, leftShoulder.y);
        const leftHand = v_add(this.pos, this.leftArmOff)
        ctx.lineTo(leftHand.x, leftHand.y);
        ctx.stroke();

        ctx.save();
        ctx.translate(leftHand.x, leftHand.y);
        const leftArmHeading = v_angle(v_sub(leftHand, leftShoulder));
        ctx.rotate(leftArmHeading);
        // Back half of claw
        ctx.beginPath();
        ctx.ellipse(this.config.size * .3, this.config.size * -0.1, this.config.size * 1.4, this.config.size * 0.88, -0.3, Math.PI, 2 * Math.PI);
        ctx.fill();
        // Front half of claw
        ctx.beginPath();
        ctx.ellipse(this.config.size * .3, this.config.size * 0.1, this.config.size * 1.1, this.config.size * 0.6, 0.3, 0, Math.PI);
        ctx.fill();

        ctx.restore();
        
        const rightShoulder = v_add(this.pos, v_scale(v_for_angle(heading + Math.PI / 2), this.config.size * 1.9));
        ctx.moveTo(rightShoulder.x, rightShoulder.y);
        const rightHand = v_add(this.pos, this.rightArmOff)
        ctx.lineTo(rightHand.x, rightHand.y);
        ctx.stroke();

        ctx.save();
        ctx.translate(rightHand.x, rightHand.y);
        const rightArmHeading = v_angle(v_sub(rightHand, rightShoulder));
        ctx.rotate(rightArmHeading);
        // Front half of claw
        ctx.beginPath();
        ctx.ellipse(this.config.size * .3, this.config.size * -0.1, this.config.size * 1.1, this.config.size * 0.6, -0.3, Math.PI, 2 * Math.PI);
        ctx.fill();
        // Back half of claw
        ctx.beginPath();
        ctx.ellipse(this.config.size * .3, this.config.size * 0.1, this.config.size * 1.4, this.config.size * 0.88, 0.3, 0, Math.PI);
        ctx.fill();

        ctx.restore();

        const eyeRadius = this.config.size * 0.2;
        const eyeCenter = v_add(this, v_scale(this.heading, this.config.size * 0.8));

        const rightEye = v_add(eyeCenter, v_scale(v_right_angle(this.heading), this.config.size * 0.9));
        const leftEye = v_add(eyeCenter, v_scale(v_right_angle(this.heading), -this.config.size * 0.9));

        ctx.fillStyle = 'black';
        v_circle(ctx, rightEye, eyeRadius);
        v_circle(ctx, leftEye, eyeRadius);

        this.config.draw();
    }

    getLegBases() {
        const rightVector = v_right_angle(this.heading);

        const rightLegs = [];
        const leftLegs = [];

        for (let i = 0; i < CRAB_LEG_PAIRS; i++) {
            const frontness = (CRAB_LEG_PAIRS - 2) / 2 - i;
            rightLegs.push(v_add(
                this,
                v_scale(this.heading, frontness * 0.3 * this.config.size),
                v_scale(rightVector, (1.2 + frontness * 0.2) * this.config.size),
            ));
            leftLegs.push(v_add(
                this,
                v_scale(this.heading, frontness * 0.3 * this.config.size),
                v_scale(rightVector, -(1.2 + frontness * 0.2) * this.config.size),
            ));
        }

        return rightLegs.concat(leftLegs);
    }

    getIdealLegEnds() {
        const rightVector = v_right_angle(this.heading);

        const rightLegs = [];
        const leftLegs = [];

        for (let i = 0; i < CRAB_LEG_PAIRS; i++) {
            const frontness = (CRAB_LEG_PAIRS - 3.9) / 2 - i;
            rightLegs.push(v_add(
                this,
                v_scale(this.heading, frontness * 0.7 * this.config.size),
                v_scale(rightVector, (4 - frontness * frontness * 0.1) * this.config.size),
            ));
            leftLegs.push(v_add(
                this,
                v_scale(this.heading, frontness * 0.7 * this.config.size),
                v_scale(rightVector, -(4 - frontness * frontness * 0.1) * this.config.size),
            ));
        }

        return rightLegs.concat(leftLegs);
    }

    getIdealHandPositions() {
        const heading = v_angle(this.heading);
        const armRadius = this.config.size * 4;

        return {
            left: v_scale(v_for_angle(heading - Math.PI / 2 + CRAB_TARGET_ANGLE), armRadius),
            right: v_scale(v_for_angle(heading + Math.PI / 2 - CRAB_TARGET_ANGLE), armRadius),
        };
    }

    getHandPositions(deltaTime) {
        const { left, right } = this.getHandPositions_base();

        return {
            left: v_sub(left, v_scale(this.vel, deltaTime)),
            right: v_sub(right, v_scale(this.vel, deltaTime)),
        };
    }

    getHandPositions_base() {
        let { left, right } = this.getIdealHandPositions();

        if (this.timeSinceEatingLeft < this.config.eatingCooldown / 4) {
            left = v_scale(this.heading, this.config.size * 1.2);
        } else if (this.timeSinceEatingRight < this.config.eatingCooldown / 4) {
            right = v_scale(this.heading, this.config.size * 1.2);
        }

        if (!this.target) {
            return { left, right };
        }

        const realLeft = v_add(this, left);
        const realRight = v_add(this, right);

        const distLeft = dist(realLeft, this.target);
        const distRight = dist(realRight, this.target);

        if (distLeft < distRight) {
            if (distLeft < this.config.eatDist) {
                return {
                    left: v_sub(this.target, this),
                    right,
                };
            } else if (distLeft < this.config.eatDist * 2) {
                const offset = v_sub(this.target, realLeft);
                return {
                    left: v_sub(v_add(
                        realLeft,
                        v_cap_magnitude(offset, this.config.eatDist),
                    ), this),
                    right,
                };
            }
        } else {
            if (distRight < this.config.eatDist) {
                return {
                    left,
                    right: v_sub(this.target, this),
                };
            } else if (distRight < this.config.eatDist * 2) {
                const offset = v_sub(this.target, realLeft);
                return {
                    left,
                    right: v_sub(v_add(
                        realRight,
                        v_cap_magnitude(offset, this.config.eatDist),
                    ), this),
                };
            }
        }

        return { left, right };
    }

    strategy(items) {
        const [left, right] = Array.from(Object.values(this.getIdealHandPositions()))
            .map(v => v_add(v, this));

        const closestItem = selectTarget(
            items,
            this.target,
            this,
            this.config.gameState.strategyConfig,
            item => Math.min(dist(item, left), dist(item, right)) < this.config.eatDist,
        );

        if (!closestItem) {
            this.target = null;
            return { id: 'STOP', rate: IDLE_DECEL };
        }

        if (dist(left, closestItem) < this.config.eatDist) {
            return { id: 'EAT', rate: STOP_DECEL, target: closestItem, arm: 'left' };
        } else if (dist(right, closestItem) < this.config.eatDist) {
            return { id: 'EAT', rate: STOP_DECEL, target: closestItem, arm: 'right' };
        }

        return { id: 'APPROACH', target: closestItem };
    }

    update(deltaTime, items) {
        this.timeSinceEating += deltaTime;
        this.timeSinceEatingLeft += deltaTime;
        this.timeSinceEatingRight += deltaTime;

        const strategy = this.strategy(items);

        const brake = rate => {
            this.vel = v_set_magnitude(
                this.vel,
                Math.max(v_mag(this.vel) - this.config.decelRate * rate * deltaTime, 0),
            );
        };

        if (strategy.id === 'EAT') {
            strategy.target.claimed = true;
            if (this.timeSinceEating >= this.config.eatingCooldown) {
                this.score += strategy.target.eat();
                this.target = null;
                if (strategy.arm === 'left') {
                    this.timeSinceEatingLeft = 0;
                } else {
                    this.timeSinceEatingRight = 0;
                }
                this.timeSinceEating = 0;
            } else {
                this.target = strategy.target;
                brake(strategy.rate);
            }
        } else if (strategy.id === 'STOP') {
            brake(strategy.rate);
        } else if (strategy.id === 'APPROACH') {
            this.target = strategy.target;
            const target = strategy.target;
            target.claimed = true;

            const offset = v_sub(target, this);
            const distance = v_mag(offset);

            const headingAngle = Math.atan2(this.heading.y, this.heading.x);
            const offsetAngle = Math.atan2(offset.y, offset.x);

            const relAngle = relative_angle(headingAngle, offsetAngle);

            if (relAngle < 0) {
                const motionAngle = headingAngle - Math.PI / 2;
                const moveVec = { x: Math.cos(motionAngle), y: Math.sin(motionAngle) };

                const motionRelAngle = relative_angle(motionAngle, offsetAngle);

                const nextHeading = approach_angle(motionAngle, offsetAngle - CRAB_TARGET_ANGLE, this.config.turningRate * deltaTime) + Math.PI / 2;
                this.heading = { x: Math.cos(nextHeading), y: Math.sin(nextHeading) };

                const tooClose = distance < this.config.size * 3;
                const shouldSlowDown = Math.abs(distance - this.config.size * 3) < this.config.size;
                const slowDownFactor = shouldSlowDown ? 0.2 : 1;
                const directionalSpeed = slowDownFactor * (tooClose ? -this.config.speed : this.config.speed);
                let targetSpeed;
                if (tooClose && dot_product(offset, this.vel) < 0) {
                    targetSpeed = approach(-v_mag(this.vel), directionalSpeed, this.config.accelRate * deltaTime);
                } else {
                    targetSpeed = approach(v_mag(this.vel), directionalSpeed, this.config.accelRate * deltaTime);
                }

                if (!tooClose && Math.abs(motionRelAngle - CRAB_TARGET_ANGLE) > 0.1) {
                    brake(0.2);
                } else {
                    this.vel = v_scale(
                        moveVec,
                        targetSpeed,
                    );
                }
            } else {
                const motionAngle = headingAngle + Math.PI / 2;
                const moveVec = { x: Math.cos(motionAngle), y: Math.sin(motionAngle) };

                const motionRelAngle = relative_angle(motionAngle, offsetAngle);

                const nextHeading = approach_angle(motionAngle, offsetAngle + CRAB_TARGET_ANGLE, this.config.turningRate * deltaTime) - Math.PI / 2;
                this.heading = { x: Math.cos(nextHeading), y: Math.sin(nextHeading) };

                const tooClose = distance < this.config.size * 3;
                const shouldSlowDown = Math.abs(distance - this.config.size * 3) < this.config.size;
                const slowDownFactor = shouldSlowDown ? 0.2 : 1;
                const directionalSpeed = slowDownFactor * (tooClose ? -this.config.speed : this.config.speed);
                let targetSpeed;
                if (tooClose && dot_product(offset, this.vel) < 0) {
                    targetSpeed = approach(-v_mag(this.vel), directionalSpeed, this.config.accelRate * deltaTime);
                } else {
                    targetSpeed = approach(v_mag(this.vel), directionalSpeed, this.config.accelRate * deltaTime);
                }

                if (!tooClose && Math.abs(motionRelAngle + CRAB_TARGET_ANGLE) > 0.1) {
                    brake(0.2);
                } else {
                    this.vel = v_scale(
                        moveVec,
                        targetSpeed,
                    );
                }
            }
        }

        this.pos = v_add(this.pos, v_scale(this.vel, deltaTime));

        if (isNaN(this.pos.x) || isNaN(this.pos.y)) {
            console.log(this.vel, deltaTime);
        }

        const handPositions = this.getHandPositions(deltaTime);
        this.leftArmOff = v_lerp(this.leftArmOff, handPositions.left, 0.1);
        this.rightArmOff = v_lerp(this.rightArmOff, handPositions.right, 0.1);

        const ALLOWABLE_DIST = this.config.size;

        const idealLegEnds = this.getIdealLegEnds();
        this.actualLegEnds = this.actualLegEnds.map((legEnd, index) => {
            const idealEnd = idealLegEnds[index];

            if (dist(legEnd, idealEnd) <= ALLOWABLE_DIST) {
                return legEnd;
            }

            return v_add(legEnd, v_scale(v_sub(idealEnd, legEnd), 1.9));
        });

        this.visualLegEnds = this.visualLegEnds.map((end, index) => {
            return v_lerp(end, this.actualLegEnds[index], 0.3);
        });
    }
}

const CRAB_RADIUS = 7;
const CRAB_EAT_DIST = 12;

class CrabConfig {
    static instance = null;

    static get(gameState) {
        if (CrabConfig.instance) {
            return CrabConfig.instance;
        }

        const i = new CrabConfig(gameState);
        CrabConfig.instance = i;

        return i;
    }

    constructor(gameState) {
        this.gameState = gameState;

        this.eatDist = CRAB_EAT_DIST;
        this.size = CRAB_RADIUS;

        this.decelRate = 360;
        this.maxEatingSpeed = MAX_EATING_SPEED;
        this.accelRate = ACCEL_RATE;
        this.speed = SPEED;

        this.turningRate = 1;

        this.eatingCooldown = 2;

        const box = document.getElementById('controls');

        const title = createElement('strong', { text: 'Crab' });

        this.upgrades = CRAB_UPGRADES.map(list => {
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

const CRAB_UPGRADES = [
    [
        { cost: 1, speed: 130, accel: 150, decel: 480, turning: 1.3 },
        { cost: 10, speed: 160, accel: 190, decel: 600, turning: 1.6 },
        { cost: 100, speed: 200, accel: 280, decel: 720, turning: 1.9 },
        { cost: 500, speed: 250, accel: 400, decel: 900, turning: 2.2 },
        { cost: 2000, speed: 310, accel: 800, decel: 1200, turning: 2.5 },
        { cost: 5000, speed: 380, accel: 1000, decel: 1800, turning: 3 },
    ]
        .map(({ cost, speed, accel, decel, turning }) => ({
            id: 'crab-speed',
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
            id: 'crab-eat',
            text: 'Eat faster',
            cost,
            upgrade: config => {
                config.eatingCooldown = value;
            },
        })),
];
