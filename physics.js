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

const v_add = (...args) => {
    const sum = { x: 0, y: 0 };

    for (const v of args) {
        sum.x += v.x;
        sum.y += v.y;
    }

    return sum;
};

const v_sub = (a, b) => {
    return { x: a.x - b.x, y: a.y - b.y };
};

const v_scale = (v, t) => {
    return { x: v.x * t, y: v.y * t };
};

const v_mag = v => Math.hypot(v.x, v.y);

const v_set_magnitude = (v, magnitude) => {
    const current = v_mag(v);

    if (current === 0) return v_add(v);

    return v_scale(v, magnitude / current);
};

const v_cap_magnitude = (v, max_magnitude) => {
    const current = v_mag(v);

    if (current <= max_magnitude) {
        return v;
    }

    return v_scale(v, max_magnitude / current);
};

const dot_product = (a, b) => {
    return a.x * b.x + a.y * b.y;
};

const is_angle_higher = (currentAngle, targetAngle) => {
    if (targetAngle > currentAngle && targetAngle - currentAngle < Math.PI) {
        return true;
    } else if (targetAngle < currentAngle && currentAngle - targetAngle < Math.PI) {
        return false;
    } else if (targetAngle > currentAngle) {
        return false;
    }

    return true;
}

const approach_angle = (currentAngle, targetAngle, step) => {
    if (is_angle_higher(currentAngle, targetAngle)) {
        const next = currentAngle + step;
        if (next > Math.PI) {
            if (next > targetAngle + 2 * Math.PI) {
                return targetAngle;
            }

            return next;
        }

        if (currentAngle < targetAngle && targetAngle < next) {
            return targetAngle;
        }

        return next;
    } else {
        const next = currentAngle - step;

        if (next < - Math.PI) {
            if (next < targetAngle - 2 * Math.PI) {
                return targetAngle;
            }

            return next;
        }

        if (currentAngle > targetAngle && next < targetAngle) {
            return targetAngle
        }

        return next;
    }
};

const sigmoid = (steepness, median, x) => {
    return 1 / (1 + Math.exp(- steepness * (x - median)));
};
