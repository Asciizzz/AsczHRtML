class Node {
    constructor() {
        this.ab = new AABB();

        this.cl = -1;
        this.cr = -1;
        this.ll = -1;
        this.lr = -1;
    }

    hitDist(ray) {
        let min = this.ab.min;
        let max = this.ab.max;

        let rO = ray.origin;
        let rD = ray.direction; 

        if (rO.x >= min.x && rO.x <= max.x &&
            rO.y >= min.y && rO.y <= max.y &&
            rO.z >= min.z && rO.z <= max.z) return 0.0;

        let t1 = (min.x - rO.x) / rD.x;
        let t2 = (max.x - rO.x) / rD.x;
        let t3 = (min.y - rO.y) / rD.y;
        let t4 = (max.y - rO.y) / rD.y;
        let t5 = (min.z - rO.z) / rD.z;
        let t6 = (max.z - rO.z) / rD.z;

        let tmin = Math.max(Math.max(Math.min(t1, t2), Math.min(t3, t4)), Math.min(t5, t6));
        let tmax = Math.min(Math.min(Math.max(t1, t2), Math.max(t3, t4)), Math.max(t5, t6));

        if (tmax < tmin) return -1.0; // No intersection
        if (tmin < 0.0) return -1.0; // Behind the ray
        return tmin;
    }

    findCost() {
        let size = Flt3.sub(this.ab.max, this.ab.min);
        let sa = size.x * size.y + size.y * size.z + size.z * size.x;

        // Cost = Surface Area * Number of primitives
        return sa * (this.lr - this.ll);
    }
}

class BVH {
    constructor() {
        this.nodes = [];

        this.geoms = [];
        this.ABs = [];

        this.gIdxs = [];

        this.root = new Node();

        this.MAX_DEPTH = 32;
        this.BIN_COUNT = 11;
        this.NODE_FACE = 2;
    }

    calcAABB() {
        for (let i = 0; i < this.geoms.length; i++) {
            let geom = this.geoms[i];
            // If geom doesn't have a material, assign a default material
            if (geom.mtl == undefined) geom.mtl = 0;

            let ab = new AABB();
            switch (geom.type) {
                case 0:
                    ab.expand(geom.v1);
                    ab.expand(geom.v2);
                    ab.expand(geom.v3);
                    break;
                case 1:
                    ab.min = Flt3.sub(geom.o, { x: geom.r, y: geom.r, z: geom.r });
                    ab.max = Flt3.add(geom.o, { x: geom.r, y: geom.r, z: geom.r });   
                    break;
            }

            this.ABs.push(ab);
            this.gIdxs.push(i);

            this.root.ab.expand(ab.min);
            this.root.ab.expand(ab.max);
        }

        this.root.ll = 0;
        this.root.lr = this.geoms.length;
    }

    buildBVH(node, depth=0) {
        this.nodes.push(node);

        let idx = 0;

        let nG = node.lr - node.ll;
        if (nG <= this.NODE_FACE || depth >= this.MAX_DEPTH) {
            node.cl = -1;
            node.cr = -1;
            return 1;
        }

        let nAB = node.ab;
        let nABsize = Flt3.sub(nAB.max, nAB.min);

        let curCost = node.findCost();

        let bestAxis = -1;
        let bestSplit = -1;
        let bestCost = curCost;

        let bestLab, bestRab;

        for (let a = 0; a < 3; ++a) {
            // Splice specific range (node.ll to node.lr) and sort by centroid
            let specificGIdxs = this.gIdxs.slice(node.ll, node.lr);
            specificGIdxs.sort((i1, i2) => {
                let c1 = Flt3.mult(Flt3.add(this.ABs[i1].min, this.ABs[i1].max), 0.5);
                let c2 = Flt3.mult(Flt3.add(this.ABs[i2].min, this.ABs[i2].max), 0.5);

                return a == 0 ? c1.x - c2.x : a == 1 ? c1.y - c2.y : c1.z - c2.z;
            });
            // Combine the sorted array back to the original array
            this.gIdxs.splice(node.ll, specificGIdxs.length, ...specificGIdxs);

            for (let b = 0; b < this.BIN_COUNT; ++b) {
                let l = new Node();
                let r = new Node();

                let splitPoint = a == 0 ? nAB.min.x + nABsize.x * (b + 1) / this.BIN_COUNT :
                                 a == 1 ? nAB.min.y + nABsize.y * (b + 1) / this.BIN_COUNT :
                                          nAB.min.z + nABsize.z * (b + 1) / this.BIN_COUNT;

                let splitIdx = node.ll;

                for (let g = node.ll; g < node.lr; ++g) {
                    let i = this.gIdxs[g];

                    let cent = a == 0 ? (this.ABs[i].min.x + this.ABs[i].max.x) * 0.5 :
                               a == 1 ? (this.ABs[i].min.y + this.ABs[i].max.y) * 0.5 :
                                        (this.ABs[i].min.z + this.ABs[i].max.z) * 0.5;

                    if (cent < splitPoint) {
                        l.ab.expand(this.ABs[i].min);
                        l.ab.expand(this.ABs[i].max);
                        splitIdx++;
                    } else {
                        r.ab.expand(this.ABs[i].min);
                        r.ab.expand(this.ABs[i].max);
                    }
                }

                let cost = l.findCost() + r.findCost();
                
                if (cost < bestCost) {
                    bestCost = cost;
                    bestAxis = a;
                    bestSplit = splitIdx;
                    bestLab = l;
                    bestRab = r;
                }
            }
        }

        if (bestSplit == -1 || bestAxis == -1) {
            node.cl = -1;
            node.cr = -1;
            return 1;
        }

        // Splice (ll->lr), sort and combine
        let specificGIdxs = this.gIdxs.slice(node.ll, node.lr);
        specificGIdxs.sort((i1, i2) => {
            let c1 = Flt3.mult(Flt3.add(this.ABs[i1].min, this.ABs[i1].max), 0.5);
            let c2 = Flt3.mult(Flt3.add(this.ABs[i2].min, this.ABs[i2].max), 0.5);

            return bestAxis == 0 ? c1.x - c2.x : bestAxis == 1 ? c1.y - c2.y : c1.z - c2.z;
        }); 
        this.gIdxs.splice(node.ll, specificGIdxs.length, ...specificGIdxs);

        let l = new Node();
        l.ab = bestLab.ab;
        l.ll = node.ll; 
        l.lr = bestSplit;   

        let r = new Node(); 
        r.ab = bestRab.ab;
        r.ll = bestSplit;
        r.lr = node.lr;

        let curIdx = this.nodes.length - 1;

        this.nodes[curIdx].cl = this.nodes.length;
        idx += this.buildBVH(l, depth + 1);

        this.nodes[curIdx].cr = this.nodes.length;
        idx += this.buildBVH(r, depth + 1);

        return idx + 1;
    }

    designBVH() {
        this.calcAABB();

        this.buildBVH(this.root);

        console.log(this.nodes);
    }

    static closestHit(ray, nodes, geoms, gIdxs) {
        let nstack = Array(64);
        let ns_top = 0;

        nstack[ns_top++] = 0;

        let hit = { i: -1, t: Infinity, u: 0, v: 0 };

        while (ns_top > 0) {
            const nIdx = nstack[--ns_top];
            const node = nodes[nIdx];

            let hitDist = node.hitDist(ray);
            if (hitDist < 0 || hitDist > hit.t) continue;

            if (node.cl > -1) {
                let lDist = nodes[node.cl].hitDist(ray);
                let rDist = nodes[node.cr].hitDist(ray);

                if (lDist < 0 && rDist < 0) continue;
                else if (lDist < 0) nstack[ns_top++] = node.cr;
                else if (rDist < 0) nstack[ns_top++] = node.cl;
                else if (lDist < rDist) {
                    nstack[ns_top++] = node.cl;
                    nstack[ns_top++] = node.cr;
                } else {
                    nstack[ns_top++] = node.cr;
                    nstack[ns_top++] = node.cl;
                }

                continue;
            }

            for (let i = node.ll; i < node.lr; ++i) {
                const geom = geoms[gIdxs[i]];

                const result = Geometry.intersect(ray, geom);

                if (result.i && result.z < hit.t) {
                    hit.i = i;
                    hit.t = result.z;
                    hit.u = result.uv.u;
                    hit.v = result.uv.v;
                }
            }
        }

        return hit;
    }

    static anyHit(ray, nodes, geoms, gIdxs, dist, ignore=-1) {
        let nstack = Array(64);
        let ns_top = 0;

        nstack[ns_top++] = 0;

        while (ns_top > 0) {
            const nIdx = nstack[--ns_top];
            const node = nodes[nIdx];

            let hitDist = node.hitDist(ray);
            if (hitDist < 0 || hitDist > dist) continue;

            if (node.cl > -1) {
                let lDist = nodes[node.cl].hitDist(ray);
                let rDist = nodes[node.cr].hitDist(ray);

                if (lDist < 0 && rDist < 0) continue;
                else if (lDist < 0) nstack[ns_top++] = node.cr;
                else if (rDist < 0) nstack[ns_top++] = node.cl;
                else if (lDist < rDist) {
                    nstack[ns_top++] = node.cl;
                    nstack[ns_top++] = node.cr;
                } else {
                    nstack[ns_top++] = node.cr;
                    nstack[ns_top++] = node.cl;
                }

                continue;
            }

            for (let i = node.ll; i < node.lr; ++i) {
                if (gIdxs[i] == ignore) continue;
                const geom = geoms[gIdxs[i]];

                const result = Geometry.intersect(ray, geom);

                if (result.i && result.z < dist) {
                    return true;
                }
            }
        }

        return false;
    }
}