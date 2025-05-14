#include <common>
precision mediump float;

uniform vec3 iResolution;
uniform float uTime;
uniform float uSpeedRot;
uniform float uFOV;

int it = 120;                        // number of max iterations
float dt = .001;                    // end marching detail threshold
float st = 100.;                    // end marching scene threshold
float contrast = 1.0;

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
float map(vec3 p, float speedRot, float sphereSize) {
  vec3 spherePos = vec3(sin(uTime/5. * speedRot) * 2.,
                        sin(uTime/2. * speedRot) * 0.5 - 0.8,
                        sin(uTime/3. * speedRot) * 1.5);

  float sphere = sdSphere(p - spherePos, sphereSize);  // sphere SDF

  vec3 spherePos2 = vec3(sin(uTime/4. * speedRot - 3.14159) * 2.,
                        sin(uTime/1.5 * speedRot) * 0.5 - 0.8,
                        sin(uTime/2. * speedRot - 3.14159) * 1.5);
  float sphere2 = sdSphere(p - spherePos2, sphereSize);  // sphere SDF


  float ground = p.y + .25;                            // ground plane

  // Closest distance to the scene
  return smin(ground, smin(sphere, sphere2, 2.), 4.);
}
float blendOverlay(float a, float b) {
  return a<.5 ? (2.*a*b) : (1.-2.*(1.-a)*(1.-b));
}
vec4 bmOverlay(vec4 a, vec4 b) {
  return vec4(blendOverlay(a.r, b.r), blendOverlay(a.g, b.g), blendOverlay(a.b, b.b), a.a);
}
vec4 bmAlphaOverlay(vec4 a, vec4 b, float opacity) {
  return (bmOverlay(a, b) * opacity + b * (1. - opacity));
}

// orange gradient
vec3[4] gradOr1 = vec3[] (
  vec3(.286, .106, .051), // dark red #481b0d
  vec3(.898, .549, .035), // dark orange #e48b08
  vec3(0.98, 0.686, 0.2), // light orange #f9ae33
  vec3(.2)
);

vec3[4] gradOr2 = vec3[] (
  vec3(0.98, 0.686, 0.2), // light orange #f9ae33
  vec3(.286, .106, .051), // dark red #481b0d
  vec3(.898, .549, .035), // dark orange #e48b08
  vec3(.1)
);
// green gradient
// red, green, blue, middle-point
vec3[4] gradGr1 = vec3[] (
  vec3(0., .255, .212),   // dark green #004136
  vec3(.008, .557, .498), // teal #028e7e
  vec3(.549, .773, .247), // lime #8bc53e
  vec3(.2)
);

vec3[4] gradGr2 = vec3[] (
  vec3(.549, .773, .247), // lime #8bc53e
  vec3(0., .255, .212),   // dark green #004136
  vec3(.008, .557, .498), // teal #028e7e
  vec3(.2)
);

vec3 gradientPalette(float t, vec3[4] usedGradient) {
  float scaledT = t / (st*0.01);
  float mcp = usedGradient[3].x; // middle color position

  vec3 resultColor = mix(
    mix(usedGradient[0], usedGradient[1], scaledT/mcp),
    mix(usedGradient[1], usedGradient[2], (scaledT - mcp) / (1.0 - mcp)),
    step(mcp, scaledT)
  );
  
  return resultColor;
}

// renders two sdf spheres merging into a plane
// the spheres are animated and move along the plane
// uv is the normalized screen coordinates
// camRot is the rotation of the camera
vec4 blobScene(vec2 uv, float sphereSize, vec3 camRot, float camDist, float speedRot, vec3[4] usedGradient, float timeOffset) {
  vec4 sceneOut = vec4(0.0);
  
  // Initialization
  vec3 ro = vec3(0., 0., -camDist);               // ray origin
  vec3 rd = normalize(vec3(uv * uFOV, 1.));  // ray direction
  vec3 col = vec3(0.0);                      // final pixel color
  float t = 0.;                              // total distance traveled

  // rotate camera
  ro.yz *= rot2D(camRot.x);
  rd.yz *= rot2D(camRot.x);

  // Raymarching
  int i;
  for (i = 0; i < it; i++) {
    vec3 p = ro + rd * t;    // position along the ray

    float d = map(p, speedRot, sphereSize);        // current distance to the scene

    t += d;                  // march the ray

    if (d < dt) break;       // early stop if close enough
    if (t > st) break;       // early stop if too far
  }

  // Coloring
  col = gradientPalette((t*.04 + float(i)*0.005) * contrast, usedGradient);

  sceneOut = vec4(col, 1.);
  return sceneOut;
}

void main() {
  // normalize uv coordinates
  vec2 uv = (gl_FragCoord.xy * 2. - iResolution.xy) / iResolution.y;

  vec4 scene1 = blobScene(uv, 1.0, vec3(1., 0.6, 0.), 2.2, uSpeedRot, gradOr1, 0.);
  vec4 scene2 = blobScene(uv, 1.3, vec3(1.2, 0.7, 0.), 3.2, uSpeedRot * -2., gradOr2, 10.);

	gl_FragColor = bmAlphaOverlay(scene1, scene2, abs(sin(uTime/8.))*1.);
	// gl_FragColor = bmAlphaOverlay(scene1, scene2, 1.);
  // gl_FragColor = scene1;
  // gl_FragColor = scene2;
}
