// Some helper functions for ray tracing
function sampleHemisphere(normal) {
    let z = Math.random();
    let r = Math.sqrt(1 - z * z);
    let phi = Math.random() * 2 * Math.PI;

    let x = r * Math.cos(phi);
    let y = r * Math.sin(phi);

    let t = Flt3.norm(normal);
    let u = Math.abs(t.x) > 0.1 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
    let v = Flt3.cross(t, u);

    return Flt3.norm(Flt3.add(
        Flt3.add(Flt3.mult(u, x), Flt3.mult(v, y)),
        Flt3.mult(t, z)
    ));
}

class Ray {
    constructor(origin={x:0,y:0,z:0}, direction={x:0,y:0,z:1}, Ni=1.0, w=1.0) {
        this.origin = origin;
        this.direction = direction;
        this.Ni = Ni; // Refractive index
        this.w = w; // Weight
    }

    static rayReflect(dir, normal) {
        return Flt3.norm(Flt3.sub(dir, Flt3.mult(normal, 2 * Flt3.dot(dir, normal))));
    }

    static rayRefract(dir, normal, Ni2) {
        let Ni = 1;
        let cosI = -Flt3.dot(dir, normal);
        if (cosI < 0) cosI = -cosI;
        else [Ni, Ni2] = [Ni2, Ni];

        let n = Ni / Ni2;
        let cosT2 = 1 - n * n * (1 - cosI * cosI);

        if (cosT2 < 0) return Ray.rayReflect(dir, normal);

        return Flt3.norm(Flt3.add(
            Flt3.mult(dir, n),
            Flt3.mult(normal, n * cosI - Math.sqrt(cosT2))
        ));
    }

    static raytrace(primray, nodes, geoms, gIdxs, mtls, lSrcs) {
        let rstack = Array(8);
        let rs_top = 0;
        rstack[rs_top++] = primray;

        let resultColr = { x: 0, y: 0, z: 0 };

        while (rs_top > 0) {
            const ray = rstack[--rs_top];

            let hit = BVH.closestHit(ray, nodes, geoms, gIdxs);
            if (hit.i == -1) continue;

            const gIdx = gIdxs[hit.i];
            const gHit = geoms[gIdx];

            let interp = Geometry.interpolate(ray, gHit, hit.t, hit.u, hit.v);
            let vrtx = interp.v, nrml = interp.n;

            let mtl = mtls[gHit.mtl];

            let NdotR = Flt3.dot(nrml, ray.direction);
            NdotR = NdotR < 0 ? -NdotR : NdotR;
            let finalColr = Flt3.mult(mtl.Ka, NdotR * 0.2);

            for (let l = 0; l < lSrcs.length; ++l) {
                const lSrc = lSrcs[l];

                const lPos = lSrc.pos;
                let lDir = Flt3.sub(vrtx, lPos);
                let lDist = Flt3.mag(lDir);
                lDir = Flt3.norm(lDir);

                let lRay = new Ray(lPos, lDir);

                let shadow = BVH.anyHit(lRay, nodes, geoms, gIdxs, lDist, gIdx);
                if (shadow) continue;

                const lIntense = lSrc.intensity;
                const lColor = lSrc.color;

                let NdotL = -Flt3.dot(nrml, lDir);
                let diff = Flt3.mult(mtl.Kd, NdotL);

                let refl = Ray.rayReflect(lDir, nrml);
                let RdotV = Flt3.dot(refl, Flt3.flip(ray.direction));
                RdotV = RdotV < 0 ? 0 : RdotV;

                let specComp = Math.pow(RdotV, mtl.Ns);
                let spec = Flt3.mult(mtl.Ks, specComp);

                finalColr.x += (diff.x + spec.x) * lColor.x * lIntense;
                finalColr.y += (diff.y + spec.y) * lColor.y * lIntense;
                finalColr.z += (diff.z + spec.z) * lColor.z * lIntense;
            }

            // Add result color
            resultColr.x += finalColr.x * ray.w;
            resultColr.y += finalColr.y * ray.w;
            resultColr.z += finalColr.z * ray.w;
        }


        // Clamp color
        resultColr.x = resultColr.x > 1 ? 1 : resultColr.x;
        resultColr.y = resultColr.y > 1 ? 1 : resultColr.y;
        resultColr.z = resultColr.z > 1 ? 1 : resultColr.z;

        return resultColr;
    }


    static pathtrace(primray, nodes, geoms, gIdxs, mtls, lSrcs) {
        let rstack = Array(128);
        let rs_top = 0;
        rstack[rs_top++] = primray;

        let resultColr = { x: 0, y: 0, z: 0 };

        let bounceLeft = 4;

        while (rs_top > 0) {
            const ray = rstack[--rs_top];

            let hit = BVH.closestHit(ray, nodes, geoms, gIdxs);

            if (hit.i == -1) continue;

            const gIdx = gIdxs[hit.i];
            const gHit = geoms[gIdx];

            let interp = Geometry.interpolate(ray, gHit, hit.t, hit.u, hit.v);
            let vrtx = interp.v, nrml = interp.n;

            let mtl = mtls[gHit.mtl];

            let finalColr = { x: 0, y: 0, z: 0 };
            for (let l = 0; l < lSrcs.length; ++l) {
                const lSrc = lSrcs[l];

                let lPos = lSrc.pos;
                let lDir = Flt3.sub(vrtx, lPos);
                let lDist = Flt3.mag(lDir);
                lDir = Flt3.norm(lDir);

                let lRay = new Ray(lPos, lDir);

                let shadow = BVH.anyHit(lRay, nodes, geoms, gIdxs, lDist, gIdx);
                if (shadow) continue;

                let lIntense = lSrc.intensity;
                let lColor = lSrc.color;

                let NdotL = -Flt3.dot(nrml, lDir);
                let diff = Flt3.mult(mtl.Kd, NdotL);

                let refl = Ray.rayReflect(lDir, nrml);
                let RdotV = Flt3.dot(refl, Flt3.flip(ray.direction));
                RdotV = RdotV < 0 ? 0 : RdotV;

                let specComp = Math.pow(RdotV, mtl.Ns);
                let spec = Flt3.mult(mtl.Ks, specComp);

                finalColr.x += (diff.x + spec.x) * lColor.x * lIntense;
                finalColr.y += (diff.y + spec.y) * lColor.y * lIntense;
                finalColr.z += (diff.z + spec.z) * lColor.z * lIntense;
            }

            if (bounceLeft > 0) {
                bounceLeft--;
                for (let i = 0; i < 32; i++) {
                    let sampO = Flt3.add(vrtx, Flt3.mult(nrml, 0.0001));
                    let sampD = sampleHemisphere(nrml);
                    let sampRay = new Ray(sampO, sampD, ray.Ni, 0.005);

                    rstack[rs_top++] = sampRay;
                }
            }

            // Add result color
            resultColr.x += finalColr.x * ray.w;
            resultColr.y += finalColr.y * ray.w;
            resultColr.z += finalColr.z * ray.w;
        }

        // Clamp color
        resultColr.x = resultColr.x > 1 ? 1 : resultColr.x;
        resultColr.y = resultColr.y > 1 ? 1 : resultColr.y;
        resultColr.z = resultColr.z > 1 ? 1 : resultColr.z;

        return resultColr;
    }
}