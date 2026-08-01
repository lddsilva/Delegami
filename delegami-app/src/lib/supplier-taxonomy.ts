export const SUPPLIER_CATEGORIES = [
  'Materiali edili e ferramenta',
  'Bricolage e materiali',
  'Piastrelle e ceramiche',
  'Sanitari e bagno',
  'Idraulica e riscaldamento',
  'Elettricita e impianti',
  'Pittura e finiture',
  'Legname e falegnameria',
  'Porte e serramenti',
  'Arredamento e cucine',
  'Calcestruzzo e inerti',
  'Cartongesso e intonaci',
  'Malte e collanti',
  'Isolamento e cappotto',
  'Noleggio attrezzature',
  'Trasporto e smaltimento',
  'Servizi professionali',
  'Agenzia di lavoro',
  'Altro',
] as const

export const SUPPLIER_TAGS_BY_CATEGORY: Record<string, string[]> = {
  'Materiali edili e ferramenta': ['materiali edili', 'ferramenta', 'utensili', 'minuteria', 'cemento', 'laterizi', 'giardinaggio'],
  'Bricolage e materiali': ['bricolage', 'materiali edili', 'ferramenta', 'utensili', 'pittura', 'giardinaggio'],
  'Piastrelle e ceramiche': ['piastrelle', 'gres porcellanato', 'rivestimenti', 'collanti', 'stucco fughe'],
  'Sanitari e bagno': ['sanitari', 'bagno', 'rubinetteria', 'docce', 'mobili bagno', 'scarichi'],
  'Idraulica e riscaldamento': ['idraulica', 'riscaldamento', 'sanitari', 'scarichi', 'tubi', 'raccordi'],
  'Elettricita e impianti': ['elettricita', 'impianti elettrici', 'domotica', 'illuminazione', 'cavi'],
  'Pittura e finiture': ['pittura', 'vernici', 'colori', 'rasanti', 'stucchi', 'primer'],
  'Legname e falegnameria': ['legname', 'travi', 'assi', 'pannelli', 'falegnameria'],
  'Porte e serramenti': ['porte', 'finestre', 'serramenti', 'persiane', 'tapparelle'],
  'Arredamento e cucine': ['arredamento', 'cucine', 'mobili', 'illuminazione', 'elettrodomestici'],
  'Calcestruzzo e inerti': ['calcestruzzo', 'cemento', 'inerti', 'sabbia', 'ghiaia'],
  'Cartongesso e intonaci': ['cartongesso', 'intonaci', 'isolamento', 'rasanti'],
  'Malte e collanti': ['malte', 'collanti', 'intonaci', 'impermeabilizzazione'],
  'Isolamento e cappotto': ['isolamento', 'cappotto', 'coperture', 'lana minerale'],
  'Noleggio attrezzature': ['noleggio', 'ponteggi', 'attrezzature', 'macchinari'],
  'Trasporto e smaltimento': ['trasporto', 'smaltimento', 'cassoni', 'rifiuti', 'discarica'],
  'Servizi professionali': ['consulenza', 'contabilita', 'progettazione', 'sicurezza'],
  'Agenzia di lavoro': ['personale interinale', 'lavoro temporaneo', 'manodopera', 'operai'],
  Altro: ['varie', 'fornitore generico'],
}

export function normalizeSupplierCategory(value?: string | null) {
  if (!value) return undefined
  const normalized = value.trim().toLowerCase()
  const direct = SUPPLIER_CATEGORIES.find((category) => category.toLowerCase() === normalized)
  if (direct) return direct

  if (normalized.includes('elettric')) return 'Elettricita e impianti'
  if (normalized.includes('idraulic') || normalized.includes('riscald')) return 'Idraulica e riscaldamento'
  if (normalized.includes('piastrell') || normalized.includes('ceramic')) return 'Piastrelle e ceramiche'
  if (normalized.includes('sanitari') || normalized.includes('rubinet')) return 'Sanitari e bagno'
  if (normalized.includes('pittur') || normalized.includes('color')) return 'Pittura e finiture'
  if (normalized.includes('legn') || normalized.includes('falegn')) return 'Legname e falegnameria'
  if (normalized.includes('serrament') || normalized.includes('porte')) return 'Porte e serramenti'
  if (normalized.includes('calcestr') || normalized.includes('cement')) return 'Calcestruzzo e inerti'
  if (normalized.includes('cartongesso') || normalized.includes('intonac')) return 'Cartongesso e intonaci'
  if (normalized.includes('noleggio') || normalized.includes('attrezz')) return 'Noleggio attrezzature'
  if (normalized.includes('arred') || normalized.includes('cucin')) return 'Arredamento e cucine'
  if (normalized.includes('material') || normalized.includes('ferrament')) return 'Materiali edili e ferramenta'
  return 'Altro'
}

export function defaultSupplierTagsForCategory(value?: string | null) {
  const category = normalizeSupplierCategory(value)
  if (!category) return undefined
  const tags = SUPPLIER_TAGS_BY_CATEGORY[category] ?? []
  return tags.slice(0, 3).join(',') || undefined
}
