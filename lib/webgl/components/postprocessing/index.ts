import { useFrame, useThree } from '@react-three/fiber'
import { CopyPass, EffectComposer, RenderPass } from 'postprocessing'
import { useEffect, useRef, useState } from 'react'
import { HalfFloatType } from 'three'

/**
 * Sanctioned starter scaffold: no default consumer wires this up in the repo
 * today, enable it per-canvas via the `postprocessing` prop on WebGLCanvas.
 *
 * ## Tahap 32 tried to ship this, measured it, and did not
 *
 * The approved scaffold's Fase 6 asked for "one pass, subtle". As it stands
 * this composer renders and copies with **no visual change at all**, so it
 * needed an effect to be worth anything. It was given one — a low-amplitude
 * grain, which is the site's own vocabulary — wired on, built, and
 * photographed against the same page without it.
 *
 * It **lifted the whole canvas**. Measured across the two frames: mean
 * absolute difference **55.8/255**, with 93.5% of channels moved. Looking at
 * it said the same thing louder — the artwork's deep rust read as milky
 * apricot, its forest green as mint, its violet as lavender. The composer's
 * `HalfFloatType` buffer takes the render out of the renderer's own output
 * colour handling, and everything came back desaturated and pale. On a site
 * whose subject *is* the artwork, that is not a subtle pass; it is a colour
 * grade nobody asked for.
 *
 * That is fixable — an output pass would restore the encoding, and the grain
 * would come down from 0.06 to something like 0.015. It was not pursued,
 * because of what would be left afterwards: this site already applies grain
 * **twice**, in `vault/webgl/scene-shell/shaders.ts` (where it has a real job
 * — it dithers gradient banding) and composited into the artwork plates
 * themselves by `lib/scripts/seed-fixtures.ts`. A third layer over the
 * composite would sit on top of the work rather than serve it, for +19KB and
 * a full-screen pass every frame.
 *
 * So this stays unused, and the reasoning is here rather than in a commit
 * message, so the next stage that reaches for it starts from the measurement
 * instead of from the scaffold's one line. `docs/stages/TAHAP-32.md` §7 has
 * the numbers and the two frames.
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
