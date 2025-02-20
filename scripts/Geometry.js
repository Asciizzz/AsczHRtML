
class Geometry {
    static intersect(ray, geom) {
        switch (geom.type) {
            case 0: return Geometry.intersectTriangle(ray, geom);
            case 1: return Geometry.intersectSphere(ray, geom);
        }
    }

    // ========= Intersection ========= //

    static intersectTriangle(ray, geom) {
        let result = { i: false, z: 0, uv: { u: 0, v: 0 } };

        let e1 = Flt3.sub(geom.v2, geom.v1);
        let e2 = Flt3.sub(geom.v3, geom.v1);
        let h = Flt3.cross(ray.direction, e2);
        let a = Flt3.dot(e1, h);

        if (a > -0.00001 && a < 0.00001) return result;

        let f = 1 / a;
        let s = Flt3.sub(ray.origin, geom.v1);
        let u = f * Flt3.dot(s, h);

        if (u < 0 || u > 1) return result;

        let q = Flt3.cross(s, e1);
        let v = f * Flt3.dot(ray.direction, q);

        if (v < 0 || u + v > 1) return result;

        let z = f * Flt3.dot(e2, q);

        if (z > 0.00001) {
            result.i = true;
            result.z = z;
            result.uv = { u: u, v: v };
        }

        return result;
    }

    static intersectSphere(ray, geom) {
        let result = { i: false, z: 0, uv: { u: 0, v: 0 } };

        let l = Flt3.sub(geom.pos, ray.origin);
        let tca = Flt3.dot(l, ray.direction);
        let d2 = Flt3.dot(l, l) - tca * tca;

        if (d2 > geom.r * geom.r) return result;

        let thc = Math.sqrt(geom.r * geom.r - d2);
        let t0 = tca - thc;
        let t1 = tca + thc;

        if (t0 < 0) t0 = t1;

        let z = t0;

        if (z > 0.00001) {
            result.i = true;
            result.z = z;
        }

        return result;
    }
    
    // ========= Interpolation ========= //
    static interpolate(ray, geom, t, u, v) {
        switch (geom.type) {
            case 0: return Geometry.interpTriangle(ray, geom, t, u, v);
            case 1: return Geometry.interpSphere(ray, geom, t);
        }
    }

    static interpTriangle(ray, geom, t, u, v) {
        let vrtx = Flt3.add(ray.origin, Flt3.mult(ray.direction, t));
        let nrml = Flt3.interpolate3fx3(geom.n1, geom.n2, geom.n3, u, v);
        nrml = Flt3.norm(nrml);
        let colr = { x: 0, y: 0, z: 0 };

        if (geom.texture != null && textures[geom.texture]) {
            let tex = textures[geom.texture];

            let txCoord = Flt3.interpolate2fx3(geom.t1, geom.t2, geom.t3, u, v);

            // Wrap around if texture is repeated
            if (txCoord.x < 0) txCoord.x = 1 - txCoord.x;
            if (txCoord.y < 0) txCoord.y = 1 - txCoord.y;

            txCoord.x = txCoord.x - Math.floor(txCoord.x);
            txCoord.y = txCoord.y - Math.floor(txCoord.y);

            let tx = Math.floor(txCoord.x * tex.width);
            let ty = Math.floor(txCoord.y * tex.height);
            let txColor = tex.data[tx + ty * tex.width];

            colr = txColor;
        } else {
            // Interpolate color
            let w = 1 - u - v;
            let c1 = Flt3.mult(geom.c1, w);
            let c2 = Flt3.mult(geom.c2, u);
            let c3 = Flt3.mult(geom.c3, v);

            colr = Flt3.add(Flt3.add(c1, c2), c3);
        }

        return { v: vrtx, n: nrml, c: colr };
    }

    static interpSphere(ray, geom, t) {
        let vrtx = Flt3.add(ray.origin, Flt3.mult(ray.direction, t));
        let nrml = (geom.skybox || geom.inverse) ?
            Flt3.norm(Flt3.sub(geom.pos, vrtx)) :
            Flt3.norm(Flt3.sub(vrtx, geom.pos));

        let colr = geom.c;
        if (geom.texture != null && textures[geom.texture]) {
            let tex = textures[geom.texture];

            let phi = Math.acos(-nrml.y);
            let theta = Math.atan2(-nrml.z, -nrml.x) + Math.PI;
            let u = theta / (2 * Math.PI);
            let v = phi / Math.PI;

            let tx = Math.floor(u * tex.width);
            let ty = Math.floor(v * tex.height);
            let txColor = tex.data[tx + ty * tex.width];

            colr = txColor;
        }

        return { v: vrtx, n: nrml, c: colr };
    }
}