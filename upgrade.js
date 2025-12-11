class Upgrade {
    constructor(levels, config) {
        this.config = config;
        this.levels = levels;
        this.id = levels[0].id;

        this.progress = 0;

        this.nameSpan = createElement('span', { text: levels[0].text });
        this.levelSpan = createElement('span', { text: 'level 0' });

        const div1 = createElement('div', {
            children: [
                this.nameSpan,
                createTextNode(' ('),
                this.levelSpan,
                createTextNode(')'),
            ],
        });

        this.priceSpan = createElement('span', { text: levels[0].cost });

        const div2 = createElement('div', {
            children: [
                createTextNode('Cost: '),
                this.priceSpan,
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
                        this.setLevel(this.progress);
                    }
                },
            },
        });
    }

    setLevel(level) {
        if (!this.levels[level - 1]) {
            return;
        }

        this.progress = level;

        if (this.levels[this.progress]) {
            this.nameSpan.textContent = this.levels[this.progress].text;
            this.levelSpan.textContent = `level ${this.progress}`;
            this.priceSpan.textContent = this.levels[this.progress].cost;
            this.levels[this.progress - 1].upgrade(this.config);
        } else if (this.levels[this.progress - 1]) {
            this.nameSpan.textContent = this.levels[this.progress - 1].text;
            this.priceSpan.textContent = this.levels[this.progress - 1].cost;
            this.levelSpan.textContent = `MAX`;
            this.levels[this.progress - 1].upgrade(this.config);
        } else {
            this.levelSpan.textContent = `MAX`;
            this.levels[this.levels.length - 1].upgrade(this.config);
        }
    }

    draw() {
        if (this.progress >= this.levels.length || this.config.gameState.unspentPoints < this.levels[this.progress].cost) {
            this.button.disabled = true;
        } else {
            this.button.disabled = false;
        }
    }
}
