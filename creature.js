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
    constructor(x, y, gameState) {
        this.id = Math.random().toString().slice(2);

        this.x = x;
        this.y = y;

        this.vx = 0;
        this.vy = 0;

        this.score = 0;
        this.timeSinceEating = 0;

        this.target = null;

        this.hovered = false;

        this.config = new CreatureConfig(this, gameState);
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

        this.config.draw();
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
    constructor(parent, gameState) {
        this.parent = parent;
        this.gameState = gameState;

        this.eatDist = EAT_DIST;
        this.size = RADIUS;

        this.decelRate = 360;
        this.maxEatingSpeed = MAX_EATING_SPEED;
        this.accelRate = ACCEL_RATE;
        this.speed = SPEED;

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
            children: [
                createTextNode(parent.id),
                upgradeBox,
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

    draw() {
        this.upgrades.forEach(upgrade => upgrade.draw());
    }
}

class Upgrade {
    constructor(levels, config) {
        this.config = config;
        this.levels = levels;

        this.progress = 0;

        const name = createElement('span', { text: levels[0].text });
        const levelSpan = createElement('span', { text: '1' });

        const div1 = createElement('div', {
            children: [
                name,
                createTextNode(' (level '),
                levelSpan,
                createTextNode(')'),
            ],
        });

        const priceSpan = createElement('span', { text: levels[0].cost });

        const div2 = createElement('div', {
            children: [
                createTextNode('Cost: '),
                priceSpan,
            ],
        });

        this.button = createElement('button', {
            children: [div1, div2],
            eventHandlers: {
                click: () => {
                    const relevantStage = this.levels[this.progress];

                    if (!relevantStage) {
                        return;
                    }

                    if (this.config.gameState.unspentPoints >= relevantStage.cost) {
                        this.config.gameState.unspentPoints -= relevantStage.cost;
                        this.progress += 1;
                        relevantStage.upgrade(this.config);

                        if (this.levels[this.progress]) {
                            name.textContent = this.levels[this.progress].text;
                            levelSpan.textContent = this.progress;
                            priceSpan.textContent = this.levels[this.progress].cost;
                        } else {
                            levelSpan.textContent = 'MAX';
                        }
                    }
                },
            },
        });
    }

    draw() {
        if (this.progress >= this.levels.length || this.config.gameState.unspentPoints < this.levels[this.progress].cost) {
            this.button.disabled = true;
        } else {
            this.button.disabled = false;
        }
    }
}

const UPGRADES = [
    [
        {
            text: 'Faster',
            cost: 1,
            upgrade: config => {
                config.speed = 130;
                config.accelRate = 150;
                config.decelRate = 420;
            },
        },
        {
            text: 'More fast',
            cost: 10,
            upgrade: config => {
                config.speed = 170;
                config.accelRate = 190;
                config.decelRate = 480;
            },
        },
        {
            text: 'Even faster',
            cost: 50,
            upgrade: config => {
                config.speed = 250;
                config.accelRate = 280;
                config.decelRate = 520;
            },
        },
        {
            text: 'Turbo speed',
            cost: 250,
            upgrade: config => {
                config.speed = 400;
                config.accelRate = 400;
                config.decelRate = 600;
            },
        },
        {
            text: 'Lightning speed',
            cost: 1000,
            upgrade: config => {
                config.speed = 550;
                config.accelRate = 800;
                config.decelRate = 720;
            },
        },
    ],
    [
        { text: 'Hungry', cost: 1, upgrade: config => { config.eatingCooldown = 1.6 } },
        { text: 'Fast eater', cost: 10, upgrade: config => { config.eatingCooldown = 1.3 } },
        { text: 'Record eater', cost: 50, upgrade: config => { config.eatingCooldown = 1.0 } },
        { text: 'Monster stomach', cost: 250, upgrade: config => { config.eatingCooldown = 0.75 } },
        { text: 'Demonic hunger', cost: 1000, upgrade: config => { config.eatingCooldown = 0.4 } },
    ],
    [
        { text: 'Eating radius', cost: 1, upgrade: config => { config.eatDist = 24 } },
        { text: 'Long reach', cost: 10, upgrade: config => { config.eatDist = 30 } },
        { text: 'Eat further', cost: 50, upgrade: config => { config.eatDist = 36 } },
        { text: 'Longer neck', cost: 250, upgrade: config => { config.eatDist = 48 } },
        { text: 'Wide chomping berth', cost: 1000, upgrade: config => { config.eatDist = 56 } },
    ],
];
