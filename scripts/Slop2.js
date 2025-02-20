function toggleSuperQuality() {
    superQuality = !superQuality;
    if (superQuality) {
        scale = 1;
        width = window.innerWidth;
        height = window.innerHeight;
    } else {
        scale = 10;
        width = Math.floor(window.innerWidth / scale);
        height = Math.floor(window.innerHeight / scale);
    }

    // In super quality mode, turn off the interval
    if (superQuality) {
        clearInterval(interval);
        document.exitPointerLock();
        renderQuality();

        staticUpdateHud();
        runtimeUpdateHud();
    } else {
        interval = setInterval(renderFast, 1000 / 60);
    }
}
window.onresize = () => {
    // Ignore resizing in super quality mode
    if (superQuality) return;

    resizeCanvas(window.innerWidth, window.innerHeight);
    width = Math.floor(window.innerWidth / scale);
    height = Math.floor(window.innerHeight / scale);
}

function aliasUpdate(id, value) {
    document.getElementById(id).innerHTML = value;
}

function runtimeUpdateHud() {
    aliasUpdate("hud-camera-pos", Flt3.toStr(camera.pos));
    aliasUpdate("hud-camera-yaw", `${camera.yaw.toFixed(2)}rad | ${(camera.yaw * 180 / Math.PI).toFixed(2)}°`);
    aliasUpdate("hud-camera-pit", `${camera.pit.toFixed(2)}rad | ${(camera.pit * 180 / Math.PI).toFixed(2)}°`);
    aliasUpdate("hud-camera-fov", `${camera.fov}°`);
    aliasUpdate("hud-camera-fw", Flt3.toStr(camera.forward));
    aliasUpdate("hud-camera-rt", Flt3.toStr(camera.right));
    aliasUpdate("hud-camera-up", Flt3.toStr(camera.up));

    const hudLight = document.getElementsByClassName("hud-light");
    const hudLightPos = document.getElementsByClassName("hud-light-pos");
    const hudLightFollow = document.getElementsByClassName("hud-light-follow");
    const hudLightColor = document.getElementsByClassName("hud-light-color");

    for (let i = 0; i < lightSrcs.length; i++) {
        if (!hudLight[i]) continue;

        hudLight[i].style.border = `1px solid ${lightSrcs[i].disabled?'#f99':'#9f9'}`;

        hudLightPos[i].innerHTML = `| Position: (${Flt3.toStr(lightSrcs[i].pos)})`;
        hudLightFollow[i].innerHTML = `| Follow: ${lightSrcs[i].follow?
            "<span style='color:#9f9'>[ON]</span>":
            "<span style='color:#f99'>[OFF]</span>"
        }`;

        hudLightColor[i].innerHTML = `| Color: (${lightSrcs[i].color.r}, ${lightSrcs[i].color.g}, ${lightSrcs[i].color.b})`;
        hudLightColor[i].style.color = `rgb(${lightSrcs[i].color.r*255}, ${lightSrcs[i].color.g*255}, ${lightSrcs[i].color.b*255})`;
    }
}
function staticUpdateHud() {
    // Update Light Sources Container
    const hudLightContainer = document.getElementById("hud-light-container");
    hudLightContainer.innerHTML = "";
    for (let i = 0; i < lightSrcs.length; i++) {
        hudLightContainer.innerHTML += (`
        <div class="hud-light" style="color:#fff;">
            <h2>Light ${i + 1}</h2>
            <h3 class="hud-light-pos"></h3>
            <h3 class="hud-light-follow"></h3>
            <h3 class="hud-light-color"></h3>
            <div>
                <button onclick="toggleLightFollow(${i})">Follow</button>
                <button onclick="lightSrcs[${i}].disabled=!lightSrcs[${i}].disabled">Toggle</button>
                <button onclick="removeLightSrc(${i});staticUpdateHud()">Remove</button>
            </div>
        </div>
        `);
    }
    hudLightContainer.innerHTML += (`
    <button class="hud-cool-button" onclick="
        lightSrcs.push({pos:{x:0,y:0,z:0},follow:true,color:{r:1,g:1,b:1}});
        staticUpdateHud()
    ">
        <h1>Add Light</h1>
        <h2>+1</h2>
    </button>
    `);
};
staticUpdateHud();