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
  visible,
  onFirstFrame,
}: MaterialImageSceneProps) {
  const meshRef = useRef<Mesh>(null)
  const size = useThree((state) => state.size)
  const announced = useRef(false)

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
      uTime: { value: 0 },
      uResolution: { value: new Vector2(1, 1) },
    }),
    // Intentionally built once; the effects below push prop changes into the
    // existing uniform objects.
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- see comment above
    []
  )

  useEffect(() => {
    uniforms.uDisplacement.value = displacement
    uniforms.uDrift.value = drift
    uniforms.uDriftPeriod.value = driftPeriod
  }, [displacement, drift, driftPeriod, uniforms])

  useEffect(() => {
    uniforms.uResolution.value.set(size.width, size.height)
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
    uniforms.uTexture.value = texture
  })

  useEffect(() => {
    return () => {
      uniforms.uTexture.value = null
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
  useFrame(({ clock }) => {
    if (!active) return

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
       */
      const scroll = window.scrollY
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
      if (!announced.current && uniforms.uTexture.value) {
        announced.current = true
        onFirstFrame()
      }
    }

    uniforms.uTime.value = clock.elapsedTime

    /*
     * Re-read every frame rather than wiring the flowmap's own uniform object
     * in once. `Flowmap` swaps its read/write targets each update and
     * rebuilds itself entirely after a WebGL context restore, so a reference
     * captured at mount goes stale in both cases. A texture-handle assignment
     * is cheap; a stale handle is a black plate.
     */
    const texture = flowmapRef?.current?.uniform.value ?? null
    uniforms.uFlow.value = texture
    uniforms.uHasFlow.value = texture ? 1 : 0
  })

  if (!rectIsValid) return null

  return (
    <mesh ref={meshRef} matrixAutoUpdate={false} visible={visible}>
      <planeGeometry />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  )
}
