import { useFrame, useThree } from '@react-three/fiber'
import { CopyPass, EffectComposer, RenderPass } from 'postprocessing'
import { useEffect, useRef, useState } from 'react'
import { HalfFloatType } from 'three'

/**
 * Sanctioned starter scaffold: no default consumer wires this up in the repo
 * today, enable it per-canvas via the `postprocessing` prop on WebGLCanvas.
 *
 * ## Two stages tried to ship this. Both measured, both stood down.
 *
 * **Tahap 32** gave it a low-amplitude grain — this site's own vocabulary —
 * and photographed the same page with and without. The composite came back
 * **lifted**: mean absolute difference 55.8/255, 93.5% of channels moved, the
 * artwork's deep rust reading as milky apricot. The suspicion was the
 * composer's `HalfFloatType` buffer taking the render out of the renderer's
 * colour handling.
 *
 * **Tahap 33** tested that suspicion and it was wrong. The buffer type was
 * removed and the effect replaced with something that is an identity
 * operation on a still page — a dispersion driven by scroll velocity, which
 * at rest offsets the channels by exactly zero. Measured at rest against the
 * same page without a composer: **58.7/255**. No better. The lift is not the
 * effect and not the buffer; it is the composer's own colour management
 * meeting a renderer this project configured on purpose.
 *
 * That configuration is not incidental. `lib/webgl/components/canvas/webgl.tsx`
 * sets `flat` and leaves `outputColorSpace` at sRGB, and both were arrived at
 * by measurement — `docs/stages/TAHAP-17.md` §4 records a bug where every
 * custom-shaded colour landed as `authored ^ 2.2` because the conversion was
 * disabled at one end only. Making the composer agree means reopening those
 * decisions, and an ambient effect is not worth putting the site's colour
 * pipeline back in play.
 *
 * So: still unused, and now for a reason that names the actual conflict
 * rather than the first plausible cause. `docs/stages/TAHAP-33.md` §8.3 has
 * both measurements. What a third attempt would have to start from is the
 * renderer's colour setup, not the effect.
 */
export function PostProcessing() {
  const gl = useThree((state) => state.gl)
  const viewport = useThree((state) => state.viewport)
  const camera = useThree((state) => state.camera)
  const scene = useThree((state) => state.scene)
  const setDpr = useThree((state) => state.setDpr)
  const size = useThree((state) => state.size)

  const isWebgl2 = gl.capabilities.isWebGL2
  const dpr = viewport.dpr
  const maxSamples = gl.capabilities.maxSamples
  const needsAA = dpr < 2

  const [composer] = useState(
    () =>
      new EffectComposer(gl, {
        multisampling: isWebgl2 && needsAA ? maxSamples : 0,
        frameBufferType: HalfFloatType,
      })
  )

  const renderPassRef = useRef<RenderPass | null>(null)
  const copyPassRef = useRef<CopyPass | null>(null)

  useEffect(() => {
    const renderPass = new RenderPass(scene, camera)
    const copyPass = new CopyPass()
    renderPassRef.current = renderPass
    copyPassRef.current = copyPass

    composer.addPass(renderPass)
    composer.addPass(copyPass)

    return () => {
      composer.removePass(renderPass)
      composer.removePass(copyPass)
      renderPass.dispose()
      copyPass.dispose()
    }
  }, [composer, scene, camera])

  useEffect(() => {
    return () => {
      composer.dispose()
    }
  }, [composer])

  useEffect(() => {
    const initialDpr = Math.min(window.devicePixelRatio, 2)

    const dpr = size.width <= 2048 ? initialDpr : 1
    setDpr(dpr)

    composer.setSize(size.width, size.height)
    // Recompute MSAA sample count for the new dpr — `needsAA`/`maxSamples`
    // were only read once, in the useState initializer above, so a resize
    // that changes dpr (e.g. moving the window to another display) never
    // updated the composer's actual sample count.
    // react-doctor-disable-next-line react-hooks-js/immutability
    composer.multisampling = isWebgl2 && dpr < 2 ? maxSamples : 0 // oxlint-disable-line react/immutability -- imperative GPU work on a state-held composer whose identity never changes
  }, [composer, size, setDpr, isWebgl2, maxSamples])

  useFrame((_, deltaTime) => {
    composer.render(deltaTime)
  }, Number.POSITIVE_INFINITY)

  return null
}
