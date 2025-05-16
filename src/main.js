import * as THREE from 'three';
import { frame } from 'motion';
import fragmentShaderSource from './fragment.glsl?raw';

const timeOffset = 1000.0;
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
  uAnimSpeed: { value: .2 },
  uFOV: { value: 0.5},
  iResolution: { value: new THREE.Vector3() },
  uMouse: { value: new THREE.Vector2(0, 0) },
};

const scene = new THREE.Scene();
const plane = new THREE.PlaneGeometry(2, 2);
const material = new THREE.ShaderMaterial({
  fragmentShader: fragmentShaderSource,
  uniforms,
});
scene.add(new THREE.Mesh(plane, material));

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

function resizeCanvas() {
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Call resizeCanvas on window resize
window.addEventListener('resize', resizeCanvas);

function updateMousePosition(event) {
  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) / canvas.width;
  const y = 1.0 - (event.clientY - rect.top) / canvas.height;
  uniforms.uMouse.value.set(x, y);
  console.log(x, y)
}

canvas.addEventListener('mousemove', updateMousePosition);

function updateFrame() {
  var time = performance.now();
  uniforms.uTime.value = time * 0.001 + timeOffset; // set time to seconds
  uniforms.iResolution.value.set(canvas.width, canvas.height, 1);
  renderer.render(scene, camera);
}

// run the animation
frame.update(updateFrame, true);
