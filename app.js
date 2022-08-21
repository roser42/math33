class Random {
    constructor() {
        this.useA = false;
        let sfc32 = function (uint128Hex) {
            let a = parseInt(uint128Hex.substr(0, 8), 16);
            let b = parseInt(uint128Hex.substr(8, 8), 16);
            let c = parseInt(uint128Hex.substr(16, 8), 16);
            let d = parseInt(uint128Hex.substr(24, 8), 16);
            return function () {
                a |= 0; b |= 0; c |= 0; d |= 0;
                let t = (((a + b) | 0) + d) | 0;
                d = (d + 1) | 0;
                a = b ^ (b >>> 9);
                b = (c + (c << 3)) | 0;
                c = (c << 21) | (c >>> 11);
                c = (c + t) | 0;
                return (t >>> 0) / 4294967296;
            };
        };
        // seed prngA with first half of tokenData.hash
        this.prngA = new sfc32(tokenData.hash.substr(2, 32));
        // seed prngB with second half of tokenData.hash
        this.prngB = new sfc32(tokenData.hash.substr(34, 32));
        for (let i = 0; i < 1e6; i += 2) {
            this.prngA();
            this.prngB();
        }
    }
    // random number between 0 (inclusive) and 1 (exclusive)
    random_dec() {
        this.useA = !this.useA;
        return this.useA ? this.prngA() : this.prngB();
    }
    // random number between a (inclusive) and b (exclusive)
    random_num(a, b) {
        return a + (b - a) * this.random_dec();
    }
    // random integer between a (inclusive) and b (inclusive)
    // requires a < b for proper probability distribution
    random_int(a, b) {
        return Math.floor(this.random_num(a, b + 1));
    }
    // random boolean with p as percent liklihood of true
    random_bool(p) {
        return this.random_dec() < p;
    }
    // random value in an array of items
    random_choice(list) {
        return list[this.random_int(0, list.length - 1)];
    }
}

function genTokenData(projectNum) {
    let data = {};
    let hash = '0x';
    for (let i = 0; i < 64; i++) {
        hash += Math.floor(Math.random() * 16).toString(16);
    }
    data.hash = hash;
    data.tokenId = (projectNum * 1000000 + Math.floor(Math.random() * 1000)).toString();
    return data;
}

const tokenData = genTokenData(123);
const R = new Random();

const helpersOn = false;

const palette_1 = [
    '#274D5B',
    '#46988E',
    '#F8E181',
    '#FAAC6A',
    '#D46D4F',
    '#925E78',
    '#F05365'
];

const palette_2 = [
    '#FFFBFE',
    '#7A7D7D',
    '#C2C1C1',
    '#565254',
    '#FFF',
    '#878285',
    '#515252'
];

function cross() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const dpr = 3;
    ctx.canvas.width = 256 * dpr;
    ctx.canvas.height = ctx.canvas.width;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = R.random_choice(curPalette);
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = 'black';
    const x = 40;
    const y = 170;
    const xCenter = (ctx.canvas.width / 2 / dpr) - x / 2;
    const yCenter = (ctx.canvas.height / 2 / dpr) - y / 2;
    ctx.fillRect(xCenter, yCenter, x, y);
    ctx.fillRect(yCenter, xCenter, y, x);

    return new THREE.Texture(canvas);
}

function strokeRects(time) {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.ctx.fillStyle = this.color;
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    const centerX = this.ctx.canvas.width / 2 / 3;
    const centerY = this.ctx.canvas.height / 2 / 3;
    this.ctx.lineWidth = 10;
    this.ctx.strokeStyle = 'black';
    for (let side = 20; side <= 400; side += 40) {
        this.ctx.strokeRect(centerX - side / 2, centerY - side / 2, side, side);
    }
}

function animRectTex(time) {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.ctx.fillStyle = this.color;
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.ctx.fillStyle = 'black';
    const x = Math.abs(Math.sin(time * Math.PI / 3)) * 200;
    const y = x;
    const xCenter = (this.ctx.canvas.width / 2 / 3) - x / 2;
    const yCenter = (this.ctx.canvas.height / 2 / 3) - y / 2;
    this.ctx.fillRect(xCenter, yCenter, x, y);
}

const palettes = [palette_1, palette_2];
const patterns = [strokeRects, animRectTex];

class Materializer {
    constructor() {
        this._curPalette = this._setCurPalette();
        this.textures = this._initTextures(world.types);
    }

    _initTextures(count) {
        let textures = [];
        for (let i = 0; i < count; i++) {

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const dpr = 3;
            ctx.canvas.width = 256 * dpr;
            ctx.canvas.height = ctx.canvas.width;
            ctx.scale(dpr, dpr);

            const texture = {
                canvas: canvas,
                ctx: ctx,
                color: R.random_choice(this._curPalette),
                draw: R.random_choice(patterns)
            };

            textures.push(texture);
        }
        return textures;
    }

    CreateMaterials(types, geometry) {
        let materials = [];
        for (let i = 0; i < types; i++) {
            const mat = this._createOutLineMat(geometry, this.textures[i].canvas);
            mat.uniforms.uTex.value.needsUpdate = true;
            materials.push(mat);

        }
        return materials;
    }

    _setCurPalette() {
        return R.random_choice(palettes);
    }

    _createOutLineMat(geometry, patternTex, edgeColor) {
        return new THREE.ShaderMaterial({
            uniforms: {
                size: {
                    value: new THREE.Vector3(
                        geometry.parameters.width,
                        geometry.parameters.height,
                        geometry.parameters.depth)
                        .multiplyScalar(0.5)
                },
                thickness: {
                    value: 0.02
                },
                smoothness: {
                    value: 0.05
                },
                edgeColor: {
                    value: new THREE.Color(edgeColor || 'black')
                },
                uTex: {
                    value: new THREE.Texture(patternTex)
                }
            },
            vertexShader: `
                varying vec3 vPos;
                varying vec2 vUv;
                void main()	{
                    vPos = position;
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
                }
            `,
            fragmentShader: `
                #ifdef GL_ES
                precision highp float;
                #endif
                varying vec3 vPos;
                varying vec2 vUv;

                uniform vec3 size;
                uniform float thickness;
                uniform float smoothness;
                uniform vec3 edgeColor;
                uniform sampler2D uTex;

                void main() {
                    float a = smoothstep(thickness, thickness + smoothness, length(abs(vPos.xy) - size.xy));
                    a *= smoothstep(thickness, thickness + smoothness, length(abs(vPos.yz) - size.yz));
                    a *= smoothstep(thickness, thickness + smoothness, length(abs(vPos.xz) - size.xz));
            
                    vec3 uTexColor = texture(uTex, vUv).rgb;
                    vec3 c = mix(edgeColor, uTexColor, a);
            
                    gl_FragColor = vec4(c, 1.0);
                }
            `,
            extensions: { derivatives: true }
        });
    }
}

class Engine {
    constructor() {
        this._clusters = [];
        this._moves = [];
    }

    _createLevel() {
        let done = false;
        // Keep generating levels until it is correct
        while (!done) {
            // Create a level with random tiles
            for (let i = 0; i < world.columns; i++) {
                for (let j = 0; j < world.rows; j++) {
                    world.tiles[i][j].type = R.random_int(0, world.types - 1);
                }
            }

            // Resolve the clusters
            this._resolveClusters();

            // Check if there are valid moves
            this._findMoves();

            // Done when there is a valid move
            if (this._moves.length > 0) {
                done = true;
            }
        }
    }

    _resolveClusters() {
        this._findClusters();
        while (this._clusters.length > 0) {
            this._removeClusters();
            this._shiftTiles();
            this._findClusters();
        }
    }

    _findClusters() {
        this._clusters = [];
        // Find horizontal clusters
        for (let j = 0; j < world.rows; j++) {
            // Start with a single tile, cluster of 1
            let matchLength = 1;
            for (let i = 0; i < world.columns; i++) {
                let checkCluster = false;

                if (i === world.columns - 1) {
                    // Last tile
                    checkCluster = true;
                } else {
                    // Check the type of the next tile
                    if (world.tiles[i][j].type === world.tiles[i + 1][j].type &&
                        world.tiles[i][j].type !== -1) {
                        // Same type as the previous tile, increase matchlength
                        matchLength += 1;
                    } else {
                        // Different type
                        checkCluster = true;
                    }
                }

                // Check if there was a cluster
                if (checkCluster) {
                    if (matchLength >= 3) {
                        // Found a horizontal cluster
                        this._clusters.push({
                            column: i + 1 - matchLength,
                            row: j,
                            length: matchLength,
                            horizontal: true
                        });
                    }
                    matchLength = 1;
                }
            }
        }

        // Find vertical clusters
        for (let i = 0; i < world.columns; i++) {
            // Start with a single tile, cluster of 1
            let matchLength = 1;
            for (let j = 0; j < world.rows; j++) {
                let checkCluster = false;

                if (j === world.rows - 1) {
                    // Last tile
                    checkCluster = true;
                } else {
                    // Check the type of the next tile
                    if (world.tiles[i][j].type === world.tiles[i][j + 1].type &&
                        world.tiles[i][j].type !== -1) {
                        // Same type as the previous tile, increase matchlength
                        matchLength += 1;
                    } else {
                        // Different type
                        checkCluster = true;
                    }
                }

                // Check if there was a cluster
                if (checkCluster) {
                    if (matchLength >= 3) {
                        // Found a vertical cluster
                        this._clusters.push({
                            column: i,
                            row: j + 1 - matchLength,
                            length: matchLength,
                            horizontal: false
                        });
                    }

                    matchLength = 1;
                }
            }
        }
    }

    _swap(x1, y1, x2, y2) {
        const typeSwap = world.tiles[x1][y1].type;
        world.tiles[x1][y1].type = world.tiles[x2][y2].type;
        world.tiles[x2][y2].type = typeSwap;
    }

    _findMoves() {
        this._moves = [];

        // Check horizontal swaps
        for (let j = 0; j < world.rows; j++) {
            for (let i = 0; i < world.columns - 1; i++) {
                // Swap, find clusters and swap back
                this._swap(i, j, i + 1, j);
                this._findClusters();
                this._swap(i, j, i + 1, j);

                // Check if the swap made a cluster
                if (this._clusters.length > 0) {
                    // Found a move
                    this._moves.push({ column1: i, row1: j, column2: i + 1, row2: j });
                }
            }
        }

        // Check vertical swaps
        for (let i = 0; i < world.columns; i++) {
            for (let j = 0; j < world.rows - 1; j++) {
                // Swap, find clusters and swap back
                this._swap(i, j, i, j + 1);
                this._findClusters();
                this._swap(i, j, i, j + 1);

                // Check if the swap made a cluster
                if (this._clusters.length > 0) {
                    // Found a move
                    this._moves.push({ column1: i, row1: j, column2: i, row2: j + 1 });
                }
            }
        }

        // Reset clusters
        this._clusters = [];
    }

    _loopClusters(func) {
        for (let i = 0; i < this._clusters.length; i++) {
            //  { column, row, length, horizontal
            const cluster = this._clusters[i];
            let coffset = 0;
            let roffset = 0;
            for (let j = 0; j < cluster.length; j++) {
                func(i, cluster.column + coffset, cluster.row + roffset, cluster);

                if (cluster.horizontal) {
                    coffset++;
                } else {
                    roffset++;
                }
            }
        }
    }

    _removeClusters() {
        // Change the type of the tiles to -1, indicating a removed tile
        this._loopClusters(function (index, column, row, cluster) {
            world.tiles[column][row].type = -1;
        });

        // Calculate how much a tile should be shifted downwards
        for (let i = 0; i < world.columns; i++) {
            let shift = 0;
            for (let j = world.rows - 1; j >= 0; j--) {
                // Loop from bottom to top
                if (world.tiles[i][j].type === -1) {
                    // Tile is removed, increase shift
                    shift++;
                    world.tiles[i][j].shift = 0;
                } else {
                    // Set the shift
                    world.tiles[i][j].shift = shift;
                }
            }
        }
    }

    _shiftTiles() {
        // Shift tiles
        for (let i = 0; i < world.columns; i++) {
            for (let j = world.rows - 1; j >= 0; j--) {
                // Loop from bottom to top
                if (world.tiles[i][j].type === -1) {
                    // Insert new random tile
                    world.tiles[i][j].type = R.random_int(0, world.types - 1);
                } else {
                    // Swap tile to shift it
                    const shift = world.tiles[i][j].shift;
                    if (shift > 0) {
                        this._swap(i, j, i, j + shift)
                    }
                }

                // Reset shift
                world.tiles[i][j].shift = 0;
            }
        }
    }

}

class World {
    constructor(worldConfig) {
        this.columns = worldConfig.columns;
        this.rows = worldConfig.rows;
        this.types = worldConfig.types;
        this._center = { x: 0, z: 0 };

        this._createHtmlProps(worldConfig.bgColor, { h: 4, w: 3 });
        this._scene = this._createScene(worldConfig.bgColor);
        this._camera = this._createCamera();
        this._renderer = this._createRenderer();

        this.tiles = this._initTiles();
    }

    _createHtmlProps(bgColor, ratio) {
        if (window.innerHeight / window.innerWidth > (ratio.h / ratio.w)) {
            this._width = window.innerWidth;
            this._height = window.innerWidth / (ratio.w / ratio.h);
        } else {
            this._width = window.innerHeight / (ratio.h / ratio.w);
            this._height = window.innerHeight;
        }
        document.body.style.backgroundColor = bgColor;
        
        this._height = 500;
        this._width = 500;
    }

    _createScene(bgColor) {
        let scene = new THREE.Scene();
        scene.background = new THREE.Color(bgColor);
        return scene;
    }

    _createCamera() {
        let aspect = this._width / this._height;
        let d = 10;
        let camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000); 
        camera.position.set(20, 20, 20);
        this._center.x = (this.columns - 1) / 2;
        this._center.z = (this.rows - 1) / 2;
        camera.lookAt(this._center.x, 0, this._center.z);
        return camera;
    }

    _createRenderer() {

        let renderer = new THREE.WebGLRenderer({ antialias: true});
        renderer.setSize(this._width, this._height);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.setAnimationLoop(animation);
        renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(renderer.domElement);
        return renderer;
    }

    _initTiles() {
        let tiles = [];
        for (let i = 0; i < this.rows; i++) {
            tiles[i] = [];
            for (let j = 0; j < this.columns; j++) {
                tiles[i][j] = { type: 0, shift: 0, obj: undefined };
            }
        }
        return tiles;
    }

    SetTiles() {
        let x = 1;
        let y = x;
        const geometry = new THREE.BoxGeometry(x, y, x);
        const materials = materializer.CreateMaterials(this.types, geometry);

        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
                const material = materials[this.tiles[i][j].type];
                const cube = new THREE.Mesh(geometry, material);
                //cube.material.uniforms.uTex.value.needsUpdate = true;
                cube.castShadow = true;
                cube.receiveShadow = true;
                cube.position.set(j, y / 2, i);
                this.tiles[i][j].obj = cube;
                this.Add(cube);
            }
        }
    }

    GetScene() {
        return this._scene;
    }

    GetCamera() {
        return this._camera;
    }

    Add(obj) {
        this._scene.add(obj);
    }

}

const worldConfig = {
    columns: 8, // columns
    rows: 8, // rows
    types: 7,
    bgColor: '#ffffff',
};

console.log(tokenData);

const world = new World(worldConfig);
const engine = new Engine();
const materializer = new Materializer();

engine._createLevel();
world.SetTiles();


let strTable;
for (let i = 0; i < world.tiles.length; i++) {
    strTable += '\n';
    for (let j = 0; j < world.tiles[i].length; j++) {
        let tile = world.tiles[i][j];
        strTable += ' ' + tile.type;
    }
}
console.log(strTable);

//let obj = level.tiles[7][6];
//obj.position.set(obj.position.x, 2, obj.position.z)

/* let up = (world.columns) / 2;
for (let i = 0; i < world.columns; i++) {
    for (let j = 0; j < world.tiles.length; j++) {
        let obj = world.tiles[j][i].obj;
        obj.position.set(obj.position.x, world.columns - i - up, obj.position.z);
    }
    for (let j = 0; j < world.tiles.length; j++) {
        let obj = world.tiles[i][j].obj
        obj.position.set(obj.position.x, world.columns - j - up, obj.position.z);
    }
    console.log(i);
} */

/* let up = world.columns - 1;
for (let i = 0; i < world.tiles.length; i++) {
    for (let j = 0; j < world.tiles[i].length; j++) {
        let obj = world.tiles[i][j].obj;
        let a = 1;
        obj.position.y = -1 * (obj.position.x / a + obj.position.z / a - up);

    }
} */

function helpers() {
    const size = ((world.columns > world.rows ? world.columns : world.rows) - 1) * 2;
    const gridHelper = new THREE.GridHelper(size, size);
    world.Add(gridHelper);

    const axesHelper = new THREE.AxesHelper(size / 2);
    world.Add(axesHelper);

    const dotGeometry = new THREE.Geometry();
    dotGeometry.vertices.push(new THREE.Vector3(world.center.x, 0, world.center.z));
    const dotMaterial = new THREE.PointsMaterial({
        size: 6,
        sizeAttenuation: false,
        color: 0xff0000
    });
    const dotCenter = new THREE.Points(dotGeometry, dotMaterial);
    world.Add(dotCenter);
}


function animation(time) {
    time *= 0.001

    world._renderer.render(world._scene, world._camera); // ignore _private 

    for (let i = 0; i < world.tiles.length; i++) {
        for (let j = 0; j < world.tiles[i].length; j++) {
            let cube = world.tiles[i][j].obj;
            cube.material.uniforms.uTex.value.needsUpdate = true;
        }
    }

    /* let up = world.columns - 1;
    for (let i = 0; i < world.tiles.length; i++) {
        for (let j = 0; j < world.tiles[i].length; j++) {
            let obj = world.tiles[i][j].obj;
            let a = 9;
            obj.position.y = Math.sin( time / 2 * Math.PI + (obj.position.x / a + obj.position.z / a - a)) * a; 
        }
    } */

    materializer.textures.forEach(t => {
        t.draw(time);
    });

    //animRect(time);
    //rects(time);
}