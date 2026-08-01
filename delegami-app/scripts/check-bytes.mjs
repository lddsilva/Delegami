import { readFileSync } from 'fs'
const buf = readFileSync('src/components/expenses/expense-form.tsx')
const str = buf.toString('utf8')

// Check what's on lines 86, 93, 97, 98, 110
const lines = str.split('\n')
for (const n of [85, 92, 96, 97, 109, 110]) {
  const line = lines[n] || ''
  console.log(`Line ${n+1}: ${JSON.stringify(line)}`)
  // Show any non-ASCII chars and their code points
  const nonAscii = [...line].filter(c => c.codePointAt(0) > 127)
  if (nonAscii.length) {
    console.log('  Non-ASCII:', nonAscii.map(c => `${c}(U+${c.codePointAt(0).toString(16).padStart(4,'0')})`).join(' '))
  }
}

// Search for any remaining mojibake em-dash: â (U+00E2) followed by € (U+20AC)
let emDashCount = 0
for (let i = 0; i < str.length - 2; i++) {
  if (str.codePointAt(i) === 0x00E2 && str.codePointAt(i+1) === 0x20AC) {
    emDashCount++
    const ctx = str.slice(Math.max(0, i-10), i+15).replace(/\n/g, '\\n')
    console.log(`\nBroken em-dash at char ${i}: ...${ctx}...`)
  }
}
if (emDashCount === 0) console.log('\nNo broken em-dashes found! ✓')
