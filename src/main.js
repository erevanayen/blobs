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
  uFOV: { value: 10 },
  iResolution: { value: new THREE.Vector3() },
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
float st = 200.;                    // end marching scene threshold

const vec3[] paletteTropical = vec3[] (
  vec3(0.500, 0.500, 0.500),
	vec3(0.500, 0.500, 0.500),
	vec3(0.368, 0.368, 0.230),
	vec3(0.000, 0.200, 0.500)
);

vec3 palette(float t) {
	const vec3[] usedPalette = paletteTropical;
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

// Distance to the scene
float map(vec3 p) {

  float sphere = sdSphere(p, uSphereSize);  // sphere SDF

  // Closest distance to the scene
  return sphere;
}

void main() {
  vec2 uv = (gl_FragCoord.xy * 2. - iResolution.xy) / iResolution.y;
  
  // Initialization
  vec3 ro = vec3(0., 0., -3.);             // ray origin
  vec3 rd = normalize(vec3(uv* uFOV, 1.)); // ray direction
  vec3 col = vec3(0.0);                    // final pixel color

  float t = 0.;                            // total distance traveled

  // Default circular motion
  vec2 m = vec2(cos(uTime*uSpeedRot), sin(uTime*uSpeedWave));

  // Raymarching
  int i;
  for (i = 0; i < it; i++) {
    vec3 p = ro + rd * t;    // position along the ray

    float d = map(p);        // current distance to the scene

    t += d;                  // march the ray
    col = vec3(i) / float(it);

    if (d < dt) break;       // early stop if close enough
    if (t > st) break;       // early stop if too far
  }

  // Coloring
  col = palette(t*.04 + float(i)*0.005);

	gl_FragColor = vec4(col, 1);
  //gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
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