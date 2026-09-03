'use client'

/**
 * MaterialImageScene — the R3F side of the material layer.
 *
 * Provenance: original work for this project. No third-party code copied.
 * Written against the public APIs of @react-three/fiber, @react-three/drei
 * and three, plus this project's own `lib/webgl` (MIT,
 * darkroom.engineering).
 *
 * Rendered *inside* the canvas — reached via `<WebGLTunnel>`, never mounted
 * directly. See `index.tsx` for the DOM-side entry point.
 */

import { useTexture } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import type { Rect } from 'hamo'
import { useEffect, useMemo, useRef } from 'react'
import {
  type IUniform,
  LinearFilter,
  type Mesh,
  type ShaderMaterial,
  type Texture,
  Vector2,
} from 'three'

import { useFlowmap } from '@/webgl/components/flowmap-provider'

import { fragmentShader, vertexShader } from './shaders'

/**
 * The material's uniform block.
 *
 * Written out rather than inferred so the two nullable texture slots are
 * nullable in the type as well as at runtime: `uFlow` is null whenever the
 * root canvas did not opt into the flowmap sim, and `uTexture` is null until
 * the DOM image has decoded.
 */
interface MaterialUniforms {
  /*
   * three types a ShaderMaterial's `uniforms` as an index signature, so one is
   * required here for the object to be assignable — but declaring the keys
   * alongside it is what makes a typo in `uniforms.uDisplcement` a compile
   * error instead of a uniform that silently stays at its initial value.
   */
  [uniform: string]: IUniform
  uTexture: IUniform<Texture | null>
  uFlow: IUniform<Texture | null>
  uHasFlow: IUniform<number>
  uDisplacement: IUniform<number>
  uDrift: IUniform<number>
  uDriftPeriod: IUniform<number>
  uShear: IUniform<number>
  uTime: IUniform<number>
  uResolution: IUniform<Vector2>
}

interface MaterialImageSceneProps {
  /** The already-decoded source the DOM `<img>` settled on. */
  src: string
  /** The DOM box this mesh stands in for. */
  rect: Rect
  /** Peak UV offset from the velocity field. */
  displacement: number
  /** Ambient UV drift amplitude. */
  drift: number
  /** Seconds per ambient drift cycle. */
  driftPeriod: number
  /** Peak UV offset of the plate's interior from scroll velocity. */
  shear: number
  /** Scroll speed, CSS px per second, at which `shear` saturates. */
  shearVelocity: number
  /** Exponential decay time constant, in seconds, for the shear. */
  shearTau: number
  /** False when the element is outside the viewport — skips all per-frame work. */
  visible: boolean
  /**
   * Called once, after the first frame this mesh could actually have been
   * drawn in: texture bound, rect measured, matrix written.
   *
   * The DOM side hides its `<img>` only after this fires. Without it the
   * shell had to *assume* the mesh was drawing, and when that assumption was
   * wrong the result was an empty box — no error, no failing gate, just a
   * missing work. See `index.tsx`.
   */
  onFirstFrame: () => void
}

/**
 * Longest frame the shear will treat as real, in seconds.
 *
 * A backgrounded tab, a long task, or a programmatic jump can hand this loop
 * a delta of several seconds. Dividing a scroll distance by that produces a
 * velocity the clamp would saturate anyway, but clamping the *frame* also
 * keeps the decay honest: `exp(-3 / tau)` is indistinguishable from a hard
 * snap. Same guard, same value, as the cursor's `MAX_FRAME_MS`.
 */
const MAX_FRAME_SECONDS = 0.1

/**
 * The uniform block three is actually rendering from.
 *
 * ## The defect this exists to close
 *
 * This component built its uniforms with `useMemo`, handed the object to
 * `<shaderMaterial uniforms={...} />`, and then mutated **that** object every
 * frame — which is the shape every three.js tutorial shows, and which does
 * not hold here. Measured on the production build: the plate's own uniforms
 * reached the GPU **exactly once each** (`uTime`, `uShear`, `uDisplacement`,
 * `uDrift`, `uDriftPeriod`: one `uniform1f` call apiece for the life of the
 * page) while the JS values advanced normally every frame — `uTime` 6.38 →
 * 6.82 → 7.23 in the component, and 0 on the GPU.
 *
 * So the plate rendered from frame zero's values forever: no pointer warp, no
 * ambient drift, a static image drawn through a shader that could do neither.
 * It shipped that way in Tahap 14 and every gate stayed green, because no gate
 * had ever asked whether the material *moved* — only whether a canvas existed
 * and drew something.
 *
 * `vault/webgl/scene-shell/scene.tsx` was correct all along and is why this
 * was findable: its wash animates, and the single structural difference was
 * that it writes through `materialRef.current.uniforms`. This helper makes
 * that the rule for both, and `visible: false` is what proves the difference —
 * before the fix the two plates below the fold and the two above it rendered
 * identically frozen.
 *
 * Falls back to the memoised block before the material exists, so the values
 * the effects push in are not lost between mount and first frame.
 */
function uniformsOf(
  material: ShaderMaterial | null,
  fallback: MaterialUniforms
): MaterialUniforms {
  /*
   * SAFETY: three types `ShaderMaterial.uniforms` as a loose record of
   * `IUniform`, which is the same index signature `MaterialUniforms` declares.
   * The object being narrowed is the one this module handed to
   * `<shaderMaterial uniforms={...} />` — three copies the reference, it does
   * not rebuild the block — so every key below exists with the declared type.
   * `?? fallback` covers the only other state, before the material exists.
   */
  return (material?.uniforms as MaterialUniforms | undefined) ?? fallback
}

/** A rect is only usable once the DOM has actually been measured. */
function isRectValid(rect: Rect): boolean {
  return (
    rect.width !== undefined &&
    rect.height !== undefined &&
    rect.top !== undefined &&
    rect.left !== undefined
  )
}

export function MaterialImageScene({
  src,
  rect,
  displacement,
  drift,
  driftPeriod,
  shear,
  shearVelocity,
  shearTau,
  visible,
  onFirstFrame,
}: MaterialImageSceneProps) {
  const meshRef = useRef<Mesh>(null)
  const materialRef = useRef<ShaderMaterial>(null)
  const size = useThree((state) => state.size)
  const announced = useRef(false)

  /*
   * The scroll offset the previous drawn frame stood at, and the shear
   * currently applied. Refs, not state: both are written inside the frame
   * loop, and a `setState` there would re-render the scene on the frame it is
   * trying to draw.
   *
   * `null` means "no previous frame to difference against" — the first frame
   * after mount, and the first frame after the plate re-enters the viewport.
   * Both must produce zero velocity rather than a delta measured across the
   * whole journey the plate spent off screen.
   */
  const lastScroll = useRef<number | null>(null)
  const shearValue = useRef(0)

  /*
   * `null` whenever the root canvas did not opt into the flowmap sim.
   *
   * That is a supported state, not an error: a page can mount this component
   * without `simTypes={['flowmap']}`, and it must then render the plate
   * undistorted rather than throw or draw black. `uHasFlow` below is what
   * carries that decision into the shader.
   */
  const flowmapRef = useFlowmap('flowmap')

  /*
   * Built once and mutated in place — rebuilding the object would make three
   * re-upload every uniform each frame. Same reasoning as
   * `vault/webgl/scene-shell/scene.tsx`.
   *
   * Typed explicitly rather than inferred: `{ value: null }` infers as
   * `{ value: null }`, which then rejects the texture it exists to hold. And
   * every write below goes through *this* object rather than
   * `material.uniforms`, because three types that as a loose record whose
   * entries are all possibly-undefined — this one is ours, and its keys are
   * known.
   */
  const uniforms = useMemo<MaterialUniforms>(
    () => ({
      uTexture: { value: null },
      uFlow: { value: null },
      uHasFlow: { value: 0 },
      uDisplacement: { value: displacement },
      uDrift: { value: drift },
      uDriftPeriod: { value: driftPeriod },
      uShear: { value: 0 },
      uTime: { value: 0 },
      uResolution: { value: new Vector2(1, 1) },
    }),
    // Intentionally built once; the effects below push prop changes into the
    // existing uniform objects.
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- see comment above
    []
  )

  useEffect(() => {
    const live = uniformsOf(materialRef.current, uniforms)
    live.uDisplacement.value = displacement
    live.uDrift.value = drift
    live.uDriftPeriod.value = driftPeriod
  }, [displacement, drift, driftPeriod, uniforms])

  useEffect(() => {
    uniformsOf(materialRef.current, uniforms).uResolution.value.set(
      size.width,
      size.height
    )
  }, [size.width, size.height, uniforms])

  /*
   * The texture comes from drei's `useTexture` cache, keyed by `src`, and is
   * shared with every other consumer of the same URL. It is therefore NOT
   * owned here and must never be disposed by this component — doing so would
   * corrupt a consumer still reading it. `lib/webgl/components/image/webgl.tsx`
   * documents the same rule, and it is the one place the `ui-ux-pro-max`
   * three.js guidance ("dispose every texture map") is wrong for this codebase.
   *
   * The cleanup below therefore only clears *this* material's reference, so it
   * can never point at a stale or replaced texture.
   */
  useTexture(src, (texture) => {
    texture.magFilter = texture.minFilter = LinearFilter
    texture.generateMipmaps = false
    uniformsOf(materialRef.current, uniforms).uTexture.value = texture
  })

  useEffect(() => {
    // Captured now rather than read in the cleanup: React assigns refs before
    // effects run, and the material instance lives as long as this component,
    // so this is the same object the cleanup would have found.
    const live = uniformsOf(materialRef.current, uniforms)
    return () => {
      live.uTexture.value = null
    }
  }, [src, uniforms])

  /*
   * Geometry and material ARE owned here, and three never frees GPU memory on
   * its own (`CLAUDE.md` #15). R3F disposes the primitives it created for a
   * declarative `<planeGeometry />` / `<shaderMaterial />` on unmount, and
   * this asserts it rather than trusting it: `e2e/material-layer.e2e.ts`
   * counts WebGL objects across repeated mounts rather than trusting it.
   */

  const rectIsValid = isRectValid(rect)
  const active = visible && rectIsValid

  /*
   * Placement is computed here, every frame, rather than through
   * `useWebGLRect`'s callback.
   *
   * That hook recomputes only when a scroll or transform event fires. For a
   * mesh whose page is scrolled by a wheel that is enough; in general it is
   * not. Bring the grid into view with `scrollIntoView` rather than a wheel,
   * resize the window, or let the grid reflow as an image settles, and no
   * event arrives — the mesh then keeps its initial identity matrix, which
   * under an orthographic camera measured in pixels is a **one-pixel plane at
   * the centre of the screen**. Invisible, silent, and indistinguishable from
   * "the material is broken". It cost most of a day here: the plates rendered
   * when a test scrolled one way and vanished when it scrolled another, which
   * read as a headless-Chromium quirk and was not one.
   *
   * Reading the hook's getter more often does not fix it, because the getter
   * returns the last *computed* value and the computation is what is
   * event-driven. So the arithmetic is here. It is the same arithmetic
   * (`lib/webgl/hooks/use-webgl-rect.ts`), minus hamo's page-level transform
   * term — this project mounts no transform wrapper, and folding in a value
   * that is always identity would be borrowed complexity.
   */
  useFrame(({ clock }, delta) => {
    /*
     * Read before the early return, so the reference stays fresh while the
     * plate is off screen. Skipping it there would make the first visible
     * frame difference against a stale offset — a single enormous velocity,
     * which saturates the shear and lands as a lurch at exactly the moment
     * the reader first sees the plate.
     */
    const scroll = window.scrollY
    const previous = lastScroll.current
    lastScroll.current = scroll

    // See `uniformsOf`: the memoised block is not what three renders from.
    const live = uniformsOf(materialRef.current, uniforms)

    if (!active) {
      // Nothing is drawn, so nothing may accumulate. A plate that scrolls
      // back into view arrives at rest.
      shearValue.current = 0
      lastScroll.current = null
      return
    }

    /*
     * The reader's own input — `docs/stages/TAHAP-21.md`.
     *
     * Measured before this existed: a pointer sweep across a plate moved 2.6%
     * of its pixels and scrolling moved 0.00%, because the flowmap listens to
     * the pointer and to nothing else. The material was real and unreachable
     * by the one gesture a portfolio is actually read with.
     *
     * No new listener and no new dependency: this loop already reads
     * `window.scrollY` every frame to place the mesh, so the velocity is a
     * subtraction away. The frame is clamped so a backgrounded tab, a
     * long GC pause, or a `scrollIntoView` cannot resolve to an impulse; the
     * response then saturates at `shearVelocity` rather than growing, so a
     * flick and brisk reading land at the same amplitude.
     *
     * The decay is the frame-rate-independent form used by the cursor in
     * `vault/primitives/cursor`, for the same reason: a fixed per-frame
     * fraction would make the material settle at a different speed on a
     * 120Hz display than on a 60Hz one.
     */
    const seconds = Math.min(delta, MAX_FRAME_SECONDS)
    const velocity =
      previous === null || seconds <= 0 ? 0 : (scroll - previous) / seconds
    const target = Math.max(-1, Math.min(1, velocity / shearVelocity)) * shear
    shearValue.current +=
      (target - shearValue.current) * (1 - Math.exp(-seconds / shearTau))
    live.uShear.value = shearValue.current

    const mesh = meshRef.current
    if (
      mesh &&
      rect.top !== undefined &&
      rect.left !== undefined &&
      rect.width !== undefined &&
      rect.height !== undefined
    ) {
      /*
       * `window.scrollY`, not Lenis's animated `scroll` value.
       *
       * `rect.top` is document-relative, so what turns it into a screen
       * position is where the document *actually* is. Lenis's `scroll` is the
       * eased value it is animating toward, and the two disagree whenever the
       * page was moved by anything Lenis did not drive — a programmatic
       * `scrollIntoView`, an anchor jump with JS disabled, a browser restoring
       * a scroll position. Measured here: the page sat at `scrollY` 660 while
       * the mesh was placed as though it were at 0, which put every plate
       * 660px off screen and rendered the grid as empty boxes.
       *
       * Read once at the top of this callback — the shear differences the
       * same value, and reading `window.scrollY` twice in one frame would be
       * two forced layouts for one number.
       */
      mesh.position.set(
        -size.width / 2 + (rect.left + rect.width / 2),
        size.height / 2 - (rect.top + rect.height / 2) + scroll,
        0
      )
      mesh.scale.set(rect.width, rect.height, 1)
      mesh.updateMatrix()

      /*
       * Everything this mesh needs in order to be visible now holds: it has a
       * texture, a measured rect, and a matrix placing it over that rect. Tell
       * the DOM side once, so it can stop showing the `<img>`.
       *
       * A ref rather than state: this fires inside the frame loop, and a
       * setState here would re-render the scene on the frame it is trying to
       * draw.
       */
      if (!announced.current && live.uTexture.value) {
        announced.current = true
        onFirstFrame()
      }
    }

    live.uTime.value = clock.elapsedTime

    /*
     * Re-read every frame rather than wiring the flowmap's own uniform object
     * in once. `Flowmap` swaps its read/write targets each update and
     * rebuilds itself entirely after a WebGL context restore, so a reference
     * captured at mount goes stale in both cases. A texture-handle assignment
     * is cheap; a stale handle is a black plate.
     */
    const texture = flowmapRef?.current?.uniform.value ?? null
    live.uFlow.value = texture
    live.uHasFlow.value = texture ? 1 : 0
  })

  if (!rectIsValid) return null

  return (
    <mesh ref={meshRef} matrixAutoUpdate={false} visible={visible}>
      <planeGeometry />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  )
}
