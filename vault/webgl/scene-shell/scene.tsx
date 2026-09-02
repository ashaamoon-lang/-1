'use client'

/**
 * GradientScene — the R3F side of the scene shell.
 *
 * Provenance: original work for this project. No third-party code copied.
 * Written against the public APIs of @react-three/fiber and three.
 *
 * Rendered *inside* the canvas — reached via `<WebGLTunnel>`, never mounted
 * directly. See `index.tsx` for the DOM-side entry point.
 */

import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { Color, type ShaderMaterial } from 'three'

import { fragmentShader, vertexShader } from './shaders'

interface GradientSceneProps {
  colorA: string
  colorB: string
  grain: number
  /**
   * When false, the shader clock stops advancing. Used for reduced motion and
   * for pausing off-screen work.
   */
  animate: boolean
}

export function GradientScene({
  colorA,
  colorB,
  grain,
  animate,
}: GradientSceneProps) {
  const materialRef = useRef<ShaderMaterial>(null)
  const viewport = useThree((state) => state.viewport)

  // Uniforms are created once and mutated in place. Rebuilding this object on
  // every render would force three to re-upload every uniform each frame.
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColorA: { value: new Color(colorA) },
      uColorB: { value: new Color(colorB) },
      uGrain: { value: grain },
    }),
    // Intentionally built once: subsequent prop changes are applied by the
    // effects below, which mutate the existing uniform objects.
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- see comment above
    []
  )

  // Push prop changes into the existing uniform objects rather than recreating
  // them. `Color.set` parses the same strings the DOM side accepts.
  useEffect(() => {
    uniforms.uColorA.value.set(colorA)
    uniforms.uColorB.value.set(colorB)
    uniforms.uGrain.value = grain
  }, [colorA, colorB, grain, uniforms])

  useFrame((_, delta) => {
    if (!animate) return
    const material = materialRef.current
    if (!material) return
    // `uniforms` is indexed as a loose record by three's types, so the entry
    // is optional as far as TS is concerned even though we authored it above.
    const time = material.uniforms.uTime
    if (!time) return
    // Accumulate delta rather than reading absolute clock time: pausing and
    // resuming then continues from where it stopped instead of jumping.
    time.value += delta
  })

  // Three disposes geometries and materials created via JSX when the element
  // unmounts, but only for objects it owns. The Color instances above are
  // plain JS and are garbage-collected normally. Nothing here allocates a GPU
  // texture, so there is no manual dispose to do — stated explicitly because
  // "did you dispose?" is the first question any R3F review should ask.
  /*
   * `renderOrder={-1}` and `depthWrite={false}` are what make this a
   * *background* rather than merely the first thing drawn.
   *
   * This mesh is scaled to the whole viewport and sits at z = 0 — the same
   * depth every DOM-anchored content mesh occupies, because `useWebGLRect`
   * and `vault/webgl/material-image` both place their meshes at z = 0. With
   * this quad writing depth across the entire screen, whichever of the two
   * drew first won, and the plates lost: the home page's covers rendered as
   * empty boxes with no error anywhere.
   *
   * Writing no depth means anything drawn afterwards passes the test against
   * the cleared buffer, which is the correct behaviour for a background: it
   * is a ground for the scene, not an occluder in it.
   *
   * This was briefly reverted during Tahap 14 on the evidence of an A/B that
   * showed no difference. The A/B was run while a second, independent defect
   * (`vault/webgl/material-image/scene.tsx` was reading Lenis' eased scroll
   * instead of the real one) blanked the plates either way, so it could not
   * have shown a difference. Two bugs, each hiding the other's fix —
   * `docs/stages/TAHAP-14.md` §11.5.
   */
  return (
    <mesh scale={[viewport.width, viewport.height, 1]} renderOrder={-1}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        depthWrite={false}
      />
    </mesh>
  )
}
