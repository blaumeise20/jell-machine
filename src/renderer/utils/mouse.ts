export const mouse = {
    x: 0,
    y: 0
};

window.addEventListener("mousemove", e => (mouse.x = e.clientX, mouse.y = e.clientY));
