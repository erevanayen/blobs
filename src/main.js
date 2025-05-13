import * as THREE from 'three';
import { frame } from 'motion';
import fragmentShaderSource from './fragment.glsl?raw';

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
  uSpeedRot: { value: .2 },
  uFOV: { value: 0.5 },
  iResolution: { value: new THREE.Vector3() },
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


function animateFrame(time) {
  time *= 0.001; // convert time to seconds
  uniforms.uTime.value = time;
  uniforms.iResolution.value.set(canvas.width, canvas.height, 1);

  renderer.render(scene, camera);

  requestAnimationFrame(animateFrame);
}

function resizeCanvas() {
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Call resizeCanvas on window resize
window.addEventListener('resize', resizeCanvas);

// animateFrame();

function updateFrame() {
  var time = performance.now();
  uniforms.uTime.value = time * 0.001; // set time to seconds
  uniforms.iResolution.value.set(canvas.width, canvas.height, 1);
  renderer.render(scene, camera);
}
frame.update(updateFrame, true);
