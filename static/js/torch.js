const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
document.body.appendChild(canvas);

canvas.style.position = "fixed";
canvas.style.top = "0";
canvas.style.left = "0";
canvas.style.pointerEvents = "none";
canvas.style.touchAction = "none";
canvas.style.zIndex = "9999";

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let pointer = {
    x: canvas.width / 2,
    y: canvas.height / 2
};

let dustParticles = [];
const dustCount = 80;

// Mouse support
window.addEventListener("mousemove", (e) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
});

// Touch support
window.addEventListener("touchmove", (e) => {
    pointer.x = e.touches[0].clientX;
    pointer.y = e.touches[0].clientY;
});

window.addEventListener("touchstart", (e) => {
    pointer.x = e.touches[0].clientX;
    pointer.y = e.touches[0].clientY;
});

class Dust {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.speedY = (Math.random() - 0.5) * 0.3;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x > canvas.width) this.x = 0;
        if (this.x < 0) this.x = canvas.width;

        if (this.y > canvas.height) this.y = 0;
        if (this.y < 0) this.y = canvas.height;
    }

    draw() {
        const dx = this.x - pointer.x;
        const dy = this.y - pointer.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const lightRadius = window.innerWidth < 768 ? 350 : 250;

        if (distance < lightRadius) {
            ctx.fillStyle = "rgba(255,255,220,0.6)";
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

function initDust() {
    dustParticles = [];
    for (let i = 0; i < dustCount; i++) {
        dustParticles.push(new Dust());
    }
}

function drawTorch() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Torch flicker
    const flicker = Math.random() * 25;
    const radius = (window.innerWidth < 768 ? 350 : 250) + flicker;

    const gradient = ctx.createRadialGradient(
        pointer.x,
        pointer.y,
        0,
        pointer.x,
        pointer.y,
        radius
    );

    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(0.3, "rgba(0,0,0,0.35)");
    gradient.addColorStop(0.6, "rgba(0,0,0,0.75)");
    gradient.addColorStop(1, "rgba(0,0,0,0.97)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw dust
    dustParticles.forEach((p) => {
        p.update();
        p.draw();
    });

    requestAnimationFrame(drawTorch);
}

initDust();
drawTorch();

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initDust();
});