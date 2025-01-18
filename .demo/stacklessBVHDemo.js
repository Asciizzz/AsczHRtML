// TODO:
/* We will create a test function to test the tree structure

It will check group of UpperCase letters

For example: Root A:
- Node AB, Leaf ABC

- Node AC, Leaf ACD

Find ACD:

- Root A -> Node AB (skip) -> Node AC -> Leaf ACD

*/

class BVHnode {
    constructor(str, node=[], isLeaf=false) {
        this.str = str;
        this.node = node;
        this.isLeaf = isLeaf;
        this.halt = false; // Cut off the branch
    }
}

// Traverse

function traverse(node, depth) {
    let blank1 = "> ";
    let blank2 = "+ ";
    for (let i = 0; i < depth; i++) {
        blank1 = "| " + blank1;
        blank2 = "| " + blank2;
    }

    let localArray = [];
    let localOffset = [];
    let currentOffset = 0;

    if (node.isLeaf) {
        console.log(blank1 + `Leaf: ${node.node}`);
        // In the future you can change this to a custom BVHnode that
        // would save the min/max volume for ray tracing
        //                          v
        localArray = localArray.concat(node.node);
    } else {
        console.log(blank1 + `Node ${node.str}`);
        localArray.push(`${node.str}`);
        for (let i = 0; i < node.node.length; i++) {
            let local = traverse(node.node[i], depth + 1);
            localArray = localArray.concat(local.lArr);
            localOffset = localOffset.concat(local.lOff);
            currentOffset += local.offset;
            // console.log("| " + blank2 + 
            //     (node.node[i].isLeaf ? `Leaf ${i}` : `Node ${i}`));
        }
    }

    localOffset.unshift(currentOffset);
    // If over 1 element in leaf, unshift 0
    if (localArray.length > 1 && node.isLeaf) {
        currentOffset += localArray.length - 1;
        for (let i = 0; i < localArray.length - 1; i++) {
            localOffset.unshift(0);
        }
    }

    return {
        lArr: localArray,
        lOff: localOffset,
        offset: currentOffset + 1
    }
}

let root = new BVHnode("A");

let nodeA = new BVHnode("AB");
let leafA1 = new BVHnode("",["ABC", "ABD"], true);
let leafA2 = new BVHnode("",["ABE", "ABF"], true);
nodeA.node = [leafA1, leafA2];

let leafB = new BVHnode("", ["ACE"], true);

let nodeC = new BVHnode("AC");
let leafC1 = new BVHnode("", ["ACD"], true);
let leafC2 = new BVHnode("", ["ACE"], true);
let leafC3 = new BVHnode("", ["ACF"], true);
let leafC4 = new BVHnode("", ["ACG"], true);
nodeC.node = [leafC1, leafC2, leafC3, leafC4];

let nodeD = new BVHnode("AD");
let leafD1 = new BVHnode("", ["ADD"], true);
let leafD2 = new BVHnode("", ["ADE"], true);
let leafD3 = new BVHnode("", ["ADF"], true);
let leafD4 = new BVHnode("", ["ADG"], true);
nodeD.node = [leafD1, leafD2, leafD3, leafD4];

root.node = [nodeA, leafB, nodeC, nodeD];

let tree = traverse(root, 0);

console.log(tree);

let desire = "ADG";
let hit = false;
let step = 0;
let hitDebug = "";

// Naive solution
hit = false; step = 0; hitDebug = "[For loop]";
for (let i = 0; i < tree.lArr.length; i++) {
    hitDebug += `>[${tree.lArr[i]}]`;
    step++;

    if (tree.lArr[i] == desire) {
        hit = true;
        break;
    }
}
console.log(hitDebug);
console.log(`${hit?"Hit":"Fail"} in ${step} steps`);
console.log("=====================================");


// Cool solution
hit = false; step = 0; hitDebug = "[BVH]";
for (let i = 0; i < tree.lArr.length; i++) {
    hitDebug += `>[${tree.lArr[i]}]`;
    step++;

    // Check if the letter is in the string
    if (desire.startsWith(tree.lArr[i])) {
        // Check if correct 
        if (tree.lArr[i] == desire) {
            hit = true;
            break;
        }
    // Ignore entire branch
    } else {
        hitDebug += `>[x]`;
        i += tree.lOff[i];
    }
}
console.log(hitDebug);
console.log(`${hit?"Hit":"Fail"} in ${step} steps`);