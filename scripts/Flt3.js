
class Flt3 {
    // Basic vector operations
    static mult(v, s) {
        return { x: v.x * s, y: v.y * s, z: v.z * s };
    }
    static add(v1, v2) {
        return { x: v1.x + v2.x, y: v1.y + v2.y, z: v1.z + v2.z };
    }
    static sub(v1, v2) {
        return { x: v1.x - v2.x, y: v1.y - v2.y, z: v1.z - v2.z };
    }

    static flip(v) {
        return { x: -v.x, y: -v.y, z: -v.z }
    }

    // Vector operations
    static cross(v1, v2) {
        return {
            x: v1.y * v2.z - v1.z * v2.y,
            y: v1.z * v2.x - v1.x * v2.z,
            z: v1.x * v2.y - v1.y * v2.x
        };
    }
    static dot(v1, v2) {
        return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
    }
    static mag(v) {
        return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    }
    static norm(v) {
        const mag = Flt3.mag(v);
        return { x: v.x / mag, y: v.y / mag, z: v.z / mag };
    }

    // Other operations
    static interpolate3fx3(v1, v2, v3, u, v) {
        return {
            x: v1.x * (1 - u - v) + v2.x * u + v3.x * v,
            y: v1.y * (1 - u - v) + v2.y * u + v3.y * v,
            z: v1.z * (1 - u - v) + v2.z * u + v3.z * v
        }
    }
    static interpolate2fx3(v1, v2, v3, u, v) {
        return {
            x: v1.x * (1 - u - v) + v2.x * u + v3.x * v,
            y: v1.y * (1 - u - v) + v2.y * u + v3.y * v
        }
    }

    static lerp(v1, v2, t) {
        return Flt3.add(Flt3.mult(v1, 1 - t), Flt3.mult(v2, t));
    }

    // Debug
    static toStr(v, fixed=2) {
        return `${v.x.toFixed(fixed)}, ${v.y.toFixed(fixed)}, ${v.z.toFixed(fixed)}`;
    }
}