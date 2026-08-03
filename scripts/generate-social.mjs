/**
 * Renders the twenty planned Instagram posts to 1080×1080 PNGs.
 *   npm i --no-save playwright-core && node scripts/generate-social.mjs
 *
 * Five layouts, not twenty one-off designs: a feed reads as a brand only when
 * the same few shapes repeat. Colour carries the pillar — navy for the hard
 * truths, light for questions and objections, mint for the two calls to action.
 */
import { chromium } from 'playwright-core'
import fs from 'fs'
import { POSTS, HASHTAGS } from '../brand/social/posts.mjs'

const OUT = new URL('../brand/social', import.meta.url).pathname
const FONT = new URL('../public/fonts/PlusJakartaSans.woff2', import.meta.url).pathname
const FONT_SRC = `url(data:font/woff2;base64,${fs.readFileSync(FONT).toString('base64')}) format('woff2-variations')`

const NAVY = '#143A56', NAVY_DEEP = '#0E2A3F', MINT = '#2ACAAB', OFF = '#F5F7F8', SLATE = '#647786'

const markSvg = (shell, seal, tick, s) =>
  `<svg viewBox="0 0 64 64" width="${s}" height="${s}" style="display:block"><path d="M14 10H34a22 22 0 0 1 0 44H14Z" fill="${shell}"/><path d="M24 20h10a12 12 0 0 1 0 24H24Z" fill="${seal}"/><path d="M28.5 32.5 32 36l7.5-8.5" fill="none" stroke="${tick}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`

/** Wraps the accent phrase in mint without breaking the author's line breaks. */
function withAccent(headline, accent, accentColor) {
  const html = headline.replace(/\n/g, '<br>')
  if (!accent) return html
  const a = accent.replace(/\n/g, '<br>')
  return html.replace(a, `<span style="color:${accentColor}">${a}</span>`)
}

const CSS = `
@font-face{font-family:PJ;src:${FONT_SRC};font-weight:300 800}
*{margin:0;box-sizing:border-box}
body{width:1080px;height:1080px;font-family:PJ,sans-serif;overflow:hidden;position:relative;
     display:flex;flex-direction:column;justify-content:space-between;padding:84px}
.glow{position:absolute;border-radius:50%;filter:blur(90px);opacity:.16}
.top{display:flex;align-items:center;gap:18px;position:relative;z-index:2}
.wm{font-weight:800;font-size:34px;letter-spacing:.02em}
.mid{position:relative;z-index:2}
h1{font-weight:800;letter-spacing:-.032em;line-height:1.02}
.sub{font-size:32px;line-height:1.42;margin-top:34px;max-width:24ch}
.foot{display:flex;align-items:center;justify-content:space-between;font-size:24px;font-weight:600;position:relative;z-index:2}
.pill{padding:14px 30px;border-radius:999px;font-weight:800;font-size:25px}
.stat{font-weight:800;letter-spacing:-.045em;line-height:.92;font-variant-numeric:tabular-nums}
.statlabel{font-size:34px;font-weight:700;margin-top:20px}
ul{list-style:none;margin-top:48px;display:flex;flex-direction:column;gap:26px}
li{display:flex;gap:22px;align-items:flex-start;font-size:31px;line-height:1.34}
.bullet{flex:0 0 auto;width:42px;height:42px;border-radius:50%;display:flex;align-items:center;
        justify-content:center;font-size:24px;font-weight:800;margin-top:2px}
`

function render(post) {
  const L = post.layout
  const isDark = L === 'navy' || L === 'stat'
  const bg = L === 'mint' ? MINT : L === 'light' || L === 'list' ? OFF : NAVY
  const ink = isDark ? '#FFFFFF' : NAVY
  const accentColor = isDark ? MINT : L === 'mint' ? NAVY_DEEP : '#1FA98D'
  const subColor = isDark ? 'rgba(255,255,255,.72)' : L === 'mint' ? 'rgba(14,42,63,.78)' : SLATE
  const footColor = isDark ? 'rgba(255,255,255,.5)' : L === 'mint' ? 'rgba(14,42,63,.6)' : SLATE
  const mark = L === 'mint'
    ? markSvg(NAVY, '#FFFFFF', NAVY, 52)
    : isDark ? markSvg(OFF, MINT, NAVY, 52) : markSvg(NAVY, MINT, NAVY, 52)

  const glow = isDark
    ? `<div class="glow" style="top:-260px;right:-200px;width:760px;height:760px;background:${MINT}"></div>`
    : ''

  let mid = ''
  if (L === 'stat') {
    mid = `<div class="mid">
      <div class="stat" style="font-size:${post.stat.length > 9 ? 132 : 176}px;color:${MINT}">${post.stat}</div>
      <div class="statlabel" style="color:#FFFFFF">${post.statLabel}</div>
      ${post.sub ? `<p class="sub" style="color:${subColor}">${post.sub}</p>` : ''}
    </div>`
  } else if (L === 'list') {
    mid = `<div class="mid">
      <h1 style="font-size:76px;color:${ink}">${withAccent(post.headline, post.accent, accentColor)}</h1>
      <ul>${post.items.map((t) => {
        // A tick beside a list of things we do NOT do reads as the opposite of
        // what it means. The exclusions get a cross, in a muted chip.
        const cross = post.bullet === 'cross'
        return `<li><span class="bullet" style="background:${cross ? '#E2E9EE' : MINT};color:${cross ? SLATE : NAVY}">${cross ? '×' : '✓'}</span><span style="color:${cross ? SLATE : NAVY}">${t}</span></li>`
      }).join('')}</ul>
    </div>`
  } else {
    const size = post.headline.length > 58 ? 78 : post.headline.length > 40 ? 90 : 104
    mid = `<div class="mid">
      <h1 style="font-size:${size}px;color:${ink}">${withAccent(post.headline, post.accent, accentColor)}</h1>
      ${post.sub ? `<p class="sub" style="color:${subColor}">${post.sub}</p>` : ''}
    </div>`
  }

  const cta = post.pillar === 'cta'
    ? `<span class="pill" style="background:${L === 'mint' ? NAVY : MINT};color:${L === 'mint' ? '#FFFFFF' : NAVY}">Scrivici su WhatsApp</span>`
    : `<span style="color:${footColor}">delegami.ch</span>`

  return `<style>${CSS}body{background:${bg}}</style>
    ${glow}
    <div class="top">${mark}<span class="wm" style="color:${ink}">DELEGAMI</span></div>
    ${mid}
    <div class="foot"><span style="color:${footColor}">Cantone Ticino</span>${cta}</div>`
}

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] })
const page = await b.newPage({ viewport: { width: 1080, height: 1080 } })
for (const post of POSTS) {
  await page.setContent(render(post))
  await page.evaluate(() => document.fonts.ready)
  const file = `${OUT}/post-${String(post.n).padStart(2, '0')}-${post.pillar}.png`
  await page.screenshot({ path: file })
  console.log('✓', file.split('/').pop())
}
await b.close()

// The captions belong next to the images, ready to paste.
const md = [
  '# Delegami — 20 post pianificati per Instagram',
  '',
  'Generati da `brand/social/posts.mjs`. Le immagini stanno in questa cartella.',
  'Per rigenerarle: `npm i --no-save playwright-core && node scripts/generate-social.mjs`',
  '',
  '## Calendario suggerito',
  '',
  'Tre post a settimana — lunedì, mercoledì, venerdì — per sette settimane.',
  'Alterna sempre il colore: due navy di fila leggono come un unico post nel feed.',
  '',
  '| # | Pilastro | Layout | Gancio |',
  '|---|---|---|---|',
  ...POSTS.map((p) => `| ${p.n} | ${p.pillar} | ${p.layout} | ${(p.headline ?? p.stat).replace(/\n/g, ' ')} |`),
  '',
  '---',
  '',
  ...POSTS.flatMap((p) => [
    `## Post ${String(p.n).padStart(2, '0')} · ${p.pillar}`,
    '',
    `**Immagine:** \`post-${String(p.n).padStart(2, '0')}-${p.pillar}.png\``,
    '',
    '**Didascalia:**',
    '',
    p.caption,
    '',
    HASHTAGS.join(' '),
    '',
    '---',
    '',
  ]),
].join('\n')
fs.writeFileSync(`${OUT}/POSTS.md`, md)
console.log('\nPOSTS.md written')
