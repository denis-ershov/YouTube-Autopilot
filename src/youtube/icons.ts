/**
 * Векторные иконки для UI, внедряемого в страницу YouTube (оверлей плеера, баннер подтверждения).
 * Строятся через createElementNS — без innerHTML (требование Mozilla AMO и CSP).
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

export const BRAND_ACCENT = '#3ea6ff';
const MARKER_COLOR = '#fbbf24';

function svgEl<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string>
): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([name, value]) => el.setAttribute(name, value));
  return el;
}

function createSvg(size: number): SVGSVGElement {
  const svg = svgEl('svg', {
    width: String(size),
    height: String(size),
    viewBox: '0 0 24 24',
    fill: 'none',
    'aria-hidden': 'true',
  });
  svg.style.cssText = 'flex-shrink: 0; display: block;';
  return svg;
}

/**
 * Монохромный знак бренда (упрощённая версия public/icons/icon.svg без фона):
 * кольцо прогресса ~83%, маркер порога и треугольник Play.
 */
export function createBrandMarkSvg(size: number = 15, color: string = BRAND_ACCENT): SVGSVGElement {
  const svg = createSvg(size);
  svg.appendChild(svgEl('circle', { cx: '12', cy: '12', r: '9', stroke: color, 'stroke-opacity': '0.3', 'stroke-width': '2.2' }));
  svg.appendChild(
    svgEl('path', {
      d: 'M12 3A9 9 0 1 1 4.21 7.5',
      stroke: color,
      'stroke-width': '2.2',
      'stroke-linecap': 'round',
    })
  );
  svg.appendChild(svgEl('circle', { cx: '7.5', cy: '4.21', r: '1.3', fill: MARKER_COLOR }));
  svg.appendChild(
    svgEl('path', {
      d: 'M10.4 8.9v6.2L15.4 12z',
      fill: color,
      stroke: color,
      'stroke-width': '1.4',
      'stroke-linejoin': 'round',
    })
  );
  return svg;
}

export function createHeartSvg(size: number = 9, color: string = '#f87171'): SVGSVGElement {
  const svg = createSvg(size);
  svg.appendChild(
    svgEl('path', {
      d: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z',
      fill: color,
      stroke: color,
      'stroke-width': '2',
    })
  );
  return svg;
}
