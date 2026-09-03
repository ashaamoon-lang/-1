/**
 * Shader source for the material layer.
 *
 * Provenance: original work for this project. No third-party code copied.
 * The flowmap-displacement technique is standard GLSL practice; this
 * implementation was written against `lib/webgl/utils/flowmaps/flowmap-sim.ts`
 * (MIT, darkroom.engineering), whose output texture it consumes but whose
 * code it does not contain.
 *
 * Kept as plain strings for the same reason as
 * `vault/webgl/scene-shell/shaders.ts`: there is no GLSL loader in this
 * Turbopack pipeline, and adding one should be a deliberate build decision
 * rather than a side effect of adding a shader.
 */

export const vertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

/**
 * The plate, warped by a pointer velocity field.
 *
 * ## The flowmap is in screen space, the plate is not
 *
 * `Flowmap` renders a full-viewport velocity field and stamps it at the
 * normalized cursor position, so its texture is addressed in *screen* UVs.
 * The mesh's own `vUv` runs 0–1 across the plate wherever the plate happens
 * to sit. Sampling the flowmap with `vUv` would therefore give every card an
 * identical, wrongly-placed copy of the whole field — each plate would ripple
 * as though the cursor were inside it no matter where the cursor actually was.
 *
 * `gl_FragCoord.xy / uResolution` is the screen UV of this fragment, which is
 * the coordinate the field is actually drawn in. The offset it produces is
 * then applied to `vUv`, which is the coordinate the plate is drawn in. Two
 * different spaces on purpose.
 *
 * ## Why the ambient drift exists
 *
 * With a still pointer the field decays to zero and the plate is exactly the
 * static image — which is correct, and also inert. A very low-amplitude
 * sinusoidal drift keeps the surface alive without becoming an animation:
 * `uDrift` is roughly a quarter of `uDisplacement`, over a 12-second cycle.
 *
 * ## Why there is a second input
 *
 * The field above is the pointer's, and only the pointer's. Measured in
 * `docs/stages/TAHAP-21.md` §2: a sweep across a plate moves 2.6% of its
 * pixels, **scrolling moves 0.00%**. So the one original surface on this site
 * could only be met by a reader who happened to drag a mouse across an image;
 * a reader who scrolled — which is how a portfolio is actually read — never
 * met it at all.
 *
 * `uShear` is that reader's input. It is a single signed number for the whole
 * plate, not a second stamp: a scroll disturbs the entire surface at once,
 * unlike a cursor, which disturbs the place it is. Because it is added into
 * the same `offset` as the other two, it inherits the edge falloff below for
 * free — the border stays pinned and only the interior lags, which is what
 * makes it read as the weight of a surface rather than a picture sliding
 * around inside its frame. It is deliberately the quietest of the three
 * (`vault/motion/tokens.ts`: `shear` < `displacement`), because scrolling is
 * continuous and sweeping is a choice.
 *
 * ## Edges
 *
 * Warped UVs can leave 0–1 and sample the clamped border, which shows as a
 * smear along the plate's edge. `clamp` is not enough — it produces exactly
 * that smear. The offset is instead scaled down toward the edges by
 * `edgeFalloff`, so the frame of the plate stays still and only its interior
 * moves. A commissioned work with a wobbling edge reads as a broken image,
 * not as a material.
 */
export const fragmentShader = /* glsl */ `
  uniform sampler2D uTexture;
  uniform sampler2D uFlow;
  uniform float uHasFlow;
  uniform float uDisplacement;
  uniform float uDrift;
  uniform float uDriftPeriod;
  uniform float uShear;
  uniform float uTime;
  uniform vec2 uResolution;

  varying vec2 vUv;

  const float PI2 = 6.28318530718;

  void main() {
    // Screen UV — the space the velocity field is rendered in. See the note
    // above; this is deliberately not vUv.
    vec2 screenUv = gl_FragCoord.xy / uResolution;

    vec2 flow = texture2D(uFlow, screenUv).rg * uHasFlow;

    float phase = uTime / uDriftPeriod * PI2;
    vec2 drift = vec2(sin(phase), cos(phase * 0.75)) * uDrift;

    // Three inputs, one offset — so all three inherit the edge falloff below.
    // uShear is the scroll's, already decayed and clamped on the JS side.
    vec2 offset = flow * uDisplacement + drift + vec2(0.0, uShear);

    // Hold the border still. smoothstep from the edge inward on both axes,
    // multiplied, so the falloff is a soft frame rather than a vignette.
    vec2 edge = smoothstep(0.0, 0.12, vUv) * smoothstep(0.0, 0.12, 1.0 - vUv);
    float edgeFalloff = edge.x * edge.y;

    gl_FragColor = texture2D(uTexture, vUv + offset * edgeFalloff);
  }
`
