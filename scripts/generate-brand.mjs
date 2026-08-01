/**
 * Regenerates the Delegami brand files into brand/.
 *   npm i --no-save playwright-core && node scripts/generate-brand.mjs
 *
 * The mark is a D whose counter holds a check: the letter says who, the check
 * says what happened to your paperwork. It ships in two cuts — the full mark
 * for 32px and up, and a simplified one (no check) below that, where the check
 * stops resolving. Wordmark is Plus Jakarta Sans 800 (SIL OFL, so the font may
 * be embedded in the vector lockup).
 */
import { chromium } from 'playwright-core'
import fs from 'fs'

const OUT = new URL('../brand', import.meta.url).pathname
const FONT = new URL('../public/fonts/PlusJakartaSans.woff2', import.meta.url).pathname
const FONT_SRC = `url(data:font/woff2;base64,${fs.readFileSync(FONT).toString('base64')}) format('woff2-variations')`
fs.mkdirSync(OUT, { recursive: true })

const NAVY = '#143A56', MINT = '#2ACAAB', OFF = '#F5F7F8', SLATE = '#647786', WHITE = '#FFFFFF'
const OUTER = 'M14 10H34a22 22 0 0 1 0 44H14Z'
const COUNTER = 'M24 20h10a12 12 0 0 1 0 24H24Z'
const CHECK = 'M28.5 32.5 32 36l7.5-8.5'

/** shell = the letter, counter = the bowl fill, tick = the check (null to omit) */
const mark = ({ shell = NAVY, counter = MINT, tick = NAVY, size = 64, box = false }) =>
  `<svg viewBox="0 0 64 64" width="${size}" height="${size}" style="display:block">
${box ? `<rect width="64" height="64" rx="14" fill="${NAVY}"/>` : ''}
<path d="${OUTER}" fill="${shell}"/><path d="${COUNTER}" fill="${counter}"/>${
    tick ? `<path d="${CHECK}" fill="none" stroke="${tick}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>` : ''
  }</svg>`

const base = `@font-face{font-family:PJ;src:${FONT_SRC};font-weight:300 800}
*{margin:0;box-sizing:border-box}html,body{width:100%;height:100%}
body{display:flex;align-items:center;justify-content:center;font-family:PJ,sans-serif}
.lockup{display:flex;align-items:center;gap:.3em}
.wm{font-weight:800;letter-spacing:.005em;line-height:.95;white-space:nowrap}
.rule{height:2px;margin:.11em 0 .1em}
.sub{font-weight:600;white-space:nowrap}`

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] })

// Cap height of Plus Jakarta Sans, measured so the mark matches the wordmark.
const probe = await b.newPage()
await probe.setContent(`<style>${base}</style>`)
await probe.evaluate(() => document.fonts.ready)
const FS = 120
const SUB = 'COLLABORAZIONE AMMINISTRATIVA'
const { cap, wmW, subTrack, subSize } = await probe.evaluate(([fs, sub]) => {
  const c = document.createElement('canvas').getContext('2d')
  c.font = `800 ${fs}px PJ`
  const cap = c.measureText('D').actualBoundingBoxAscent
  const wmW = c.measureText('DELEGAMI').width + fs * 0.005 * 7
  // Justify the sub-line to the wordmark width by solving for letter-spacing —
  // the detail that makes this kind of lockup look drawn rather than typed.
  const subSize = fs * 0.15
  c.font = `600 ${subSize}px PJ`
  const natural = c.measureText(sub).width
  return { cap, wmW, subSize, subTrack: (wmW - natural) / (sub.length - 1) }
}, [FS, SUB])
await probe.close()
console.log('cap', Math.round(cap), 'wordmark', Math.round(wmW))

// The mark's ink is 44 of 64 units tall. Scaled to 1.45× the wordmark cap
// height: matching the cap exactly made the mark read as a second D at the
// start of the word, and the size break is what turns a letter into a logo.
const markSize = ((cap * 1.45) * 64) / 44

const lockup = (opts, color, subColor, ruleColor = MINT) => `<div class="lockup">${mark({ ...opts, size: markSize })}
<div><div class="wm" style="font-size:${FS}px;color:${color}">DELEGAMI</div>
<div class="rule" style="width:${wmW}px;background:${ruleColor}"></div>
<div class="sub" style="color:${subColor};font-size:${subSize}px;letter-spacing:${subTrack}px">${SUB}</div></div></div>`

async function shot(name, { w, h, html, bg, scale = 2 }) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: scale })
  await p.setContent(`<style>${base}body{background:${bg || 'transparent'}}</style>${html}`)
  await p.evaluate(() => document.fonts.ready)
  await p.screenshot({ path: `${OUT}/${name}.png`, omitBackground: !bg })
  await p.close()
  console.log(name, `${w * scale}×${h * scale}`)
}

await shot('delegami-logo', { w: 980, h: 260, bg: OFF, html: lockup({}, NAVY, SLATE) })
await shot('delegami-logo-scuro', { w: 980, h: 260, bg: NAVY, html: lockup({ shell: OFF, tick: NAVY }, OFF, '#9DB0BF') })
await shot('delegami-logo-mono', { w: 980, h: 260, bg: OFF, html: lockup({ counter: WHITE, tick: NAVY }, NAVY, NAVY, NAVY) })
await shot('delegami-marca', { w: 480, h: 480, html: mark({ size: 340 }) })
await shot('delegami-avatar', { w: 480, h: 480, bg: NAVY, html: mark({ shell: OFF, tick: NAVY, size: 300 }) })
await shot('delegami-icona-piccola', { w: 480, h: 480, html: mark({ size: 340, tick: null }) })

// Vector lockup, self-contained.
const pad = 46, gap = FS * 0.3
const W = Math.ceil(pad * 2 + markSize + gap + wmW)
const H = Math.ceil(pad * 2 + Math.max(cap + FS * 0.36, (markSize * 44) / 64))
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Delegami">
<style>@font-face{font-family:'Plus Jakarta Sans';src:${FONT_SRC};font-weight:300 800;}</style>
<g transform="translate(${pad} ${pad + cap * 0.5 + FS * 0.16 - markSize / 2 - (markSize * 10) / 64 + (markSize * 10) / 64}) scale(${markSize / 64})">
<path d="${OUTER}" fill="${NAVY}"/><path d="${COUNTER}" fill="${MINT}"/>
<path d="${CHECK}" fill="none" stroke="${NAVY}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
</g>
<text x="${pad + markSize + gap}" y="${pad + cap}" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="${FS}" letter-spacing="${FS * 0.005}" fill="${NAVY}">DELEGAMI</text>
<rect x="${pad + markSize + gap}" y="${pad + cap + FS * 0.12}" width="${wmW}" height="2" fill="${MINT}"/>
<text x="${pad + markSize + gap}" y="${pad + cap + FS * 0.32}" font-family="'Plus Jakarta Sans', sans-serif" font-weight="600" font-size="${subSize}" letter-spacing="${subTrack}" fill="${SLATE}">${SUB}</text>
</svg>`
fs.writeFileSync(`${OUT}/delegami-logo.svg`, svg)
console.log('delegami-logo.svg', W + '×' + H)
await b.close()
