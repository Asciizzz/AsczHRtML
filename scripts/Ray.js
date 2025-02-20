
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

    static raytrace(primray, nodes, geoms, gIdxs, lSrcs) {
        let rstack = Array(8);
        let rs_top = 0;
        rstack[rs_top++] = primray;

        let resultColr = { x: 0, y: 0, z: 0 };

        while (rs_top > 0) {
            const ray = rstack[--rs_top];

            if (ray.w < 0.01) continue;

            let hit = BVH.closestHit(ray, nodes, geoms, gIdxs);

            if (hit.i == -1) continue;

            const gIdx = gIdxs[hit.i];
            const gHit = geoms[gIdx];

            let interp = Geometry.interpolate(ray, gHit, hit.t, hit.u, hit.v);
            let vrtx = interp.v, nrml = interp.n, colr = interp.c;

            let NdotR = Flt3.dot(nrml, ray.direction);
            NdotR = NdotR < 0 ? -NdotR : NdotR;

            let finalColr = Flt3.mult(colr, NdotR * 0.2);

            for (let l = 0; l < lSrcs.length; ++l) {
                const lSrc = lSrcs[l];

                let lPos = lSrc.pos;
                let lDir = Flt3.sub(vrtx, lPos);
                let lDist = Flt3.mag(lDir);
                lDir = Flt3.norm(lDir);

                let lRay = new Ray(lPos, lDir);

                let lI = lSrc.intensity;
                let passColr = lSrc.color;

                let shadow = BVH.anyHit(lRay, nodes, geoms, gIdxs, lDist, gIdx);
                if (shadow) continue;

                let NdotL = -Flt3.dot(nrml, lDir);

                let diff = Flt3.mult(colr, NdotL);

                let refl = Ray.rayReflect(Flt3.flip(lDir), nrml);

                let Ks = {x: 0.4, y: 0.4, z: 0.4};
                let specComp = Math.pow(Flt3.dot(refl, Flt3.flip(ray.direction)), 32);
                let spec = Flt3.mult(Ks, specComp);

                finalColr.x += (diff.x + spec.x) * passColr.x * lI;
                finalColr.y += (diff.y + spec.y) * passColr.y * lI;
                finalColr.z += (diff.z + spec.z) * passColr.z * lI;
            }

            if (gHit.refl > 0.0 && rs_top < 8) {
                let reflD = Ray.rayReflect(ray.direction, nrml);
                let reflO = Flt3.add(vrtx, Flt3.mult(reflD, 0.0001)); // Slight offset
                let reflRay = new Ray(reflO, reflD, ray.Ni, ray.w * gHit.refl);

                rstack[rs_top++] = reflRay;
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


    static pathtrace(primray, nodes, geoms, gIdxs, lSrcs) {
        let rstack = Array(16);
        let rs_top = 0;
        rstack[rs_top++] = primray;

        let nstack = Array(32);
        let ns_top = 0;

        let resultColr = { x: 0, y: 0, z: 0 };

        while (rs_top > 0) {
            const ray = rstack[--rs_top];

            if (ray.w < 0.01) continue;

            let hit = BVH.closestHit(ray, nodes, geoms, gIdxs);

            if (hit.i == -1) continue;

            const gIdx = gIdxs[hit.i];
            const gHit = geoms[gIdx];

            let interp = Geometry.interpolate(ray, gHit, hit.t, hit.u, hit.v);
            let vrtx = interp.v, nrml = interp.n, colr = interp.c;

            let NdotR = Flt3.dot(nrml, ray.direction);
            NdotR = NdotR < 0 ? -NdotR : NdotR;

            let finalColr = Flt3.mult(colr, NdotR * 0.2);

            for (let l = 0; l < lSrcs.length; ++l) {
                const lSrc = lSrcs[l];

                let lPos = lSrc.pos;
                let lDir = Flt3.sub(vrtx, lPos);
                let lDist = Flt3.mag(lDir);
                lDir = Flt3.norm(lDir);

                let lRay = new Ray(lPos, lDir);

                let lI = lSrc.intensity;
                let passColr = lSrc.color;

                let shadow = BVH.anyHit(lRay, nodes, geoms, gIdxs, lDist, gIdx);
                if (shadow) continue;

                let NdotL = -Flt3.dot(nrml, lDir);

                let diff = Flt3.mult(colr, NdotL);

                let refl = Ray.rayReflect(Flt3.flip(lDir), nrml);

                let Ks = {x: 0.4, y: 0.4, z: 0.4};
                let specComp = Math.pow(Flt3.dot(refl, Flt3.flip(ray.direction)), 32);
                let spec = Flt3.mult(Ks, specComp);

                finalColr.x += (diff.x + spec.x) * passColr.x * lI;
                finalColr.y += (diff.y + spec.y) * passColr.y * lI;
                finalColr.z += (diff.z + spec.z) * passColr.z * lI;
            }

            if (gHit.refl > 0.0 && rs_top < 8) {
                let reflD = Ray.rayReflect(ray.direction, nrml);
                let reflO = Flt3.add(vrtx, Flt3.mult(reflD, 0.0001)); // Slight offset
                let reflRay = new Ray(reflO, reflD, ray.Ni, ray.w * gHit.refl);

                rstack[rs_top++] = reflRay;
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