
// Second Order Dynamic (x, y can be any vector you want (even 3d))
// y + k1 * y' + k2 * y'' = x + k3 * x' 
// f = 1 / (2*pi*sqrt(k2)) ------ Natural Frequency
// d = k1 / (2*sqrt(k2)) -------- Damping Coefficient
// r = 2*k3 / k1 ---------------- Initial Response of system
// => y + d/(pi*f) * y' + 1/(2pi*f)^2 * y'' = x + r*d/(2pi*f) * x'

/* Some intuitive example:

low f -> move slow, high f -> move fast
low d -> wiggle wiggle, high d -> not so wigglish
negative r -> take some time to converge, positive r -> overshoot

*/

class SecondOrderDynamic {
    constructor(f, z, r, x0={x: 0, y: 0}) {
        this.f = f;
        this.z = z;
        this.r = r;
        this.updateK(f, z, r);

        // 2d Vectors contain position x, y
        this.xp = x0;
        this.y = x0;
        this.yd = {x: 0, y: 0};
    }

    updateK(f, z, r) {
        this.k1 = this.z / (Math.PI * this.f);
        this.k2 = Math.pow(2 * Math.PI * this.f, 2);
        this.k3 = this.r * this.k1 / 2;
    }

    update(T, x, xd=null) {
        if (xd === null) {
            xd = {
                x: (x.x - this.xp.x) / T,
                y: (x.y - this.xp.y) / T
            }

            this.xp = x;
        }

        this.y.x += T * this.yd.x;
        this.y.y += T * this.yd.y;

        this.yd.x += T * (x.x + this.k3 * xd.x - this.y.x - this.k1 * this.yd.x) * this.k2;
        this.yd.y += T * (x.y + this.k3 * xd.y - this.y.y - this.k1 * this.yd.y) * this.k2;

        return this.y;
    }
}