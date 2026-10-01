/**
 * A static server for `storybook-static/`, shared by the gates that need it.
 *
 * ## Why this is its own file
 *
 * It began inside `storybook-a11y.e2e.ts`, which was the only gate that
 * rendered a story. Tahap 70 added a second — `gallery-run.e2e.ts`, which
 * exercises the gallery's horizontal run against the catalogue because the
 * seeded dataset cannot reach that branch — and a second copy of a path-
 * traversal-checking file server is not a thing to have two of.
 *
 * Nothing about the behaviour changed in the move. The traversal guard, the
 * content types and the ephemeral port are the same code the a11y gate has
 * run since Tahap 34.
 *
 * ## Why serve at all rather than use `file://`
 *
 * Storybook's iframe loads its own bundles by absolute path, and `file://`
 * gives them a null origin — modules fail to load and every story renders
 * blank. A blank page passes most assertions, which is the failure mode this
 * project keeps finding: a gate that measures nothing reports no problem.
 */

import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import { extname, join, normalize } from 'node:path'

import { z } from 'zod'

export const STORYBOOK_ROOT = join(
  import.meta.dirname,
  '..',
  'storybook-static'
)

const INDEX = join(STORYBOOK_ROOT, 'index.json')

/*
 * A Map rather than an object literal: the lookup key is an arbitrary file
 * extension, which an object literal cannot be indexed by without either a
 * widening annotation or a cast.
 */
const CONTENT_TYPES = new Map<string, string>([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.woff2', 'font/woff2'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
])

/*
 * Storybook's own index format, parsed rather than asserted.
 *
 * It is a build artefact of another tool, so it is an I/O boundary: a
 * Storybook upgrade that reshapes it should surface as an empty story list and
 * a skipped gate, not as a runtime error halfway through the suite.
 */
const entrySchema = z
  .object({
    id: z.string(),
    title: z.string().optional(),
    name: z.string().optional(),
    type: z.string().optional(),
  })
  .passthrough()

const indexSchema = z.object({
  entries: z.record(z.string(), entrySchema),
})

export interface StoryEntry {
  id: string
  title: string
  name: string
}

/** Every story in the built catalogue, or `[]` when it has not been built. */
export function readStories(): StoryEntry[] {
  if (!existsSync(INDEX)) return []

  const parsed = indexSchema.safeParse(JSON.parse(readFileSync(INDEX, 'utf8')))
  if (!parsed.success) return []

  return Object.values(parsed.data.entries).flatMap((entry) => {
    // `docs` entries render an MDX page, not the component; only stories.
    if (entry.type !== undefined && entry.type !== 'story') return []
    return [
      {
        id: entry.id,
        title: entry.title ?? entry.id,
        name: entry.name ?? entry.id,
      },
    ]
  })
}

/** The URL that renders one story on its own, with no Storybook chrome. */
export function storyUrl(origin: string, id: string): string {
  return `${origin}/iframe.html?id=${encodeURIComponent(id)}&viewMode=story`
}

export function serveStorybook(): Promise<{ server: Server; origin: string }> {
  const server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost')
    /*
     * `normalize` collapses `..`, and the prefix check rejects anything that
     * still escapes the build directory. This server only ever runs locally
     * for the length of one test file, but a path traversal is a path
     * traversal.
     */
    const requested = normalize(
      join(STORYBOOK_ROOT, decodeURIComponent(url.pathname))
    )
    if (!requested.startsWith(STORYBOOK_ROOT)) {
      res.writeHead(403).end()
      return
    }

    const file =
      existsSync(requested) && statSync(requested).isDirectory()
        ? join(requested, 'index.html')
        : requested

    if (!existsSync(file)) {
      res.writeHead(404).end()
      return
    }

    res.writeHead(200, {
      'content-type':
        CONTENT_TYPES.get(extname(file)) ?? 'application/octet-stream',
    })
    createReadStream(file).pipe(res)
  })

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      const port = typeof address === 'object' && address ? address.port : 0
      resolve({ server, origin: `http://127.0.0.1:${port}` })
    })
  })
}
