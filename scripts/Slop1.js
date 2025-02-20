const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
function resizeCanvas(width, height) {
    canvas.width = width;
    canvas.height = height;
}
resizeCanvas(window.innerWidth, window.innerHeight);

function saveCanvasAsImage() {
    const canvas = document.getElementById('canvas');
    const image = canvas.toDataURL("image/png");

    const link = document.createElement('a');
    link.href = image;
    link.download = `ascz_image_${Date.now()}.png`;
    link.click();
}

let hudSelect = -1; // Current selected window
const hudContainer = document.getElementById('hud-container');
const hudWindows = document.querySelectorAll('.sub-hud');
function selectHUDWindow(index) {
    for (let i = 0; i < hudWindows.length; i++) {
        hudWindows[i].style.opacity = i == index ? 1 : 0.3;
        hudWindows[i].style.zIndex = i == index ? 1 : 0;
    }
}
// A movable (drag) HUD window
for (let i = 0; i < hudWindows.length; i++) {
    const w = hudWindows[i];

    let preX = 0, preY = 0;
    let curX = 0, curY = 0;

    w.onmousedown = (e) => {
        let offsetX = e.clientX - w.getBoundingClientRect().left;
        let offsetY = e.clientY - w.getBoundingClientRect().top;

        document.onmousemove = (e) => {
            let winW = window.innerWidth;
            let winH = window.innerHeight;

            let x = e.clientX - offsetX;
            let y = e.clientY - offsetY;
            curX = x; curY = y;

            if (x < 0) x = 0;
            if (y < 0) y = 0;
            if (x + w.offsetWidth > winW - 1) x = winW - w.offsetWidth - 1;
            if (y + w.offsetHeight > winH - 1) y = winH - w.offsetHeight - 1;

            w.style.left = x + 'px';
            w.style.top = y + 'px';
        }

        document.onmouseup = () => {
            document.onmousemove = null;
            document.onmouseup = null;
        }
    }

    w.onclick = (e) => {
        if (curX == preX && curY == preY) selectHUDWindow(i);
        preX = curX; preY = curY;
    }
}

// Event's variables
let camSpd = 0.5;
let mSens = 0.007;
let pointerLock = false;

// Canvas pointer lock
canvas.onclick = () => canvas.requestPointerLock();
document.addEventListener('pointerlockchange', () => {
    pointerLock = document.pointerLockElement === canvas;
    selectHUDWindow(-1);
});
canvas.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement !== canvas) return;

    camera.yaw += e.movementX * mSens;
    camera.pit -= e.movementY * mSens;
    camera.update();
});
document.addEventListener('wheel', (e) => {
    if (!pointerLock) return;

    camera.fov += e.deltaY > 0 ? -5 : 5;
    if (camera.fov < 10) camera.fov = 10;
    if (camera.fov > 170) camera.fov = 170;
});
// Keyboard movement event
const keys = {
    // WASD keys
    w: false, a: false, s: false, d: false,
    // Shift and control keys
    Shift: false, Control: false
}
function cameraMove() {
    if (keys.w) {
        camera.pos = Flt3.add(camera.pos, Flt3.mult(camera.forward, camSpd));
    } else if (keys.s) {
        camera.pos = Flt3.sub(camera.pos, Flt3.mult(camera.forward, camSpd));
    }

    if (keys.a) {
        camera.pos = Flt3.sub(camera.pos, Flt3.mult(camera.right, camSpd));
    } else if (keys.d) {
        camera.pos = Flt3.add(camera.pos, Flt3.mult(camera.right, camSpd));
    }
}
document.addEventListener('keydown', (e) => {
    if (e.key in keys) keys[e.key] = true;
    // Press Escape to exit pointer lock
    if (e.key == "Escape") {
        document.exitPointerLock();
    }   

    // Press Q to toggle super quality mode
    if (e.key == "q") toggleSuperQuality();

    // Press 1 -> N to toggle HUD windows
    if (e.key >= "1" && e.key <= "9") {
        let index = parseInt(e.key) - 1;
        let input = document.getElementById(`hud-checkbox-${index}`);
        if (input) input.checked = !input.checked;
    }
});
document.addEventListener('keyup', (e) => {
    if (e.key in keys) keys[e.key] = false;
});