
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

        let l = Flt3.sub(geom.o, ray.origin);
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

        return { v: vrtx, n: nrml };
    }

    static interpSphere(ray, geom, t) {
        let vrtx = Flt3.add(ray.origin, Flt3.mult(ray.direction, t));
        let nrml = (geom.skybox || geom.inverse) ?
            Flt3.norm(Flt3.sub(geom.o, vrtx)) :
            Flt3.norm(Flt3.sub(vrtx, geom.o));

        return { v: vrtx, n: nrml };
    }
}