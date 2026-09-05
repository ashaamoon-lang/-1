import type { Config } from '../config'
import { fluidCalc, formatObject } from './utils'

export function generateRoot({
  breakpoints,
  customSizes,
  layout,
  screens,
}: Pick<Config, 'breakpoints' | 'customSizes' | 'layout' | 'screens'>) {
  return `@custom-media --hover (hover: hover);
@custom-media --mobile (width <= ${breakpoints.dt - 0.02}px);
@custom-media --desktop (width >= ${breakpoints.dt}px);
@custom-media --reduced-motion (prefers-reduced-motion: reduce);

:root {
	--device-width: ${screens.mobile.width};
	--device-height: ${screens.mobile.height};

	/*
	 * One declaration per token, not one per breakpoint.
	 *
	 * These were emitted twice — once here against a 375 device width and once
	 * inside \`@variant dt\` against 1440 — and the two branches met nowhere.
	 * Crossing 800px the gutter fell 34.1px to 8.9px. \`fluidCalc\` draws a
	 * single clamped line through both design anchors instead, so there is no
	 * second declaration to disagree with the first. See \`./utils.ts\`.
	 */
	${formatObject(layout, ([name, { mobile, desktop }]) => {
    if (name === 'columns') return `--columns: ${mobile};`

    return `--${name}: ${fluidCalc(mobile, desktop, screens.mobile.width, screens.desktop.width)};`
  })}

	${formatObject(customSizes, ([name, { mobile, desktop }]) => `--${name}: ${fluidCalc(mobile, desktop, screens.mobile.width, screens.desktop.width)};`)}

	--layout-width: calc(100vw - (2 * var(--safe)));
	--column-width: calc((var(--layout-width) - (var(--columns) - 1) * var(--gap)) / var(--columns));

	@variant dt {
    /*
     * \`--columns\` is the one thing that still switches at the breakpoint,
     * and it should: 4 columns and 12 columns are different grids, not two
     * sizes of one. \`--column-width\` therefore still steps here, which is
     * why \`e2e/scale-continuity.e2e.ts\` does not measure it.
     *
     * \`--device-width\` stays because \`generate-scale.ts\` still resolves the
     * \`dr-*\` numeric utilities against it.
     */
    --device-width: ${screens.desktop.width};
    --device-height: ${screens.desktop.height};

    ${formatObject(
      layout,
      ([name, { desktop }]) => {
        if (name === 'columns') return `--columns: ${desktop};`
        return ''
      },
      '\n\t\t'
    )
      .split('\n\t\t')
      .filter((line) => line.trim() !== '')
      .join('\n\t\t')}
	}
}
  `
}
