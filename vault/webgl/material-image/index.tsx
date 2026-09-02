'use client'

/**
 * MaterialImage — a plate that behaves like a surface instead of a picture.
 *
 * Provenance: original work for this project. No third-party code copied.
 * Uses `lib/webgl`'s existing canvas, tunnel and flowmap system (MIT,
 * darkroom.engineering) rather than mounting anything of its own.
 *
 * ## Why this exists
 *
 * `docs/stages/TAHAP-14.md` §1 measured melius.com and found that the single
 * largest perceptual difference between it and this site was not technique —
 * it ships no three.js at all — but that its imagery *moves*: six looping
 * clips against our ten static plates. Motion inside the content beats motion
 * in the chrome.
 *
 * We have no video, and inventing some would mean inventing work this studio
 * has not done. So the plates we do have are given a surface: a pointer
 * velocity field warps their UVs, and a very slow drift keeps them from being
 * frozen. `lib/webgl/utils/flowmaps/` had been built, documented, and had
 * **zero consumers** — this is its first.
 *
 * ## The four rules this component exists to demonstrate
 *
 * They are the same four `vault/webgl/scene-shell` demonstrates, and they are
 * the reason this file is longer than the effect it produces:
 *
 * 1. **Portal into the shared canvas** with `<WebGLTunnel>`. Never a second
 *    `<Canvas>`; two would race to claim primary (`lib/webgl/store.ts`).
 * 2. **Always render the non-WebGL path**, and here it needs no argument
 *    about looking intentional: it *is* the product today. A plate with no
 *    material is the plate that shipped in Tahap 12a.
 * 3. **Fetch the engine only once the client has decided to show it.** The
 *    `import()` below sits inside an effect, not at module scope. That
 *    distinction is worth 245.6 KB gzip on `/en` and is held by
 *    `e2e/webgl-budget.e2e.ts`.
 * 4. **Hand the pixels back before a navigation.** See below.
 *
 * ## Why `released` is not an optimisation
 *
 * The card this renders inside participates in a `<ViewTransition>` morph to
 * the project page (Tahap 11d). A view transition photographs real DOM. While
 * the mesh is drawing, the DOM `<img>` is at `opacity: 0` — so a morph that
 * started in that state would photograph an empty box and the whole
 * choreographed moment would silently become a cross-fade of nothing.
 *
 * The fix is not a special case; it is the grammar this project already
 * wrote. `docs/MOTION-SPEC.md` §9:
 *
 * ```
 * REST ─▶ INTENT ─▶ COMMIT ─▶ TRANSPORT ─▶ SETTLE ─▶ REST′
 * ```
 *
 * The material lives in REST and INTENT. At COMMIT it stands down and gives
 * the surface back to the DOM, so TRANSPORT morphs real pixels. One more noun
 * speaking the same sentence.
 *
 * @example
 * ```tsx
 * <MaterialImage
 *   image={cover}
 *   alt={coverAlt}
 *   maxWidth={704}
 *   sizes="(max-width: 800px) 100vw, 48vw"
 *   released={pressed}
 * />
 * ```
 */

import cn from 'clsx'
import { type ComponentType, useCallback, useEffect, useState } from 'react'

import { SanityImage } from '@/components/ui/sanity-image'
import { useDeviceDetection } from '@/lib/hooks/use-device-detection'
import { usePreferredReducedMotion } from '@/lib/hooks/use-sync-external'
import type { ImageSource } from '@/lib/integrations/sanity/utils/image'
import { material } from '@/vault/motion/tokens'
import { WebGLTunnel } from '@/webgl/components/tunnel'
import { useWebGLElement } from '@/webgl/hooks/use-webgl-element'

import type { MaterialImageScene as MaterialImageSceneType } from './scene'

import s from './material-image.module.css'

interface MaterialImageProps {
  /** The cover, narrowed by `toImageSource` — same value `SanityImage` takes. */
  image: ImageSource
  alt: string
  /** Caps the pixels requested from Sanity. See `components/ui/sanity-image`. */
  maxWidth?: number | undefined
  sizes?: string | undefined
  /** Preload above-the-fold plates only. */
  preload?: boolean | undefined
  /**
   * Stand the material down and return the DOM image to full opacity.
   *
   * Raised by the pressable noun that owns this plate, at COMMIT — see the
   * note above. Not an optimisation: without it the `<ViewTransition>` morph
   * photographs an empty box.
   */
  released?: boolean | undefined
  /**
   * Applied to the `<img>`, not to the wrapper.
   *
   * The consumer's class is what carries `object-fit` and the INTENT scale
   * (see `vault/blocks/project-card`), and both of those only mean anything
   * on the image element itself. The wrapper's own class is fixed, because
   * the wrapper exists to be measured — `useWebGLElement` reads its box to
   * place the mesh — and a caller restyling it would move the mesh.
   */
  className?: string | undefined
  /**
   * Grammar marker, forwarded to the `<img>`.
   *
   * `MOTION-SPEC.md` §9 marks the element that actually acknowledges hover,
   * and `e2e/interaction-grammar.e2e.ts` reads it. It cannot be inferred: on
   * a card the acknowledging element is the image, on other nouns it is the
   * control itself.
   */
  'data-intent'?: string | undefined
}

/**
 * Fetches the R3F scene only once this component has decided to show it.
 *
 * Identical in shape to `vault/webgl/scene-shell`'s `useGradientScene`, and
 * for the identical reason: a static `import('./scene')` puts three.js and
 * @react-three/fiber into this page's client graph, where Next emits them as
 * a parser-initiated `<script async>` — downloaded by phones and by
 * `prefers-reduced-motion` visitors, both of whom then render the plain plate
 * and never see a mesh. The `import type` above is erased at build time and
 * creates no runtime reference.
 */
function useMaterialScene(
  enabled: boolean
): ComponentType<React.ComponentProps<typeof MaterialImageSceneType>> | null {
  const [Scene, setScene] = useState<ComponentType<
    React.ComponentProps<typeof MaterialImageSceneType>
  > | null>(null)

  useEffect(() => {
    if (!enabled || Scene) return

    let cancelled = false
    import('./scene')
      .then(({ MaterialImageScene }) => {
        // Thunk: `setState` calls a bare function argument as an updater.
        if (!cancelled) setScene(() => MaterialImageScene)
      })
      .catch(() => {
        // Degrade to the plain plate, which is the same design. A failed
        // chunk must never leave an empty box where a work was.
      })

    return () => {
      cancelled = true
    }
  }, [enabled, Scene])

  return Scene
}

export function MaterialImage({
  image,
  alt,
  maxWidth,
  sizes,
  preload = false,
  released = false,
  className,
  'data-intent': dataIntent,
}: MaterialImageProps) {
  const [src, setSrc] = useState<string>()
  /*
   * Set by the scene the first time it could actually have drawn.
   *
   * This is the whole reason the empty-box failure cannot recur. The shell
   * used to hide the `<img>` as soon as the chunk and the texture existed —
   * an assumption that the mesh was therefore visible. It was wrong twice in
   * one stage (a background quad occluding it, and a placement bug putting it
   * off screen), and each time the page showed four blank rectangles with a
   * green build and green gates.
   *
   * Waiting for the mesh to say so turns "the material is broken" from a
   * silent visual defect into a no-op: the plate simply stays the plain
   * image, which is the fallback the component already promises.
   */
  const [drew, setDrew] = useState(false)
  const { setRef, rect, isVisible } = useWebGLElement<HTMLDivElement>()
  const { isWebGL } = useDeviceDetection()
  const prefersReducedMotion = usePreferredReducedMotion()

  // Mirrors the condition inside `<Canvas>`: when the canvas will not mount,
  // this must render the plain plate rather than hide it behind nothing.
  const canRenderWebGL = isWebGL === true && !prefersReducedMotion
  const Scene = useMaterialScene(canRenderWebGL)

  // Stable, and idempotent on the scene's side too (it announces once).
  const handleFirstFrame = useCallback(() => setDrew(true), [])

  /*
   * Every condition that must hold before the DOM image may be hidden — and
   * `drew` is the one that makes the list sufficient rather than hopeful.
   */
  const meshActive = canRenderWebGL && Boolean(Scene) && drew && !released

  return (
    <div
      ref={setRef}
      className={s.root}
      /*
       * Two attributes, because identity and state are different questions.
       *
       * `data-material-shell` is always present: it says "this plate can
       * carry a material", and it is what a test or a stylesheet addresses.
       * `data-material` is the live state, and it is *removed* the moment the
       * mesh stands down.
       *
       * They were one attribute at first, and that made the handoff gate
       * untestable in a way that read as a product bug: asserting on
       * `[data-material]` meant the selector stopped matching exactly when
       * the behaviour under test started working, so `.first()` silently
       * re-resolved to a different card that was still at opacity 0 — a red
       * gate pointing at the wrong thing. `docs/stages/TAHAP-14.md` §11.3.
       */
      data-material-shell=""
      data-material={meshActive ? '' : undefined}
    >
      {canRenderWebGL && Scene && src && (
        <WebGLTunnel>
          {/* oxlint-disable-next-line react/static-components -- not created
              during render: the module's own export, fetched once and held in
              state, so its identity is stable. Holding it is what keeps
              three.js out of the initial graph. */}
          <Scene
            src={src}
            rect={rect}
            displacement={material.displacement}
            drift={material.drift}
            driftPeriod={material.driftPeriod}
            visible={isVisible}
            onFirstFrame={handleFirstFrame}
          />
        </WebGLTunnel>
      )}
      <SanityImage
        image={image}
        alt={alt}
        className={cn(s.image, className)}
        preload={preload}
        {...(dataIntent !== undefined && { 'data-intent': dataIntent })}
        {...(maxWidth !== undefined && { maxWidth })}
        {...(sizes !== undefined && { sizes })}
        onLoad={(event: React.SyntheticEvent<HTMLImageElement>) => {
          // `currentSrc`, not `src`: this is the candidate the browser
          // actually chose out of the srcset, which is the one already decoded
          // and in cache. Using `src` would make the GPU fetch a second,
          // different file.
          setSrc(event.currentTarget.currentSrc)
        }}
      />
    </div>
  )
}
