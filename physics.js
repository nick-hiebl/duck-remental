const overlaps = (r1, r2) => {
    const xOverlaps = r1.x < r2.x + r2.width && r2.x < r1.x + r1.width;
    const yOverlaps = r1.y < r2.y + r2.height && r2.y < r1.y + r1.height;

    return xOverlaps && yOverlaps;
};

const getGroundingRect = rect => {
    return { x: rect.x, width: rect.width, y: rect.y + rect.height, height: 1 };
};
