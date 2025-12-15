class Monitoring {
    constructor(resolution, history, mode = 'sum') {
        this.resolution = resolution;
        this.historyLength = history;
        this.data = new Array(history).fill(0);
        this.current = 0;
        this.mode = mode;
    }

    insert(value, timestamp) {
        const currentWindow = Math.floor(timestamp / this.resolution) % this.historyLength;

        if (this.current !== currentWindow) {
            this.data[currentWindow] = 0;
            this.current = currentWindow;
        }

        if (this.mode === 'sum') {
            this.data[currentWindow] += value;
        } else if (this.mode === 'max') {
            this.data[currentWindow] = Math.max(this.data[currentWindow], value);
        }
    }

    read(timestamp) {
        const currentWindow = Math.floor(timestamp / this.resolution) % this.historyLength;

        return this.data.slice(currentWindow + 1).concat(this.data.slice(0, currentWindow + 1));
    }

    draw(ctx, w, h, timestamp) {
        const maxValue = produceMax(Math.max(...this.data)) || 0;
        const HEIGHT = 100;
        const WIDTH = 160;
        const INSET = 10;

        ctx.save();
        ctx.translate(INSET, h - INSET);

        ctx.fillStyle = '#0006';
        ctx.fillRect(0, -HEIGHT, WIDTH, HEIGHT);
        
        ctx.strokeStyle = 'black';
        ctx.lineCap = 'round';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, -HEIGHT, WIDTH, HEIGHT);

        const data = this.read(timestamp);

        ctx.strokeStyle = 'red';
        let lastValue = HEIGHT * data[0] / maxValue;
        ctx.beginPath();
        ctx.moveTo(0, -lastValue);
        for (let i = 0; i < data.length; i++) {
            const x = WIDTH / this.historyLength * (i + 1);
            const y = HEIGHT * data[i] / maxValue;

            ctx.lineTo(x, -y);
        }

        ctx.stroke();

        ctx.fillStyle = 'white';
        ctx.font = '12px sans-serif';
        ctx.fillText(maxValue.toString(), 0, -HEIGHT + 12);

        ctx.restore();
    }
}

const produceMax = num => {
    const base = Math.pow(10, Math.ceil(Math.log10(num) - 2));

    return base * Math.ceil(num / base);
};
