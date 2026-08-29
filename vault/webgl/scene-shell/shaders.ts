/**
 * Shader source for the scene shell.
 *
 * Provenance: original work for this project. No third-party code copied.
 * The gradient-noise technique is standard GLSL practice; this implementation
 * was written from first principles.
 *
 * Kept as plain strings in a `.ts` file rather than `.glsl` imports: Next's
 * Turbopack pipeline has no GLSL loader configured here, and adding one is a
 * build-config change that should be a deliberate decision rather than a side
 * effect of adding one shader. `references/folio-2019-architecture.md` notes
 * `vite-plugin-glsl` as the better authoring experience if we ever move that way.
 */

export const vertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

/**
 * Animated two-colour gradient with film grain.
 *
 * The grain matters more than it looks: a perfectly smooth GPU gradient shows
 * visible banding on 8-bit displays, which reads as cheap. A small amount of
 * noise dithers the gradient and removes the banding entirely — the same
 * reason film grain is added to digital colour grades.
 */
export const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uGrain;

  varying vec2 vUv;

  // Cheap hash-based noise. Not high quality, and it does not need to be:
  // it is dithering a gradient at very low amplitude, not generating a texture.
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }

  void main() {
    // Diagonal ramp, drifting slowly. The 0.1 multiplier keeps the motion
    // below the threshold where it reads as "animated" — it should feel alive,
    // not busy.
    float ramp = smoothstep(0.0, 1.0, (vUv.x + vUv.y) * 0.5 + sin(uTime * 0.1) * 0.1);

    vec3 color = mix(uColorA, uColorB, ramp);

    // Grain, applied after mixing so it dithers the final value.
    float grain = (random(vUv + fract(uTime)) - 0.5) * uGrain;
    color += grain;

    gl_FragColor = vec4(color, 1.0);
  }
`
