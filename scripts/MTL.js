class MTL {
    constructor() {
        this.mtls = [];
        // Initialize with a default material
        this.appendMTL({}); 
    }

    appendMTL(mtl) {
        this.mtls.push({
            Ka: mtl.Ka || { x: 0.2, y: 0.2, z: 0.2 },
            Kd: mtl.Kd || { x: 0.8, y: 0.8, z: 0.8 },
            Ks: mtl.Ks || { x: 0.3, y: 0.3, z: 0.3 },

            Ns: mtl.Ns || 32,
        });

        // Return the index of the appended material
        return this.mtls.length - 1;
    }
}