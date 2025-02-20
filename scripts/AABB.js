class AABB {
    constructor(min={x:Infinity,y:Infinity,z:Infinity}, max={x:-Infinity,y:-Infinity,z:-Infinity}) {
        this.min = min;
        this.max = max;
    }

    expandMin(m) {
        this.min.x = Math.min(this.min.x, m.x);
        this.min.y = Math.min(this.min.y, m.y);         
        this.min.z = Math.min(this.min.z, m.z);
    }
    expandMax(m) {
        this.max.x = Math.max(this.max.x, m.x);
        this.max.y = Math.max(this.max.y, m.y);         
        this.max.z = Math.max(this.max.z, m.z);
    }

    expand(m) {
        this.expandMin(m);
        this.expandMax(m);
    }
}