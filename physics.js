const overlaps = (r1, r2) => {
    const xOverlaps = r1.x < r2.x + r2.width && r2.x < r1.x + r1.width;
    const yOverlaps = r1.y < r2.y + r2.height && r2.y < r1.y + r1.height;

    return xOverlaps && yOverlaps;
};

const getGroundingRect = rect => {
    return { x: rect.x, width: rect.width, y: rect.y + rect.height, height: 1 };
};

const approach = (current, target, step) => {
    if (current > target) {
        return Math.max(current - step, target);
    } else {
        return Math.min(current + step, target);
    }
};

const dist = (p1, p2) => {
    return Math.hypot(p1.x - p2.x, p1.y - p2.y);
};
