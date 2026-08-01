import fs from 'fs'

// For each list page, add session check and canEdit guard around mutation buttons
// Pattern: wrap Link/Button with {canEdit && ...}

function addSessionImport(content) {
  if (content.includes("import { getSession, canMutate } from '@/lib/auth'")) return content
  // Add after last import line
  const lines = content.split('\n')
  let lastImportIdx = -1
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('import ')) lastImportIdx = i
  }
  if (lastImportIdx >= 0) {
    lines.splice(lastImportIdx + 1, 0, "import { getSession, canMutate } from '@/lib/auth'")
    return lines.join('\n')
  }
  return content
}

function addSessionFetch(content, dataFn) {
  if (content.includes('const canEdit =')) return content
  // Replace: const data = await getData()
  // With: const [data, session] = await Promise.all([getData(), getSession()])
  //       const canEdit = session ? canMutate(session.role) : false
  const simple = new RegExp(`const ${dataFn[0]} = await ${dataFn[1]}\\(\\)`)
  if (simple.test(content)) {
    return content.replace(simple,
      `const [${dataFn[0]}, session] = await Promise.all([${dataFn[1]}(), getSession()])\n  const canEdit = session ? canMutate(session.role) : false`)
  }
  return content
}

// quotes/page.tsx
{
  let c = fs.readFileSync('src/app/quotes/page.tsx', 'utf8')
  c = addSessionImport(c)
  c = addSessionFetch(c, ['quotes', 'getQuotes'])
  // Wrap new button
  c = c.replace(
    `        <Link href="/quotes/new">
          <Button size="sm">
            <Plus className="w-4 h-4" />`,
    `        {canEdit && <Link href="/quotes/new">
          <Button size="sm">
            <Plus className="w-4 h-4" />`
  )
  c = c.replace(
    `          </Button>
        </Link>
      </div>

      {quotes.length === 0`,
    `          </Button>
        </Link>}
      </div>

      {quotes.length === 0`
  )
  // Empty state button
  c = c.replace(
    `            <Link href="/quotes/new"><Button><Plus className="w-4 h-4" /> Crea preventivo</Button></Link>`,
    `            {canEdit && <Link href="/quotes/new"><Button><Plus className="w-4 h-4" /> Crea preventivo</Button></Link>}`
  )
  // Row edit button
  c = c.replace(
    `<Link href={\`/quotes/\${q.id}/edit\`}><Button variant="ghost" size="sm">Modifica</Button></Link>`,
    `{canEdit && <Link href={\`/quotes/\${q.id}/edit\`}><Button variant="ghost" size="sm">Modifica</Button></Link>}`
  )
  fs.writeFileSync('src/app/quotes/page.tsx', c)
  console.log('✅ quotes/page.tsx')
}

// projects/page.tsx
{
  let c = fs.readFileSync('src/app/projects/page.tsx', 'utf8')
  c = addSessionImport(c)
  c = addSessionFetch(c, ['projects', 'getProjects'])
  c = c.replace(
    `        <Link href="/projects/new">
          <Button size="sm">
            <Plus className="w-4 h-4" />`,
    `        {canEdit && <Link href="/projects/new">
          <Button size="sm">
            <Plus className="w-4 h-4" />`
  )
  c = c.replace(
    `          </Button>
        </Link>
      </div>

      {projects.length === 0`,
    `          </Button>
        </Link>}
      </div>

      {projects.length === 0`
  )
  c = c.replace(
    `            <Link href="/projects/new"><Button><Plus className="w-4 h-4" /> Aggiungi opera</Button></Link>`,
    `            {canEdit && <Link href="/projects/new"><Button><Plus className="w-4 h-4" /> Aggiungi opera</Button></Link>}`
  )
  c = c.replace(
    `<Button variant="ghost" size="sm">Modifica</Button>`,
    `{canEdit && <Button variant="ghost" size="sm">Modifica</Button>}`
  )
  fs.writeFileSync('src/app/projects/page.tsx', c)
  console.log('✅ projects/page.tsx')
}

// clients/page.tsx
{
  let c = fs.readFileSync('src/app/clients/page.tsx', 'utf8')
  c = addSessionImport(c)
  c = addSessionFetch(c, ['clients', 'getClients'])
  c = c.replace(
    `        <Link href="/clients/new">
          <Button size="sm">
            <Plus className="w-4 h-4" />`,
    `        {canEdit && <Link href="/clients/new">
          <Button size="sm">
            <Plus className="w-4 h-4" />`
  )
  c = c.replace(
    `          </Button>
        </Link>
      </div>

      {clients.length === 0`,
    `          </Button>
        </Link>}
      </div>

      {clients.length === 0`
  )
  c = c.replace(
    `            <Link href="/clients/new"><Button><Plus className="w-4 h-4" /> Aggiungi cliente</Button></Link>`,
    `            {canEdit && <Link href="/clients/new"><Button><Plus className="w-4 h-4" /> Aggiungi cliente</Button></Link>}`
  )
  c = c.replace(
    `<Button variant="ghost" size="sm">Modifica</Button>`,
    `{canEdit && <Button variant="ghost" size="sm">Modifica</Button>}`
  )
  fs.writeFileSync('src/app/clients/page.tsx', c)
  console.log('✅ clients/page.tsx')
}

// suppliers/page.tsx
{
  let c = fs.readFileSync('src/app/suppliers/page.tsx', 'utf8')
  c = addSessionImport(c)
  c = addSessionFetch(c, ['suppliers', 'getSuppliers'])
  c = c.replace(
    `        <Link href="/suppliers/new">
          <Button size="sm">
            <Plus className="w-4 h-4" />`,
    `        {canEdit && <Link href="/suppliers/new">
          <Button size="sm">
            <Plus className="w-4 h-4" />`
  )
  c = c.replace(
    `          </Button>
        </Link>
      </div>

      {suppliers.length === 0`,
    `          </Button>
        </Link>}
      </div>

      {suppliers.length === 0`
  )
  c = c.replace(
    `            <Link href="/suppliers/new"><Button><Plus className="w-4 h-4" /> Aggiungi fornitore</Button></Link>`,
    `            {canEdit && <Link href="/suppliers/new"><Button><Plus className="w-4 h-4" /> Aggiungi fornitore</Button></Link>}`
  )
  c = c.replace(
    `<Link href={\`/suppliers/\${s.id}/edit\`}><Button variant="ghost" size="sm">Modifica</Button></Link>`,
    `{canEdit && <Link href={\`/suppliers/\${s.id}/edit\`}><Button variant="ghost" size="sm">Modifica</Button></Link>}`
  )
  fs.writeFileSync('src/app/suppliers/page.tsx', c)
  console.log('✅ suppliers/page.tsx')
}

console.log('\nDone!')
