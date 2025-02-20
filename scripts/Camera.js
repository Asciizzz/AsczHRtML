
class Camera {
    constructor() {
        this.pos = { x: 0, y: 0, z: 0 };

        this.yaw = 0;
        this.pit = 0;

        this.fov = 90;

        this.forward = { x: 0, y: 0, z: 1 };
        this.right = { x: 1, y: 0, z: 0 };
        this.up = { x: 0, y: 1, z: 0 };
    }

    restrictRot() {
        // Restrict pit to -PI/2 to PI/2
        if (this.pit <= -Math.PI / 2) this.pit = -Math.PI / 2 + 0.001;
        else if (this.pit >= Math.PI / 2) this.pit = Math.PI / 2 - 0.001;

        // Restrict yaw to -2PI to 2PI
        if (this.yaw <= 0) this.yaw += Math.PI * 2;
        else if (this.yaw >= Math.PI * 2) this.yaw -= Math.PI * 2;
    }

    updateView() {
        this.forward = {
            x: Math.sin(this.yaw) * Math.cos(this.pit),
            y: Math.sin(this.pit),
            z: Math.cos(this.yaw) * Math.cos(this.pit)
        };
        this.forward = Flt3.norm(this.forward);

        this.right = Flt3.cross({ x: 0, y: 1, z: 0 }, this.forward);
        this.right = Flt3.norm(this.right);

        this.up = Flt3.cross(this.forward, this.right);
        this.up = Flt3.norm(this.up);
    }

    update() {
        this.restrictRot();
        this.updateView();
    }

    getScrnNDC(x, y, w, h) {
        return {
            x: (2 * x - w) / w,
            y: (h - 2 * y) / h
        }
    }

    generateRay(x, y, w, h) {
        let ndc = this.getScrnNDC(x, y, w, h);

        let tanFov = Math.tan(this.fov * Math.PI / 360);

        let rayDir = Flt3.add(
            this.forward,
            Flt3.add(
                Flt3.mult(this.right, ndc.x * tanFov * w / h),
                Flt3.mult(this.up, ndc.y * tanFov)
            )
        );

        rayDir = Flt3.norm(rayDir);

        return new Ray(this.pos, rayDir);
    }
}