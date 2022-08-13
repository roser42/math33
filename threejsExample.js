class Random {
    constructor() {
            this.useA = false;
            let sfc32 = function(uint128Hex) {
                let a = parseInt(uint128Hex.substr(0, 8), 16);
                let b = parseInt(uint128Hex.substr(8, 8), 16);
                let c = parseInt(uint128Hex.substr(16, 8), 16);
                let d = parseInt(uint128Hex.substr(24, 8), 16);
                return function() {
                    a |= 0;
                    b |= 0;
                    c |= 0;
                    d |= 0;
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
    let hash = "0x";
    for (var i = 0; i < 64; i++) {
        hash += Math.floor(Math.random() * 16).toString(16);
    }
    data.hash = hash;
    data.tokenId = (projectNum * 1000000 + Math.floor(Math.random() * 1000)).toString();
    return data;
}

const tokenData = genTokenData(123);
let R = new Random();

let camera, scene, renderer, light, curPalette;
const helpersOn = false;

var level = {
    sizeX: 8,
    sizeZ: 8,
    center: { x: 0, z: 0 },

    tiles: [],
    selectedTitle: { selected: false, column: 0, row: 0 },

    bgcolor: '#000000',

};

var palette_1 = [
    '#274D5B',
    '#46988E',
    '#F8E181',
    '#FAAC6A',
    '#D46D4F',
    '#925E78',
    '#F05365'
];

var palette_2 = [
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

function strokeRects() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const dpr = 3;
    ctx.canvas.width = 256 * dpr;
    ctx.canvas.height = ctx.canvas.width;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = R.random_choice(curPalette);;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    var centerX = canvas.width / 2 / dpr;
    var centerY = canvas.height / 2 / dpr;
    ctx.lineWidth = 10;
    ctx.strokeStyle = 'black';
    for (var side = 20; side <= 400; side += 40) {
        ctx.strokeRect(centerX - side / 2, centerY - side / 2, side, side);
    }

    return new THREE.Texture(canvas);
}

function rects() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const dpr = 3;
    ctx.canvas.width = 256 * dpr;
    ctx.canvas.height = ctx.canvas.width;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = R.random_choice(curPalette);;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = 'black';
    const x = 200;
    const y = x;
    const xCenter = (ctx.canvas.width / 2 / dpr) - x / 2;
    const yCenter = (ctx.canvas.height / 2 / dpr) - y / 2;
    ctx.fillRect(xCenter, yCenter, x, y);

    return new THREE.Texture(canvas);
}

const palettes = [palette_1, palette_2];
const patterns = [cross, strokeRects, rects];

init();
setTable();
console.log(tokenData);

//let obj = level.tiles[7][6];
//obj.position.set(obj.position.x, 2, obj.position.z)
/* for (let i = 0; i < level.sizeX; i++) {
    for (let j = 0; j < level.tiles.length; j++) {
        let obj = level.tiles[j][i];
        obj.position.set(obj.position.x, level.sizeX - j, obj.position.z);
    }
    for (let j = 0; j < level.tiles.length; j++) {
        let obj = level.tiles[i][j];
        obj.position.set(obj.position.x, level.sizeX - j, obj.position.z);
    }
    console.log(i);
} */

let up = level.sizeX - 1;
for (let i = 0; i < level.tiles.length; i++) {
    for (let j = 0; j < level.tiles[i].length; j++) {
        let obj = level.tiles[i][j];
        let a = 1;
        obj.position.y = -1 * (obj.position.x / a + obj.position.z / a - up);

    }
}

function init() {
    let width = 0;
    let height = 0;

    if (window.innerHeight / window.innerWidth > 1.333333) {
        width = window.innerWidth;
        height = window.innerWidth / 0.75;
    } else {
        width = window.innerHeight / 1.333333;
        height = window.innerHeight;
    }

    scene = new THREE.Scene();
    scene.background = new THREE.Color(level.bgcolor);
    //document.body.style.backgroundColor = level.bgcolor;

    let aspect = width / height;
    let d = 10;
    camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);
    camera.position.set(20, 20, 20);
    level.center.x = (level.sizeX - 1) / 2;
    level.center.z = (level.sizeZ - 1) / 2;
    camera.lookAt(level.center.x, 0, level.center.z);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setAnimationLoop(animation);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    /* scene.add(new THREE.AmbientLight(0xffffff, 1));
    light = new THREE.DirectionalLight(0xffffff, 0.1);
    light.castShadow = true;
    light.position.set(0, 1, 0).normalize();
    scene.add(light); */

    curPalette = R.random_choice(palettes);

    if (helpersOn) {
        helpers();
    }

}

function helpers() {
    const size = ((level.sizeX > level.sizeZ ? level.sizeX : level.sizeZ) - 1) * 2;
    const divisions = size;
    const gridHelper = new THREE.GridHelper(size, divisions);
    scene.add(gridHelper);

    const axesHelper = new THREE.AxesHelper(size / 2);
    scene.add(axesHelper);

    var dotGeometry = new THREE.Geometry();
    dotGeometry.vertices.push(new THREE.Vector3(level.center.x, 0, level.center.z));
    var dotMaterial = new THREE.PointsMaterial({
        size: 6,
        sizeAttenuation: false,
        color: 0xff0000
    });
    var dotCenter = new THREE.Points(dotGeometry, dotMaterial);
    scene.add(dotCenter);
}

function setTable() {
    for (let i = 0; i < level.sizeZ; i++) {
        level.tiles[i] = [];
        for (let j = 0; j < level.sizeX; j++) {
            //let x = R.random_int(3, 10) / 10;
            //let y = R.random_int(5, 10) / 10;
            let x = 1;
            let y = x;
            const patternTex = R.random_choice(patterns)();
            const geometry = new THREE.BoxGeometry(x, y, x);
            let material = new THREE.ShaderMaterial({
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
                    color: {
                        value: new THREE.Color('white')
                    },
                    edgeColor: {
                        value: new THREE.Color('black')
                    },
                    uTex: {
                        value: patternTex
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
                uniform vec3 color;
                uniform vec3 edgeColor;
                
                uniform sampler2D uTex;
                void main() {
                    float a = smoothstep(thickness, thickness + smoothness, length(abs(vPos.xy) - size.xy));
                    a *= smoothstep(thickness, thickness + smoothness, length(abs(vPos.yz) - size.yz));
                    a *= smoothstep(thickness, thickness + smoothness, length(abs(vPos.xz) - size.xz));
                    
                    vec3 uTexColor = texture(uTex, vUv).rgb;
                    vec3 c = mix(edgeColor, uTexColor, a);
                    
                    gl_FragColor = vec4(c, 1.0);
                    //gl_FragColor = texture2D(uTex, vUv);
                }
              `,
                extensions: { derivatives: true }
            });

            const cube = new THREE.Mesh(geometry, material);
            cube.material.uniforms.uTex.value.needsUpdate = true;
            cube.castShadow = true;
            cube.receiveShadow = true;
            cube.position.set(j, y / 2, i);
            level.tiles[i][j] = cube;
            scene.add(cube);
        }
    }
}




function animation(time) {
    renderer.render(scene, camera);
}