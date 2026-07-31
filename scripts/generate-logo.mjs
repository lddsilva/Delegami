/**
 * Regenerates the Delegami brand files into brand/.
 *   npm i --no-save playwright-core && node scripts/generate-logo.mjs
 *
 * The wordmark is Newsreader (SIL OFL, so embedding is permitted). The mark is
 * sized to the measured cap height so it reads as the first letter of the word,
 * not as an icon parked next to it.
 */
import { chromium } from 'playwright-core'
import fs from 'fs'
const OUT = new URL('../brand', import.meta.url).pathname
const FONT = new URL('../public/fonts/Newsreader.woff2', import.meta.url).pathname
const FONT_SRC = `url(data:font/woff2;base64,${fs.readFileSync(FONT).toString('base64')}) format('woff2-variations')`
const PAPER = '#FAF8F4', INK = '#22201D', WINE = '#6B2637', ROSE = '#D9A8B2'

// Tight box — cropped to the ink (x 18→45, y 12→52) so flex gap and baseline
// alignment behave predictably next to type.
const markTight = (bar, seal, h) =>
  `<svg viewBox="18 12 27 40" width="${(h * 27) / 40}" height="${h}" style="display:block"><rect x="18" y="12" width="8" height="40" rx="1" fill="${bar}"/><path d="M29 12a16 20 0 0 1 0 40Z" fill="${seal}"/></svg>`

const base = `@font-face{font-family:NR;src:${FONT_SRC};font-weight:300 700}
*{margin:0;box-sizing:border-box}html,body{width:100%;height:100%}
body{display:flex;align-items:center;justify-content:center;font-family:NR,serif}
.row{display:flex;align-items:baseline;line-height:1}
.wm{letter-spacing:-.012em}`

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] })

// Cap height of Newsreader, measured rather than guessed.
const mp = await b.newPage()
await mp.setContent(`<style>${base}</style>`)
await mp.evaluate(() => document.fonts.ready)
const FONT_SIZE = 150
const { cap, textW } = await mp.evaluate((fs) => {
  const c = document.createElement('canvas').getContext('2d')
  c.font = `${fs}px NR`
  return { cap: c.measureText('D').actualBoundingBoxAscent, textW: c.measureText('Delegami').width }
}, FONT_SIZE)
await mp.close()
console.log('cap height', Math.round(cap), '| wordmark width', Math.round(textW))

const GAP = Math.round(FONT_SIZE * 0.2)
const lockup = (bar, seal, color) =>
  `<div class="row" style="font-size:${FONT_SIZE}px;color:${color};gap:${GAP}px">${markTight(bar, seal, cap)}<span class="wm">Delegami</span></div>`

async function shot(name, { w, h, html, bg, scale = 2 }) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: scale })
  await p.setContent(`<style>${base}body{background:${bg || 'transparent'}}</style>${html}`)
  await p.evaluate(() => document.fonts.ready)
  await p.screenshot({ path: `${OUT}/${name}.png`, omitBackground: !bg })
  await p.close()
  console.log(name, `${w * scale}×${h * scale}`)
}

await shot('delegami-marca', { w: 512, h: 512, html: markTight(INK, WINE, 420) })
await shot('delegami-avatar', { w: 512, h: 512, bg: PAPER, html: markTight(INK, WINE, 250) })
await shot('delegami-logo-orizzontale', { w: 820, h: 240, bg: PAPER, html: lockup(INK, WINE, INK) })
await shot('delegami-logo-scuro', { w: 820, h: 240, bg: INK, html: lockup(PAPER, ROSE, PAPER) })

// Vector lockup, self-contained (Newsreader is OFL, so embedding is permitted).
const markW = (cap * 27) / 40, pad = 46
const W = Math.ceil(pad * 2 + markW + GAP + textW)
const H = Math.ceil(pad * 2 + cap)
const baseY = pad + cap
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Delegami">
<style>@font-face{font-family:'Newsreader';src:${FONT_SRC};font-weight:300 700;}</style>
<g transform="translate(${pad} ${pad}) scale(${cap / 40}) translate(-18 -12)">
<rect x="18" y="12" width="8" height="40" rx="1" fill="${INK}"/>
<path d="M29 12a16 20 0 0 1 0 40Z" fill="${WINE}"/>
</g>
<text x="${pad + markW + GAP}" y="${baseY}" font-family="Newsreader, Georgia, serif" font-size="${FONT_SIZE}" letter-spacing="${-FONT_SIZE * 0.012}" fill="${INK}">Delegami</text>
</svg>`
fs.writeFileSync(`${OUT}/delegami-logo-orizzontale.svg`, svg)
console.log('svg lockup', W + '×' + H)
await b.close()
