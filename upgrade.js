class Upgrade {
    constructor(levels, config) {
        this.config = config;
        this.levels = levels;

        this.progress = 0;

        const name = createElement('span', { text: levels[0].text });
        const levelSpan = createElement('span', { text: 'level 0' });

        const div1 = createElement('div', {
            children: [
                name,
                createTextNode(' ('),
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
                            levelSpan.textContent = `level ${this.progress}`;
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
