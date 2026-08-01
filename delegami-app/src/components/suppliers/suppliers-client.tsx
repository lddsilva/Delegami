'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, X, ExternalLink, MapPin, Map as MapIcon, Phone, Mail } from 'lucide-react'
import { ButtonLink } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FilterChip } from '@/components/ui/filter-chip'

type Supplier = {
  id: string
  name: string
  category: string | null
  tags: string | null
  website: string | null
  email: string | null
  phone: string | null
  address: string | null
  vatNumber: string | null
  notes: string | null
  _count: { expenses: number }
}

type Country = 'all' | 'CH' | 'IT'

// Group tags into parent categories for cleaner UI
const TAG_PARENTS: Record<string, string> = {
  // Materiali
  'materiali edili': 'Materiali Edili', 'ferramenta': 'Materiali Edili', 'bricolage': 'Materiali Edili',
  'utensili': 'Materiali Edili', 'legname': 'Materiali Edili', 'calcestruzzo': 'Materiali Edili',
  'cemento': 'Materiali Edili', 'inerti': 'Materiali Edili',
  'materiali edili e ferramenta': 'Materiali Edili', 'bricolage e materiali': 'Materiali Edili',
  'legname e falegnameria': 'Materiali Edili', 'calcestruzzo e inerti': 'Materiali Edili',
  // Sanitari e Bagno
  'sanitari': 'Sanitari e Bagno', 'bagno': 'Sanitari e Bagno', 'wc': 'Sanitari e Bagno',
  'lavabi': 'Sanitari e Bagno', 'docce': 'Sanitari e Bagno', 'vasche': 'Sanitari e Bagno',
  'idraulica': 'Sanitari e Bagno', 'scarichi': 'Sanitari e Bagno', 'telai': 'Sanitari e Bagno',
  'sanitari e bagno': 'Sanitari e Bagno', 'idraulica e riscaldamento': 'Sanitari e Bagno',
  // Rubinetteria
  'rubinetteria': 'Rubinetteria', 'miscelatori': 'Rubinetteria',
  // Cucine e Arredamento
  'cucine': 'Cucine e Arredamento', 'arredamento': 'Cucine e Arredamento', 'mobili': 'Cucine e Arredamento',
  'illuminazione': 'Cucine e Arredamento',
  'arredamento e cucine': 'Cucine e Arredamento',
  // Elettrodomestici
  'elettrodomestici': 'Elettrodomestici', 'cucina': 'Elettrodomestici',
  // Piastrelle e Ceramiche
  'piastrelle': 'Piastrelle e Ceramiche', 'gres porcellanato': 'Piastrelle e Ceramiche',
  'rivestimenti': 'Piastrelle e Ceramiche', 'ceramiche': 'Piastrelle e Ceramiche',
  'piastrelle e ceramiche': 'Piastrelle e Ceramiche',
  // Sistemi Costruttivi
  'cartongesso': 'Sistemi Costruttivi', 'intonaci': 'Sistemi Costruttivi',
  'isolamento': 'Sistemi Costruttivi', 'cappotto': 'Sistemi Costruttivi',
  'malte': 'Sistemi Costruttivi', 'collanti': 'Sistemi Costruttivi',
  'impermeabilizzazione': 'Sistemi Costruttivi', 'coperture': 'Sistemi Costruttivi',
  'cartongesso e intonaci': 'Sistemi Costruttivi', 'malte e collanti': 'Sistemi Costruttivi',
  'isolamento e cappotto': 'Sistemi Costruttivi', 'porte e serramenti': 'Sistemi Costruttivi',
  // Impianti
  'elettricità': 'Impianti', 'impianti elettrici': 'Impianti', 'domotica': 'Impianti',
  'riscaldamento': 'Impianti', 'fotovoltaico': 'Impianti', 'gas': 'Impianti',
  'elettricita e impianti': 'Impianti',
  // Noleggio e Logistica
  'noleggio': 'Noleggio e Logistica', 'ponteggi': 'Noleggio e Logistica',
  'attrezzature': 'Noleggio e Logistica', 'smaltimento': 'Noleggio e Logistica', 'trasporto': 'Noleggio e Logistica',
  'noleggio attrezzature': 'Noleggio e Logistica', 'trasporto e smaltimento': 'Noleggio e Logistica',
  // Pittura
  'pittura': 'Pittura e Finiture', 'vernici': 'Pittura e Finiture', 'colori': 'Pittura e Finiture',
  'pittura e finiture': 'Pittura e Finiture',
  // Ferramenta professionale
  'fissaggi': 'Ferramenta Prof.', 'chimica edile': 'Ferramenta Prof.', 'abrasivi': 'Ferramenta Prof.', 'minuteria': 'Ferramenta Prof.',
  // Design
  'design': 'Design',
}
const PARENT_ORDER_SUPPLIERS = ['Materiali Edili', 'Sanitari e Bagno', 'Rubinetteria', 'Cucine e Arredamento', 'Elettrodomestici', 'Piastrelle e Ceramiche', 'Sistemi Costruttivi', 'Impianti', 'Pittura e Finiture', 'Ferramenta Prof.', 'Noleggio e Logistica', 'Design', 'Strutture']

interface Props {
  suppliers: Supplier[]
  canEdit: boolean
}

function parseTags(tags: string | null): string[] {
  if (!tags) return []
  return tags.split(',').map((t) => t.trim()).filter(Boolean)
}

function supplierSpecialties(s: Supplier): string[] {
  const tags = parseTags(s.tags)
  return tags.length > 0 ? tags : s.category ? [s.category] : []
}

function detectCountry(s: Supplier): 'CH' | 'IT' | null {
  if (s.vatNumber?.startsWith('CHE')) return 'CH'
  if (s.vatNumber?.startsWith('IT')) return 'IT'
  if (s.phone?.startsWith('+41')) return 'CH'
  if (s.phone?.startsWith('+39')) return 'IT'
  // fallback: Swiss cantons in address
  if (/ TI\b| ZH\b| BE\b| GE\b| BS\b/.test(s.address ?? '')) return 'CH'
  // Italian provinces
  if (/ CO\b| MI\b| VA\b| PV\b| VB\b| LC\b| BG\b/.test(s.address ?? '')) return 'IT'
  return null
}

export function SuppliersClient({ suppliers, canEdit }: Props) {
  const [search, setSearch] = useState('')
  const [country, setCountry] = useState<Country>('all')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [selectedParent, setSelectedParent] = useState<string | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showAllTags, _setShowAllTags] = useState(false)

  // After country filter, derive tags (only tags relevant to current country selection)
  const countryFiltered = useMemo(() =>
    suppliers.filter((s) => {
      if (country === 'all') return true
      return detectCountry(s) === country
    }),
  [suppliers, country])

  // Build parent groups from available tags
  const parentGroups = useMemo(() => {
    const parentMap = new Map<string, Set<string>>() // parent → set of tags
    countryFiltered.forEach((s) => {
      supplierSpecialties(s).forEach((tag) => {
        const parent = TAG_PARENTS[tag.toLowerCase()] ?? 'Altro'
        if (!parentMap.has(parent)) parentMap.set(parent, new Set())
        parentMap.get(parent)!.add(tag)
      })
    })
    return PARENT_ORDER_SUPPLIERS
      .filter((p) => parentMap.has(p))
      .map((p) => ({ parent: p, tags: Array.from(parentMap.get(p)!).sort() }))
      .concat(
        Array.from(parentMap.entries())
          .filter(([p]) => !PARENT_ORDER_SUPPLIERS.includes(p))
          .map(([p, tags]) => ({ parent: p, tags: Array.from(tags).sort() }))
      )
  }, [countryFiltered])


  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    const parentTags = selectedParent
      ? (parentGroups.find((g) => g.parent === selectedParent)?.tags ?? [])
      : []
    return countryFiltered.filter((s) => {
      const specialties = supplierSpecialties(s)
      if (selectedTag && !specialties.includes(selectedTag)) return false
      if (selectedParent && !selectedTag) {
        // show supplier if it has at least one tag in the selected parent group
        if (!parentTags.some((pt) => specialties.includes(pt))) return false
      }
      if (!q) return true
      return (
        s.name.toLowerCase().includes(q) ||
        (s.category?.toLowerCase().includes(q) ?? false) ||
        (s.tags?.toLowerCase().includes(q) ?? false) ||
        (s.email?.toLowerCase().includes(q) ?? false) ||
        (s.address?.toLowerCase().includes(q) ?? false)
      )
    })
  }, [countryFiltered, selectedTag, selectedParent, parentGroups, search])

  const chCount = useMemo(() => suppliers.filter((s) => detectCountry(s) === 'CH').length, [suppliers])
  const itCount = useMemo(() => suppliers.filter((s) => detectCountry(s) === 'IT').length, [suppliers])


  function handleCountryChange(c: Country) {
    setCountry(c)
    setSelectedTag(null)
    setSelectedParent(null)
  }

  return (
    <div className="space-y-3">
      {/* Row 1: Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cerca per nome, specialità, indirizzo…"
          className="min-h-11 w-full rounded-control border border-line-strong bg-surface pl-9 pr-9 text-body text-ink placeholder:text-ink-muted transition-colors duration-state focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
        />
        {search && (
          <button type="button" onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-muted">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Row 2: Country toggle */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="shrink-0 text-label font-medium text-ink-muted">Paese:</span>
        {([
          { value: 'all' as Country, label: 'Tutti', count: suppliers.length },
          { value: 'CH' as Country, label: '🇨🇭 Svizzera', count: chCount },
          { value: 'IT' as Country, label: '🇮🇹 Italia', count: itCount },
        ] as const).map(({ value, label, count }) => (
          <FilterChip key={value} active={country === value} count={count} onClick={() => handleCountryChange(value)}>
            {label}
          </FilterChip>
        ))}
      </div>

      {/* Row 3: 2-level tag filter */}
      {parentGroups.length > 0 && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="shrink-0 text-label font-medium text-ink-muted">Categoria:</span>
            <FilterChip active={!selectedParent} onClick={() => { setSelectedParent(null); setSelectedTag(null) }}>
              Tutto
            </FilterChip>
            {parentGroups.map(({ parent }) => (
              <FilterChip
                key={parent}
                active={selectedParent === parent}
                onClick={() => { setSelectedParent(selectedParent === parent ? null : parent); setSelectedTag(null) }}
              >
                {parent}
              </FilterChip>
            ))}
          </div>
          {selectedParent && (
            <div className="flex flex-wrap items-center gap-2 pl-1">
              <span className="text-label text-ink-subtle" aria-hidden>↳</span>
              <FilterChip active={!selectedTag} onClick={() => setSelectedTag(null)}>Tutti</FilterChip>
              {parentGroups.find((g) => g.parent === selectedParent)?.tags.map((tag) => (
                <FilterChip key={tag} active={selectedTag === tag} onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}>
                  {tag}
                </FilterChip>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Results count + map button */}
      <div className="flex items-center justify-between">
      <p className="text-label text-ink-muted">
        {filtered.length} {filtered.length === 1 ? 'fornitore' : 'fornitori'}
        {selectedTag && <> · <span className="text-action">{selectedTag}</span></>}
        {search && <> · &ldquo;{search}&rdquo;</>}
      </p>
      {filtered.length > 0 && (
        <button
          type="button"
          onClick={() => {
            const entries = filtered
              .filter((s) => s.address)
              .slice(0, 20)
              .map((s) => `${s.name}, ${s.address}`)
            const query = entries.join(' | ')
            window.open(`https://www.google.com/maps/search/${encodeURIComponent(query)}`, '_blank')
          }}
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-control border border-line-strong bg-surface px-3 text-body font-medium text-action transition-colors duration-state hover:bg-action-surface"
        >
          <MapIcon className="h-4 w-4" /> Vedi su mappa ({filtered.filter(s => s.address).length})
        </button>
      )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <p className="text-center text-body text-ink-muted py-12">Nessun fornitore trovato</p>
      ) : (
        /* Rows, not a table.
           Contatti was `hidden md:table-cell` with no fallback, so the phone
           number — the single most useful field when you are standing on a site
           with a problem — was invisible on a phone. Now it is always present
           and always tappable. */
        <Card>
          <ul className="divide-y divide-line">
            {filtered.map((s) => {
              const tags = supplierSpecialties(s)
              const sc = detectCountry(s)
              return (
                <li key={s.id} className="group relative px-4 py-3 transition-colors duration-state hover:bg-surface-raised sm:px-5">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-body leading-none" aria-hidden>
                          {sc === 'CH' ? '🇨🇭' : sc === 'IT' ? '🇮🇹' : '🌍'}
                        </span>
                        <Link href={`/suppliers/${s.id}`} className="truncate text-body font-medium text-ink after:absolute after:inset-0 group-hover:text-action">
                          {s.name}
                        </Link>
                        {s.website && (
                          <a
                            href={s.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Sito web di ${s.name}`}
                            title={s.website}
                            className="tap-target relative z-10 -my-2 inline-flex shrink-0 items-center justify-center rounded-control text-ink-muted transition-colors duration-state hover:text-action"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>

                      {s.address && (
                        <div className="mt-1">
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative z-10 -my-3.5 flex w-fit max-w-full items-center gap-1 py-3.5 text-label text-ink-muted hover:text-action"
                          >
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate">{s.address}</span>
                          </a>
                        </div>
                      )}

                      {tags.length > 0 && (
                        <div className="relative z-10 flex w-fit flex-wrap gap-1 mt-2">
                          {tags.map((t) => (
                            <FilterChip key={t} active={selectedTag === t} onClick={() => setSelectedTag(t === selectedTag ? null : t)}>
                              {t}
                            </FilterChip>
                          ))}
                        </div>
                      )}
                    </div>

                    {canEdit && (
                      <ButtonLink href={`/suppliers/${s.id}/edit`} variant="ghost" size="sm" className="relative z-10 shrink-0">
                        Modifica
                      </ButtonLink>
                    )}
                  </div>

                  {/* Tap to call, tap to write — the two things you actually do
                      with a supplier from a building site. */}
                  {(s.phone || s.email) && (
                    <div className="relative z-10 mt-2 flex flex-wrap gap-2">
                      {s.phone && (
                        <a
                          href={`tel:${s.phone.replace(/\s/g, '')}`}
                          className="inline-flex min-h-11 items-center gap-2 rounded-control border border-line-strong px-3 text-body text-ink transition-colors duration-state hover:bg-surface-raised"
                        >
                          <Phone className="h-4 w-4 text-ink-muted" />
                          <span className="numeric">{s.phone}</span>
                        </a>
                      )}
                      {s.email && (
                        <a
                          href={`mailto:${s.email}`}
                          aria-label={`Scrivi a ${s.name}`}
                          className="inline-flex min-h-11 items-center gap-2 rounded-control border border-line-strong px-3 text-body text-ink transition-colors duration-state hover:bg-surface-raised"
                        >
                          <Mail className="h-4 w-4 text-ink-muted" />
                          <span className="max-w-[12rem] truncate">{s.email}</span>
                        </a>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </Card>
      )}
    </div>
  )
}
