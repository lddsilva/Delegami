export const PRICE_CATALOG_CATEGORIES = [
  'Bagno – Accessori',
  'Bagno – Docce e Box',
  'Bagno – Impianto Idraulico',
  'Bagno – Lavabi e Bidet',
  'Bagno – Mobili',
  'Bagno – Riscaldamento',
  'Bagno – Rubinetteria',
  'Bagno – Ventilazione',
  'Bagno – WC',
  'Cucina – Accessori e Illuminazione',
  'Cucina – Cottura',
  'Cucina – Elettrodomestici',
  'Cucina – Lavello e Rubinetteria',
  'Cucina – Mobili e Piani',
  'Finiture – Fondi e Primer',
  'Finiture – Intonaci e Rasanti',
  'Finiture – Pittura',
  'Impianti – Elettrica',
  'Impianti – Gas',
  'Impianti – Idraulica',
  'Impianti – Riscaldamento',
  'Logistica – Ponteggi e Noleggio',
  'Logistica – Pulizia',
  'Logistica – Trasporto e Smaltimento',
  'Manodopera – Demolizioni',
  'Manodopera – Elettrica',
  'Manodopera – Generale',
  'Manodopera – Idraulica',
  'Manodopera – Muratura',
  'Pavimenti – Battiscopa e Profili',
  'Pavimenti – Esterni',
  'Pavimenti – Gres Porcellanato',
  'Pavimenti – Parquet e Laminato',
  'Pavimenti – Piastrelle Speciali',
  'Pavimenti – Posa e Collanti',
  'Strutture – Cartongesso',
  'Strutture – Finiture Edili',
  'Strutture – Impermeabilizzazione',
  'Strutture – Isolamento',
  'Strutture – Muratura',
  'Strutture – Porte e Finestre',
  'Strutture – Scale',
  'Utensili – Accessori e Strumenti',
  'Varie – Generale',
] as const

export const LEGACY_PRICE_CATEGORY_ALIASES: Record<string, string> = {
  Generale: 'Varie – Generale',
  'Pittura': 'Finiture – Pittura',
  'Muratura': 'Strutture – Muratura',
  'Impianti elettrici': 'Impianti – Elettrica',
  'Impianti idraulici': 'Impianti – Idraulica',
  "Mano d'opera": 'Manodopera – Generale',
  'Trasporto e smaltimento': 'Logistica – Trasporto e Smaltimento',
  'Noleggio attrezzature': 'Logistica – Ponteggi e Noleggio',
}

export const PRICE_CATEGORY_PREFIX: Record<string, string> = {
  'Bagno – Accessori': 'BAG-ACC',
  'Bagno – Docce e Box': 'BAG-DOC',
  'Bagno – Impianto Idraulico': 'BAG-IDR',
  'Bagno – Lavabi e Bidet': 'BAG-LAV',
  'Bagno – Mobili': 'BAG-MOB',
  'Bagno – Riscaldamento': 'BAG-RIS',
  'Bagno – Rubinetteria': 'BAG-RUB',
  'Bagno – Ventilazione': 'BAG-VEN',
  'Bagno – WC': 'BAG-WC',
  'Cucina – Accessori e Illuminazione': 'CUC-ACC',
  'Cucina – Cottura': 'CUC-COT',
  'Cucina – Elettrodomestici': 'CUC-ELE',
  'Cucina – Lavello e Rubinetteria': 'CUC-LAV',
  'Cucina – Mobili e Piani': 'CUC-MOB',
  'Finiture – Fondi e Primer': 'FIN-FON',
  'Finiture – Intonaci e Rasanti': 'FIN-INT',
  'Finiture – Pittura': 'FIN-PIT',
  'Impianti – Elettrica': 'IMP-ELE',
  'Impianti – Gas': 'IMP-GAS',
  'Impianti – Idraulica': 'IMP-IDR',
  'Impianti – Riscaldamento': 'IMP-RIS',
  'Logistica – Ponteggi e Noleggio': 'LOG-NOL',
  'Logistica – Pulizia': 'LOG-PUL',
  'Logistica – Trasporto e Smaltimento': 'LOG-TRS',
  'Manodopera – Demolizioni': 'MAN-DEM',
  'Manodopera – Elettrica': 'MAN-ELE',
  'Manodopera – Generale': 'MAN-GEN',
  'Manodopera – Idraulica': 'MAN-IDR',
  'Manodopera – Muratura': 'MAN-MUR',
  'Pavimenti – Battiscopa e Profili': 'PAV-BAT',
  'Pavimenti – Esterni': 'PAV-EST',
  'Pavimenti – Gres Porcellanato': 'PAV-GRE',
  'Pavimenti – Parquet e Laminato': 'PAV-PAR',
  'Pavimenti – Piastrelle Speciali': 'PAV-SPE',
  'Pavimenti – Posa e Collanti': 'PAV-POS',
  'Strutture – Cartongesso': 'STR-CAR',
  'Strutture – Finiture Edili': 'STR-FIN',
  'Strutture – Impermeabilizzazione': 'STR-IMP',
  'Strutture – Isolamento': 'STR-ISO',
  'Strutture – Muratura': 'STR-MUR',
  'Strutture – Porte e Finestre': 'STR-INF',
  'Strutture – Scale': 'STR-SCA',
  'Utensili – Accessori e Strumenti': 'UTE-ACC',
  'Varie – Generale': 'VAR-GEN',
}

export function normalizePriceCategory(value: string | null | undefined) {
  const cleaned = (value ?? '').replace(/\s+[-–—]\s+/g, ' – ').trim()
  if (!cleaned) return 'Varie – Generale'
  const aliased = LEGACY_PRICE_CATEGORY_ALIASES[cleaned] ?? cleaned
  return PRICE_CATALOG_CATEGORIES.includes(aliased as (typeof PRICE_CATALOG_CATEGORIES)[number])
    ? aliased
    : 'Varie – Generale'
}

export function priceCategoryPrefix(category: string) {
  const normalized = normalizePriceCategory(category)
  return PRICE_CATEGORY_PREFIX[normalized] ?? 'VAR-GEN'
}

export function inferPriceCategoryFromText(...parts: Array<string | null | undefined>) {
  const text = parts.filter(Boolean).join(' ').toLowerCase()
  if (text.includes('wc') || text.includes('sanitari') || text.includes('doccia') || text.includes('bagno')) return 'Bagno – WC'
  if (text.includes('rubinet')) return 'Bagno – Rubinetteria'
  if (text.includes('lavabo') || text.includes('bidet')) return 'Bagno – Lavabi e Bidet'
  if (text.includes('piastrel') || text.includes('gres') || text.includes('paviment')) return 'Pavimenti – Gres Porcellanato'
  if (text.includes('colla') || text.includes('posa')) return 'Pavimenti – Posa e Collanti'
  if (text.includes('pittura') || text.includes('tinteggi')) return 'Finiture – Pittura'
  if (text.includes('intonac') || text.includes('rasant')) return 'Finiture – Intonaci e Rasanti'
  if (text.includes('elettric') || text.includes('presa') || text.includes('interrutt')) return 'Impianti – Elettrica'
  if (text.includes('idraulic') || text.includes('scarico') || text.includes('tubo')) return 'Impianti – Idraulica'
  if (text.includes('cartongesso')) return 'Strutture – Cartongesso'
  if (text.includes('porta') || text.includes('finestr') || text.includes('serrament')) return 'Strutture – Porte e Finestre'
  if (text.includes('demol')) return 'Manodopera – Demolizioni'
  if (text.includes('trasporto') || text.includes('smalt')) return 'Logistica – Trasporto e Smaltimento'
  if (text.includes('noleggio') || text.includes('ponteggio')) return 'Logistica – Ponteggi e Noleggio'
  if (text.includes('cucina') || text.includes('piano')) return 'Cucina – Mobili e Piani'
  return 'Varie – Generale'
}

