const CRAB_TARGET_ANGLE = 0.1;

class Crab {
    constructor(x, y, gameState) {
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

        this.hovered = false;

        this.config = new CrabConfig(this, gameState);

        this.heading = { x: 1, y: 0 };

        this.leftArmOff = { x: 5, y: -30 };
        this.rightArmOff = { x: 5, y: 30 };
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

        ctx.fillStyle = 'orange';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.config.size, this.config.size * 2, heading, 0, 2 * Math.PI);
        ctx.fill();

        ctx.lineWidth = this.config.size * 0.4;
        ctx.strokeStyle = 'orange';
        const leftShoulder = v_add(this.pos, v_scale(v_for_angle(heading - Math.PI / 2), this.config.size * 2));
        ctx.beginPath();
        ctx.moveTo(leftShoulder.x, leftShoulder.y);
        const leftHand = v_add(this.pos, this.leftArmOff)
        ctx.lineTo(leftHand.x, leftHand.y);
        
        const rightShoulder = v_add(this.pos, v_scale(v_for_angle(heading + Math.PI / 2), this.config.size * 2));
        ctx.moveTo(rightShoulder.x, rightShoulder.y);
        const rightHand = v_add(this.pos, this.rightArmOff)
        ctx.lineTo(rightHand.x, rightHand.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(leftHand.x, leftHand.y, this.config.size * 0.75, this.config.size * 0.75, 0, 0, 2 * Math.PI);
        ctx.ellipse(rightHand.x, rightHand.y, this.config.size * 0.75, this.config.size * 0.75, 0, 0, 2 * Math.PI);
        ctx.fill();

        ctx.lineWidth = 1;
        if (this.target) {
            ctx.strokeStyle = 'yellow';
            ctx.beginPath();
            ctx.ellipse(this.target.x, this.target.y, 12, 12, 0, 0, 2 * Math.PI);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + this.heading.x * 100, this.y + this.heading.y * 100);
            ctx.stroke();
        }

        ctx.strokeStyle = 'yellow';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.config.eatDist, this.config.eatDist, 0, 0, 2 * Math.PI);
        ctx.stroke();

        this.config.draw();
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

            const BEST_TO_CHOOSE = 3;

            const result = chooseRandom(bestNItems(weights, BEST_TO_CHOOSE));

            if (result) {
                closestItem = result.item;
            } else {
                throw Error('Failed to select item');
            }
        }

        const [left, right] = Array.from(Object.values(this.getIdealHandPositions()))
            .map(v => v_add(v, this));

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
            if (this.timeSinceEating >= this.config.eatingCooldown) {
                this.score += strategy.target.eat();
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

            const offset = v_sub(target, this);

            const headingAngle = Math.atan2(this.heading.y, this.heading.x);
            const offsetAngle = Math.atan2(offset.y, offset.x);

            const relAngle = relative_angle(headingAngle, offsetAngle);

            if (relAngle < 0) {
                const motionAngle = headingAngle - Math.PI / 2;
                const moveVec = { x: Math.cos(motionAngle), y: Math.sin(motionAngle) };

                const motionRelAngle = relative_angle(motionAngle, offsetAngle);

                const nextHeading = approach_angle(motionAngle, offsetAngle - CRAB_TARGET_ANGLE, this.config.turningRate * deltaTime) + Math.PI / 2;
                this.heading = { x: Math.cos(nextHeading), y: Math.sin(nextHeading) };

                const tooClose = v_mag(offset) < this.config.size * 3;
                const directionalSpeed = tooClose ? -this.config.speed : this.config.speed;
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

                const tooClose = v_mag(offset) < this.config.size * 3;
                const directionalSpeed = tooClose ? -this.config.speed : this.config.speed;
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

        // if (this.vel.x !== 0 || this.vel.y !== 0) {
        //     this.heading = v_set_magnitude(this.vel, 1);
        // }

        if (isNaN(this.pos.x) || isNaN(this.pos.y)) {
            console.log(this.vel, deltaTime);
        }

        const handPositions = this.getHandPositions(deltaTime);
        this.leftArmOff = v_lerp(this.leftArmOff, handPositions.left, 0.1);
        this.rightArmOff = v_lerp(this.rightArmOff, handPositions.right, 0.1);
    }
}


class CrabConfig {
    constructor(parent, gameState) {
        this.parent = parent;
        this.gameState = gameState;

        this.eatDist = EAT_DIST;
        this.size = RADIUS;
        this.headSize = RADIUS * 0.75;

        this.decelRate = 360;
        this.maxEatingSpeed = MAX_EATING_SPEED;
        this.accelRate = ACCEL_RATE;
        this.speed = SPEED;

        this.turningRate = 1.8;

        this.eatingCooldown = 2;

        const box = document.getElementById('controls');

        const upgradeBox = createElement('div');
        this.upgrades = UPGRADES.map(list => {
            return new Upgrade(list, this);
        });

        this.upgrades.forEach(upgrade => {
            upgradeBox.appendChild(upgrade.button);
        });

        const myDiv = createElement('div', {
            classList: ['creature-control-box'],
            children: this.upgrades.map(u => u.button),
        });

        myDiv.addEventListener('mouseenter', () => {
            this.parent.hovered = true;
        });
        myDiv.addEventListener('mouseleave', () => {
            this.parent.hovered = false;
        });

        box.appendChild(myDiv);
    }

    draw() {
        this.upgrades.forEach(upgrade => upgrade.draw());
    }
}

const CRAB_UPGRADES = [
    [
        { cost: 1, speed: 130, accel: 150, decel: 480, turning: 2.2 },
        { cost: 10, speed: 170, accel: 190, decel: 600, turning: 3 },
        { cost: 50, speed: 250, accel: 280, decel: 720, turning: 4.5 },
        { cost: 250, speed: 400, accel: 400, decel: 900, turning: 6 },
        { cost: 1000, speed: 550, accel: 800, decel: 1200, turning: 8 },
        { cost: 2500, speed: 720, accel: 1000, decel: 1800, turning: 10 },
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
        { cost: 50, value: 1.0 },
        { cost: 250, value: 0.75 },
        { cost: 1000, value: 0.4 },
        { cost: 2500, value: 0.3 },
        { cost: 8000, value: 0.22 },
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
        { cost: 50, value: 30 },
        { cost: 250, value: 33 },
        { cost: 1000, value: 36 },
        { cost: 3000, value: 40 },
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
