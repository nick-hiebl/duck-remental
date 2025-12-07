const v_line = (ctx, v1, v2) => {
    ctx.beginPath();
    ctx.moveTo(v1.x, v1.y);
    ctx.lineTo(v2.x, v2.y);
    ctx.stroke();
};

const v_circle = (ctx, v, radius) => {
    ctx.beginPath();
    ctx.ellipse(v.x, v.y, radius, radius, 0, 0, 2 * Math.PI);
    ctx.fill();
};
