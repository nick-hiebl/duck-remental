class Actor {
    constructor(x, y, width, height) {
        this.x = Math.round(x);
        this.xOff = x - this.x;
        this.y = Math.round(y);
        this.yOff = y - this.y;
        this.width = width;
        this.height = height;
    }

    moveX(xAmount, solids) {
        if (xAmount === 0) {
            return;
        }

        const currentX = this.x;
        const endPreciseX = this.x + this.xOff + xAmount;
        const endX = Math.round(endPreciseX);

        if (endX === currentX) {
            this.xOff = endPreciseX - endX;
            return;
        }

        const xMoveDirection = endX > currentX ? 1 : -1;

        while (this.x !== endX) {
            this.x += xMoveDirection;

            if (solids.some(solid => overlaps(this, solid))) {
                this.x -= xMoveDirection;
                this.xOff = 0;
                break;
            }
        }

        if (this.x === this.endX) {
            this.xOff = endPreciseX - endX;
        }
    }

    moveY(yAmount, solids) {
        if (yAmount === 0) {
            return;
        }

        const currentY = this.y;
        const endPreciseY = this.y + this.yOff + yAmount;
        const endY = Math.round(endPreciseY);

        if (endY === currentY) {
            this.yOff = endPreciseY - endY;
            return;
        }

        const yMoveDirection = endY > currentY ? 1 : -1;

        while (this.y !== endY) {
            this.y += yMoveDirection;

            if (solids.some(solid => overlaps(this, solid))) {
                this.y -= yMoveDirection;
                this.yOff = 0;
                break;
            }
        }

        if (this.y === this.endY) {
            this.yOff = endPreciseY - endY;
        }
    }
}
