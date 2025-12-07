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

const v_angle = ({ x, y }) => Math.atan2(y, x);

const v_for_angle = angle => {
    return { x: Math.cos(angle), y: Math.sin(angle) };
};

const v_lerp = (a, b, t) => {
    return v_add(
        v_scale(a, 1 - t),
        v_scale(b, t),
    );
};

const v_right_angle = v => {
    return { x: -v.y, y: v.x };
};

const dot_product = (a, b) => {
    return a.x * b.x + a.y * b.y;
};

const is_angle_higher = (currentAngle, targetAngle) => {
    const relAngle = relative_angle(currentAngle, targetAngle);

    return relAngle > 0;
}

const relative_angle = (referencePoint, targetAngle) => {
    const difference = targetAngle - referencePoint;
    if (difference < -Math.PI) {
        return difference + 2 * Math.PI;
    } else if (difference <= Math.PI) {
        return difference;
    } else {
        return difference - 2 * Math.PI;
    }
};

const approach_angle = (currentAngle, targetAngle, step) => {
    const relAngle = relative_angle(currentAngle, targetAngle);

    if (relAngle > 0) {
        if (step >= relAngle) {
            return targetAngle;
        }

        return currentAngle + step;
    } else {
        if (step >= -relAngle) {
            return targetAngle;
        }

        return currentAngle - step;
    }
};

const sigmoid = (steepness, median, x) => {
    return 1 / (1 + Math.exp(- steepness * (x - median)));
};
