import * as THREE from 'three';

const canvas = document.getElementById('myCanvas');
// const camera = new THREE.OrthographicCamera(-5, 5, 5, -5, 0.1, 1000);
const camera = new THREE.OrthographicCamera(
  -1, // left
  1, // right
  1, // top
  -1, // bottom
  -1, // near,
  1, // far
);
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  canvas: canvas,
});
renderer.autoClearColor = false;

// uniforms for the shader
const uniforms = {
  uTime: { value: 0 },
  uSpeedRot: { value: 1. },
  uSpeedWave: { value: 1. },
  uFOV: { value: 0.5 },
  iResolution: { value: new THREE.Vector3() },
  uSphereSize: { value: 1.0 },
};

const fragmentShader = `
#include <common>
precision mediump float;

uniform vec3 iResolution;
uniform float uTime;
uniform float uSphereSize;
uniform float uSpeedRot;
uniform float uSpeedWave;
uniform float uFOV;

int it = 90;                        // number of max iterations
float dt = .001;                    // end marching detail threshold
float st = 20.;                    // end marching scene threshold
float contrast = 1.2;

const vec3[] palette1 = vec3[] (
  // [[0.468 0.528 -0.642] [0.498 0.558 0.388] [0.468 0.198 0.748] [-0.052 -0.002 0.667]]
  vec3(0.468, 0.528, -0.642),
  vec3(0.498, 0.558, 0.388),
  vec3(0.468, 0.198, 0.748),
  vec3(-0.052, -0.002, 0.667)
);

const vec3[] palette3 = vec3[] (
// [[-1.032 0.518 -0.652] [2.058 0.570 0.396] [0.698 0.313 1.182] [-0.002 -0.003 0.665]]
  vec3(-1.032, 0.518, -0.652),
  vec3(2.058, 0.570, 0.396),
  vec3(0.698, 0.313, 1.182),
  vec3(-0.002, -0.003, 0.665)
);

const vec3[] palette2 = vec3[] (
// [[-0.552 0.500 -0.002] [0.000 0.500 0.000] [1.000 0.888 0.448] [0.000 0.358 0.667]]
  vec3(-0.552, 0.500, -0.002),
  vec3(0.000, 0.500, 0.000),
  vec3(1.000, 0.888, 0.448),
  vec3(0.000, 0.358, 0.667)
);

const vec3[] palette4 = vec3[] (
// [[-1.032 0.518 0.248] [2.058 0.570 0.168] [0.698 0.313 -0.642] [-0.002 -0.003 0.558]]
  vec3(-1.032, 0.518, 0.248),
  vec3(2.058, 0.570, 0.168),
  vec3(0.698, 0.313, -0.642),
  vec3(-0.002, -0.003, 0.558)
);

vec3 palette(float t) {
	const vec3[] usedPalette = palette4;
	vec3 a = usedPalette[0];
	vec3 b = usedPalette[1];
	vec3 c = usedPalette[2];
	vec3 d = usedPalette[3];

	return a + b*cos(6.28318*(c*t+d));
}

// sine distance to a sphere
float sdSphere(vec3 p, float s) {
	return length(p) - s;
}

// smooth minimum for smoooooooth blending
float smin(float a, float b, float k) {
	float h = max(k-abs(a-b), 0.0)/k;
	return min(a,b) - h*h*h*k*(1.0/6.0);
}

mat2 rot2D(float angle) {
	float s = sin(angle);
	float c = cos(angle);
	return mat2(c, -s, s, c);
}

// Distance to the scene
float map(vec3 p) {
  vec3 spherePos = vec3(sin(uTime/5.) * 2.,
                        sin(uTime/2.) * 0.5 - 0.8,
                        sin(uTime/3.) * 1.5);

  float sphere = sdSphere(p - spherePos, uSphereSize);  // sphere SDF

  vec3 spherePos2 = vec3(sin(uTime/4. - 3.14159) * 2.,
                        sin(uTime/1.5) * 0.5 - 0.8,
                        sin(uTime/2. - 3.14159) * 1.5);
  float sphere2 = sdSphere(p - spherePos2, uSphereSize);  // sphere SDF


  float ground = p.y + .75;                            // ground plane

  // Closest distance to the scene
  return smin(ground, smin(sphere, sphere2, 2.), 2.);
}

void main() {
  vec2 uv = (gl_FragCoord.xy * 2. - iResolution.xy) / iResolution.y;
  
  // Initialization
  vec3 ro = vec3(0., 0., -3.);             // ray origin
  vec3 rd = normalize(vec3(uv * uFOV, 1.));       // ray direction
  vec3 col = vec3(0.0);                    // final pixel color

  float t = 0.;                            // total distance traveled

  // rotate camera
  ro.yz *= rot2D(0.7);
  rd.yz *= rot2D(0.7);

  // Raymarching
  int i;
  for (i = 0; i < it; i++) {
    vec3 p = ro + rd * t;    // position along the ray

    float d = map(p);        // current distance to the scene

    t += d;                  // march the ray

    if (d < dt) break;       // early stop if close enough
    if (t > st) break;       // early stop if too far
  }

  // Coloring
  col = palette((t*.04 + float(i)*0.005) * contrast);
  //col = vec3(t * .2);

	gl_FragColor = vec4(col, 1.);
}
`;

const scene = new THREE.Scene();
const plane = new THREE.PlaneGeometry(2, 2);
const material = new THREE.ShaderMaterial({
  fragmentShader,
  uniforms,
});
scene.add(new THREE.Mesh(plane, material));

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


function animate(time) {
  time *= 0.001; // convert time to seconds
  uniforms.uTime.value = time;
  uniforms.iResolution.value.set(canvas.width, canvas.height, 1);

  renderer.render(scene, camera);

  requestAnimationFrame(animate);
}

function resizeCanvas() {
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Call resizeCanvas on window resize
window.addEventListener('resize', resizeCanvas);

animate();