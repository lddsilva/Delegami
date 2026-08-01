// Fix remaining mojibake en-dashes in expense-form.tsx
// en dash – (U+2013): UTF-8 E2 80 93 → misread Win-1252: â(E2) €(80) "(93=U+201C)
import { readFileSync, writeFileSync } from 'fs'

const file = 'src/components/expenses/expense-form.tsx'
let content = readFileSync(file, 'utf8')

// â (U+00E2) + € (U+20AC) + " (U+201C left curly quote) = broken en dash
const from = 'â€“'
const to = '–' // en dash –

const count = content.split(from).length - 1
content = content.split(from).join(to)
writeFileSync(file, content, 'utf8')
console.log(`Replaced ${count}x broken en-dash → –`)
