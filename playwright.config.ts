import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: 'list',
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  /*
   * Two viewports, and the second one is not optional coverage.
   *
   * For its first six stages this suite rendered one size, 1280x720. A studio
   * that takes commissions gets most of its traffic from a phone, so the
   * verification layer never saw what most visitors see — and an entire class
   * of defect was structurally invisible. `docs/AUDIT-2026-08.md` §1.1 is the
   * one that surfaced: the Indonesian headline was clipped at every width
   * <= 768px, in both the copy and the screenshots, with every gate green.
   *
   * Mobile runs a subset on purpose. `storybook-a11y.e2e.ts` is ~100 story
   * tests whose components are already swept at desktop; doubling them buys
   * runtime, not signal. What does belong here is anything that renders a
   * real page: the route sweep (which carries axe), the project detail
   * pages, and the responsive assertions themselves.
   */
  projects: [
    {
      name: 'desktop',
      use: {
        browserName: 'chromium',
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'mobile',
      testMatch: [
        '**/route-sweep.e2e.ts',
        '**/responsive.e2e.ts',
        '**/project-detail.e2e.ts',
        '**/image-resolution.e2e.ts',
        '**/webgl-budget.e2e.ts',
      ],
      use: {
        browserName: 'chromium',
        // iPhone 13 metrics. Not Safari and not phone CPU — this is a
        // viewport, a pixel ratio, and touch, which is what layout and hit
        // targets actually depend on.
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        hasTouch: true,
        isMobile: true,
      },
    },
  ],
  webServer: {
    // Dev server never exercises prod-only next.config.ts flags (e.g.
    // cacheComponents), so CI runs against a real production build.
    command: process.env.CI ? 'bun run build && bun run start' : 'bun run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: process.env.CI ? 300_000 : 120_000,
  },
})
