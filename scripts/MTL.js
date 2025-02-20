class MTL {
    constructor() {
        this.mtls = [];
        // Initialize with a default material
        this.appendMTL({}); 
    }

    appendMTL(mtl) {
        this.mtls.push({
            Ka: mtl.Ka || { x: 0.1, y: 0.1, z: 0.1 },
            Kd: mtl.Kd || { x: 0.8, y: 0.8, z: 0.8 },
            Ks: mtl.Ks || { x: 0.2, y: 0.2, z: 0.2 },

            Ns: mtl.Ns || 10,
        });

        // Return the index of the appended material
        return this.mtls.length - 1;
    }
}