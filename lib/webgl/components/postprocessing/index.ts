import { useFrame, useThree } from '@react-three/fiber'
import { CopyPass, EffectComposer, RenderPass } from 'postprocessing'
import { useEffect, useRef, useState } from 'react'
import { HalfFloatType } from 'three'

/**
 * Sanctioned starter scaffold: no default consumer wires this up in the repo
 * today, enable it per-canvas via the `postprocessing` prop on WebGLCanvas.
 *
 * ## Three stages measured this. The verdict changed at the third.
 *
 * **Tahap 32** gave it a low-amplitude grain and photographed the same page
 * with and without. The composite came back **lifted**: mean absolute
 * difference 55.8/255, the artwork's deep rust reading as milky apricot. The
 * suspicion was the composer's `HalfFloatType` buffer.
 *
 * **Tahap 33** tested that suspicion and it was wrong. The buffer type was
 * removed and the effect replaced with one that is an identity operation on a
 * still page. Measured at rest: **58.7/255**. No better. The conclusion drawn
 * was that the composer's colour management conflicts with the renderer this
 * project configures on purpose, and that a third attempt would have to start
 * from the renderer's colour setup.
 *
 * **Tahap 45 measured that, and the conflict did not reproduce.** Same
 * instrument, same page, same band, at rest, against the same page with no
 * composer:
 *
 * | attempt                                        | difference at rest |
 * | ---------------------------------------------- | ------------------ |
 * | Tahap 32 - grain, `HalfFloatType`              | 55.8/255           |
 * | Tahap 33 - dispersion, default buffer          | 58.7/255           |
 * | **Tahap 45 - this chain, as it stands**        | **0.6/255**        |
 * | Tahap 45 - repeat                              | 0.7/255            |
 * | Tahap 45 - `RenderPass` + identity `EffectPass` | 0.7/255           |
 *
 * **The chain was proved live before any of those numbers were trusted.** An
 * inversion probe as the effect moved **74.1/255 across 92.7% of channels**,
 * so the composer is genuinely drawing the region being measured. Measuring a
 * composer that is not running is the easiest way to be wrong here, and 0.6
 * is exactly what that mistake would look like.
 *
 * **What cannot be claimed.** Neither `postprocessing` nor `three` has been
 * version-bumped since the fork, so the difference is not a dependency
 * upgrade - and the code that produced 55.8 and 58.7 no longer exists to
 * re-measure. So no explanation is offered for the old numbers. The claim is
 * only this, and it is bounded on purpose: **on the configuration standing
 * today, with the chain proved live, the composite is within 0.7/255 of the
 * uncomposed page.**
 *
 * ## Why it is still unused, and what would change that
 *
 * The technical objection is gone; the editorial one is not. This chain is
 * `RenderPass` + `CopyPass` - an identity, which is a full-screen pass every
 * frame for no change. `taste-skill`'s rule that motion must be motivated is
 * not satisfied by "the pipeline turned out to be clean", and after Tahap 43
 * the site's continuous-response vocabulary already carries four mechanisms.
 *
 * No route enables it, so a reader downloads nothing for it. What is missing
 * is an effect worth a full-screen pass, and that is a decision for the
 * studio. `docs/stages/TAHAP-45.md` §2 carries the measurements.
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
