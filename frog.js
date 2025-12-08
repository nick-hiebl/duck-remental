

class Frog {
    constructor(x, y, gameState) {
        this.id = Math.random().toString().slice(2);

        this.x = x;
        this.y = y;

        this.vx = 0;
        this.vy = 0;

        this.score = 0;
        this.timeSinceEating = 0;

        this.target = null;

        this.config = FrogConfig.get(gameState);
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
        ctx.fillStyle = 'green';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.config.size, this.config.size, 0, 0, 2 * Math.PI);
        ctx.fill();
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

        if (dist(this, closestItem) < this.config.tongueDist) {
            return { id: 'EAT', target: closestItem };
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
                // Idk draw eating or smth
            } else {
                // Wait ig
            }
        } else if (strategy.id === 'STOP') {
            // Wait ig
        } else if (strategy.id === 'APPROACH') {
            this.target = strategy.target;
            const target = strategy.target;

            const offset = v_sub(target, this);

            this.pos = v_add(this.pos, v_cap_magnitude(offset, 30 * deltaTime));
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
        this.tongueDist = 40;
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
        { cost: 1, value: 12 },
    ]
        .map(({ cost, value }) => ({
            text: 'Bigger',
            cost,
            upgrade: config => {
                config.size = value;
            },
        })),
];
