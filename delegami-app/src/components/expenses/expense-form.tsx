'use client'

import { useActionState, useState, useEffect, useTransition, useRef, useCallback } from 'react'
import { useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Plus, X, Loader2, Camera, Paperclip, MapPin, Navigation } from 'lucide-react'
import type { ExpenseFormState } from '@/modules/expenses/actions'
import { createSupplierQuick } from '@/modules/suppliers/actions'
import { uploadExpenseReceipt } from '@/modules/documents/actions'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button, ButtonLink } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { FormSection } from '@/components/ui/form-section'
import { formatDateInput } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'

interface ProjectOption { id: string; name: string; client: { name: string } }
interface SupplierOption { id: string; name: string; address?: string | null }


// --- Descrizioni suggerite per tipo + categoria ---
const DESCRIPTIONS: Record<string, string[]> = {
  'MATERIAL:Materiali edili': ['Acquisto calcestruzzo pronto', 'Mattoni forati 12cm', 'Blocchi in calcestruzzo', 'Malta pronta sacco 25kg', 'Rete di armatura', 'Casseforme in legno', 'Tondini acciaio Ø12', 'Fibra polipropilenica', 'Sabbia lavata 0-4mm', 'Ghiaia 8-16mm', 'Cemento CEM II 42.5R', 'Additivo impermeabilizzante', 'Elementi prefabbricati', 'Listoni legno abete', 'Chiodi e viti varie'],
  'MATERIAL:Piastrelle e Ceramiche': ['Gres porcellanato 60×60 effetto cemento', 'Piastrelle rivestimento bagno 30×60', 'Mosaico vetro per doccia', 'Gres esterno antiscivolo R11', 'Colla C2 per piastrelle', 'Stucco fughe grigio 5kg', 'Battiscopa gres 7cm', 'Profili angolo piastrelle', 'Gres grande formato 60×120', 'Piastrelle cucina metro 10×30', 'Stucco epossidico', 'Crocette distanziatrici', 'Sistema livellazione Raimondi', 'Primer consolidante', 'Guaina impermeabilizzante doccia'],
  'MATERIAL:Sanitari e Bagno': ['WC sospeso + telaio Geberit', 'Lavabo sospeso 55cm', 'Box doccia 80×80 vetro 6mm', 'Piatto doccia ultrasottile', 'Miscelatore lavabo Grohe Eurosmart', 'Set doccia soffione+asta', 'Specchio con armadietto LED', 'Mobile sottolavabo IKEA GODMORGON', 'Piletta scarico doccia Geberit', 'Placca comando WC Sigma20', 'Rubinetto miscelatore cucina', 'Accessori bagno (set 5 pz)', 'Portasciugamani elettrico', 'Ventilatore da bagno', 'Copriwater soft-close'],
  'MATERIAL:Elettrica e Impianti': ['Cavo NYM 3×2.5mm²', 'Cavo NYM 3×1.5mm²', 'Tubo corrugato Ø20mm', 'Cassette da incasso 3 moduli', 'Interruttore Feller EDIZIOdue', 'Prese bipasso+terra Feller', 'Faretti LED da incasso 6W', 'Strip LED 4000K', 'Interruttore differenziale', 'Quadro elettrico 24 moduli', 'Presa USB-C + presa CH', 'Sensore movimento PIR', 'Termostato smart WiFi', 'Dimmer LED 200W', 'Cavo CAT6 rete dati'],
  'MATERIAL:Idraulica': ['Tubo multicrestrato Ø20mm', 'Tubo multicrestrato Ø16mm', 'Raccorderia idraulica', 'Valvola di intercettazione', 'Sifone lavabo Ø40', 'Tubo scarico PP Ø50', 'Colonna scarico Geberit PP Ø110', 'Nastro teflon', 'Guarnizioni varie', 'Tubi flessibili doccia', 'Valvola termostatica radiatore', 'Radiatore acciaio 600×1000', 'Piletta doccia inox', 'Scarico lineare 80cm', 'Raccordi rapidi'],
  'MATERIAL:Pitture e Finiture': ['Pittura lavabile bianca 10L Caparol', 'Smalto satinato bianco 1L', 'Primer acrilico universale 5L', 'Pittura soffitto bianca opaca', 'Pittura per esterni silossanica', 'Rasante in pasta 20kg', 'Stucco vinilico fine', 'Silicone neutro trasparente', 'Silicone sanitario bianco', 'Nastro masking 50mm', 'Teli protezione pavimento', 'Rete fibra di vetro armatura', 'Aggrappante su cartongesso', 'Vernice per legno esterno', 'Schiuma poliuretanica 750ml'],
  'MATERIAL:Legname e Pannelli': ['Travi abete 12×12cm', 'Assi legno abete 5×20cm', 'Pannelli OSB 18mm', 'Compensato pioppo 15mm', 'Pannello MDF 18mm', 'Doghe pino 3×10cm', 'Listonato rovere 20×20cm', 'Batten strips legno', 'Pannello multistrato marittimo', 'Legno massello rovere', 'Tavolato grezzo castagno', 'Profili HEA acciaio', 'Rete elettrosaldata', 'Lamiera zincata 1mm', 'Angolari acciaio'],
  'MATERIAL:Ferramenta e Utensili': ['Viti 6×100 per legno', 'Tasselli chimici M10', 'Chiodi ardesia', 'Cerniere per porte', 'Maniglie porte interne', 'Serratura porta', 'Supporti mensola', 'Squadre acciaio zincato', 'Bulloni M12', 'Disco diamantato flex 125mm', 'Disco smerigliatrice legno', 'Carta abrasiva varie grane', 'Siliconatore professionale', 'Spatola inox 30cm', 'Frattazzo dentato 10mm'],
  'MATERIAL:Elettrodomestici': ['Piano cottura induzione Bosch', 'Forno da incasso multifunzione', 'Cappa aspirante 60cm', 'Lavastoviglie da incasso', 'Frigorifero combinato da incasso', 'Lavatrice 8kg', 'Asciugatrice pompa calore', 'Microonde da incasso', 'Macchina caffè da incasso', 'Cassetto scaldavivande', 'Congelatore a cassetti', 'Cantinetta vini', 'Miscelatore cucina estraibile', 'Lavello inox 1.5 vasche', 'Piano cottura gas 4 fuochi'],
  'MATERIAL:Arredamento': ['Cucina IKEA METOD completa', 'Mobili bagno GODMORGON', 'Basi cucina 60cm', 'Pensili cucina 60cm', 'Piano cucina laminato 240cm', 'Frontali cucina VOXTORP', 'Armadio PAX', 'Scaffalatura KALLAX', 'Tavolo soggiorno', 'Sedie cucina set 4', 'Libreria', 'Mobile TV', 'Cassettiera', 'Divano soggiorno', 'Illuminazione soggiorno'],
  'MATERIAL:Acquisto Italia': ['Acquisto Leroy Merlin Como', 'Acquisto OBI Varese', 'Acquisto Bricoman', 'Acquisto Gamma', 'Piastrelle Marazzi/Supergres', 'Sanitari Ideal Standard', 'Rubinetteria Paffoni', 'Elettrodomestici Italia', 'Ferramenta Würth', 'Legname segheria', 'Materiali vari Italia', 'Acquisto online Amazon.it', 'Fornitura Knauf IT', 'Ceramiche importazione', 'Altro acquisto Italia'],
  'LABOR:Muratura': ['Lavori di muratura giornata', 'Apertura nuova porta', 'Chiusura vano porta', 'Tracce impianti', 'Riparazione crepe', 'Intonacatura pareti', 'Stabilitura e rasatura', 'Aggrappante su superfici', 'Costruzione parete laterizio', 'Demolizione parete', 'Rappezzi intonaco', 'Posa architrave', 'Cerchiatura apertura', 'Riparazione massetto', 'Posa soglie e davanzali'],
  'LABOR:Idraulica': ['Installazione bagno completo', 'Montaggio WC sospeso', 'Montaggio lavabo + rubinetteria', 'Posa box doccia + piatto', 'Allacciamento cucina idraulico', 'Spostamento punto acqua', 'Installazione sistema doccia', 'Collaudo impianto idrico', 'Riparazione perdita', 'Sostituzione rubinetteria', 'Installazione scaldasalviette', 'Installazione radiatori', 'Scarico impianto riscaldamento', 'Collegamento lavatrice', 'Posa tubazioni'],
  'LABOR:Elettrica': ['Rifacimento impianto elettrico', 'Installazione punto luce', 'Installazione presa elettrica', 'Sostituzione quadro elettrico', 'Allacciamento elettrodomestici', 'Posa cavi in traccia', 'Installazione interruttori', 'Collaudo impianto + certificato', 'Installazione plafoniere', 'Posa faretto LED', 'Connessione piano induzione', 'Linea dedicata lavatrice', 'Installazione ventilatore bagno', 'Posa sensori movimento', 'Installazione termostato'],
  'LABOR:Posa pavimenti': ['Posa gres porcellanato', 'Posa parquet laminato flottante', 'Posa LVT click', 'Posa battiscopa', 'Impermeabilizzazione doccia', 'Preparazione sottofondo', 'Posa massetto autolivellante', 'Levigatura parquet', 'Posa piastrelle esterno', 'Preparazione superficie', 'Stuccatura fughe', 'Taglio e posa profili', 'Posa mosaico', 'Demolizione vecchio pavimento', 'Posa telo barriera vapore'],
  'LABOR:Pittura': ['Tinteggiatura pareti appartamento', 'Tinteggiatura soffitti', 'Verniciatura porte interne', 'Verniciatura persiane', 'Verniciatura radiatori', 'Stuccatura completa pareti', 'Applicazione rasante', 'Pittura facciata esterna', 'Verniciatura ringhiera', 'Pulizia e preparazione', 'Applicazione primer', 'Carteggiatura legno', 'Verniciatura finestre', 'Pittura garage/cantina', 'Applicazione intonaco colorato'],
  'LABOR:Falegnameria': ['Montaggio cucina completa', 'Installazione porte interne', 'Montaggio porte blindate', 'Installazione finestre PVC', 'Montaggio armadi su misura', 'Posa parquet massello', 'Installazione davanzali', 'Montaggio persiane', 'Riparazione porta esistente', 'Posa tapparelle', 'Montaggio mobili bagno', 'Installazione scala', 'Posa battiscopa legno', 'Riparazione finestra', 'Assemblaggio mobili IKEA'],
  'LABOR:Subappalto specializzato': ['GC Termo-Idraulica — lavori', 'Smontaggio sanitari specializzato', 'Saldatura carpenteria', 'Verniciatura a polvere', 'Impermeabilizzazione terrazzo', 'Installazione cappotto', 'Rimozione amianto', 'Bonifica ambientale', 'Lavori strutturali specializzati', 'Installazione fotovoltaico', 'Montaggio ponteggi', 'Restauro facciate', 'Dragaggio e scavo', 'Posa rete idrica esterna', 'Lavori di saldatura'],
  'LABOR:Pulizia cantiere': ['Pulizia fine cantiere', 'Detersione piastrelle post-posa', 'Rimozione protezioni pavimento', 'Pulizia vetri', 'Sgombero macerie giornata', 'Pulizia appartamento completa', 'Smaltimento imballaggi', 'Aspirazione polvere', 'Lavaggio pavimenti', 'Pulizia bagno post-lavori', 'Pulizia cucina post-lavori', 'Pulizia cantiere settimanale', 'Smontaggio protezioni', 'Sanificazione locali', 'Pulizia scale e corridoi'],
  'LABOR:Manodopera generica': ['Scarico e trasporto materiali', 'Assistenza muratore', 'Movimento terra a mano', 'Carico macerie su cassone', 'Disassemblaggio elementi', 'Sgombero locali', 'Montaggio ponteggio interno', 'Operaio generico giornata', 'Aiuto montaggio cucina', 'Distribuzione materiali piano', 'Lavori accessori cantiere', 'Assistenza tecnica', 'Sopralluogo e misurazioni', 'Movimentazione pesante', 'Varie giornata'],
  'TRANSPORT:Carburante': ['Gasolio furgone cantiere', 'Benzina auto lavoro', 'Gasolio autocarro', 'Carburante macchine operative', 'Benzina trasferta Italia', 'GPL veicolo aziendale', 'Gasolio generatore', 'Rifornimento furgone settimana', 'Carburante mese veicoli', 'Gasolio muletto', 'Benzina emergenza', 'Additivo diesel', 'Carburante macchina operatrice', 'Gasolio pompaggio', 'Rifornimento tanica'],
  'TRANSPORT:Noleggio veicoli': ['Noleggio furgone 1 giorno', 'Noleggio autocarro 3.5t', 'Noleggio camion grande', 'Noleggio betoniera mobile', 'Noleggio auto lavoro', 'Noleggio furgone settimana', 'Noleggio veicolo trasferta', 'Nolo miniescavatore', 'Noleggio sollevatore', 'Noleggio piattaforma aerea', 'Noleggio compressore semovente', 'Autonoleggio Italia', 'Noleggio rimorchio', 'Nolo muletto', 'Noleggio aspiratore industriale'],
  'TRANSPORT:Trasporto materiali': ['Trasporto calcestruzzo autobetoniera', 'Trasporto materiali da Bauhaus', 'Spedizione materiali Italia', 'Trasporto piastrelle', 'Consegna mobili cucina', 'Consegna elettrodomestici', 'Trasporto macchinari', 'Consegna pavimenti laminato', 'Trasporto mobili bagno', 'Consegna porte e finestre', 'Corriere espresso materiali', 'Trasporto macerie smaltimento', 'Consegna prefabbricati', 'Spedizione urgente', 'Trasporto caldaia'],
  'TRANSPORT:Pedaggi e parcheggi': ['Autostrada A2 Lugano-Como', 'Pedaggio autostradale Italia', 'Parcheggio Lugano centro', 'Parking cantiere', 'Tassa congestion Milano', 'Pedaggio tunnel Monte Ceneri', 'Parcheggio aeroporto', 'Disco orario zona', 'Parchimetro giornata', 'Parking lungo termine', 'Abbonamento ZTL', 'Pedaggio A9 Italia', 'Parcheggio stazione', 'Pedaggio viadotto', 'Pedaggio valico frontiera'],
  'EQUIPMENT:Noleggio attrezzature': ['Noleggio betoniera 140L', 'Noleggio compressore 50L', 'Noleggio taglierina disco', 'Noleggio lucidatrice pavimento', 'Noleggio sega circolare', 'Noleggio decapatore', 'Noleggio aspiratore industriale', 'Noleggio livella laser', 'Noleggio cesoia ferro', 'Noleggio tassellatore SDS', 'Noleggio saldatrice', 'Noleggio generatore 5kW', 'Noleggio pompa acqua', 'Noleggio carrello elevatore', 'Noleggio scala gru'],
  'EQUIPMENT:Noleggio ponteggi': ['Noleggio ponteggio facciata 1 mese', 'Noleggio torre mobile interna', 'Ponteggio fisso 3m×5m', 'Noleggio trabattello', 'Cavalletti lavoro legno', 'Ponteggio esterno smontaggio', 'Prolungamento noleggio ponteggio', 'Rete antiproiezione', 'Ancoraggi sicurezza', 'Protezioni laterali', 'Base puntello regolabile', 'Telo di contenimento', 'Smontaggio ponteggio', 'Ponteggio rampa scala', 'Attrezzatura sicurezza altezza'],
  'EQUIPMENT:Acquisto utensili': ['Martello perforatore SDS+', 'Smerigliatrice angolare 125mm', 'Trapano avvitatore cordless', 'Sega circolare manuale', 'Livella laser 3D', 'Spatola elettrica raschietto', 'Cutter professionale', 'Saldatore stagno', 'Pompante silicone', 'Frattazzo dentato acciaio', 'Metro laser Bosch', 'Set chiavi inglesi', 'Cacciaviti professionali', 'Set punte cemento', 'Taglierina piastrelle manuale'],
  'ADMIN:Permessi e licenze': ['Tassa cantonale permesso costruire', 'Permesso manomissione suolo', 'Pratica burocratica comune', 'Deposito progetto SUVA', 'Autorizzazione lavori notturni', 'Licenza occupazione suolo', 'Notifica cantiere comune', 'Pratica edilizia', 'Richiesta abitabilità', 'Collaudo finale edificio', 'Certificato conformità impianto', 'Documenti SUVA cantiere', 'Registro cantiere', 'Tassa urbanistica', 'Permesso passo carrabile'],
  'ADMIN:Assicurazioni': ['Assicurazione RC cantiere', 'Assicurazione veicoli aziendali', 'Polizza infortuni operai', 'Assicurazione opere completate', 'Fideiussione bancaria', 'Assicurazione furto attrezzature', 'Premio assicurativo annuale', 'Estensione polizza', 'Assicurazione trasporti', 'Copertura danni terzi', 'Polizza CAR (Contractor All Risk)', 'Assicurazione fabbricato', 'RCT professionale', 'Polizza decennale', 'Assicurazione malattia dipendenti'],
  'OTHER:Smaltimento rifiuti': ['Noleggio cassone 7m³', 'Noleggio cassone 10m³', 'Smaltimento macerie miste', 'Smaltimento amianto', 'Smaltimento rifiuti speciali', 'Conferimento discarica', 'Smaltimento imballaggi', 'Pulizia e smaltimento', 'Trasporto rifiuti pericolosi', 'Smaltimento vernici', 'Smaltimento apparecchiature', 'Conferimento CER', 'Trasporto RAEE', 'Smaltimento solventi', 'Rifiuti edili inerti'],
}

const expenseTypeOptions = [
  { value: 'MATERIAL', label: '🧱 Materiale' },
  { value: 'LABOR', label: '👷 Manodopera' },
  { value: 'TRANSPORT', label: '🚛 Trasporto' },
  { value: 'EQUIPMENT', label: '🔧 Attrezzatura' },
  { value: 'ADMIN', label: '📋 Amministrativo' },
  { value: 'OTHER', label: '📦 Altro' },
]

const paymentStatusOptions = [
  { value: 'PENDING', label: 'In attesa' },
  { value: 'PAID', label: 'Pagata' },
  { value: 'PARTIALLY_PAID', label: 'Pagata parzialmente' },
]

const currencyOptions = [
  { value: 'CHF', label: 'CHF — Franco svizzero' },
  { value: 'EUR', label: 'EUR — Euro' },
]

// --- Supplier geocoordinates ---
const SUPPLIER_COORDS: { name: string; lat: number; lon: number }[] = [
  { name: 'Bauhaus Lugano', lat: 46.0165, lon: 8.9235 },
  { name: 'Bauhaus Losone', lat: 46.1707, lon: 8.7401 },
  { name: 'Jumbo Grancia', lat: 45.9873, lon: 8.9381 },
  { name: 'Sanitas Troesch Lugano', lat: 46.0096, lon: 8.9516 },
  { name: 'Bagno Design Lugano', lat: 46.0048, lon: 8.9497 },
  { name: 'IKEA Lugano (Grancia)', lat: 45.9873, lon: 8.9381 },
  { name: 'Migros Bricolage (Do it + Garden) Lugano', lat: 46.0165, lon: 8.9235 },
  { name: 'Tecnomat Lugano', lat: 46.0165, lon: 8.9235 },
  { name: 'Holcim (Svizzera) SA – Bedano', lat: 46.0441, lon: 8.9312 },
  { name: 'Silvestri Legnami SA', lat: 45.9936, lon: 8.9385 },
  { name: 'Coloreria Professionale Lugano', lat: 46.0048, lon: 8.9497 },
  { name: 'Sanitairsystem Ticino', lat: 46.1415, lon: 8.9116 },
  { name: 'Edile Rusconi SA', lat: 46.1726, lon: 8.7864 },
  { name: 'Leroy Merlin Como', lat: 45.8175, lon: 9.0700 },
  { name: 'Castorama Como', lat: 45.8120, lon: 9.0750 },
  { name: 'Tecnomat – Fino Mornasco (CO)', lat: 45.7635, lon: 9.0832 },
  { name: 'Bricoman Como', lat: 45.8055, lon: 9.0840 },
  { name: 'Brico Center Varese', lat: 45.8280, lon: 8.8368 },
  { name: 'Gamma Varese', lat: 45.8290, lon: 8.8420 },
  { name: 'Ceramiche Supergres – Varese', lat: 45.8203, lon: 8.8257 },
  { name: 'Knauf Italia – Cadorago (CO)', lat: 45.7166, lon: 9.0022 },
]

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function detectCountry(lat: number, lon: number): 'CH' | 'IT' | null {
  // Switzerland rough bounding box: lat 45.82–47.81, lon 5.96–10.49
  // Italy (north): lat 43.5–47.1, lon 6.6–13.8
  // Simple heuristic for Ticino area:
  if (lat > 46.0 && lat < 47.8 && lon > 6.0 && lon < 10.5) return 'CH'
  if (lat >= 45.6 && lat <= 46.1 && lon >= 8.4 && lon <= 9.4) {
    // Border area — use phone country code approach: Ticino CH border ~45.82
    return lat > 45.82 ? 'CH' : 'IT'
  }
  if (lat < 47.0 && lon > 6.0 && lon < 14.0) return 'IT'
  return null
}

// --- Submit button ---
function SubmitButton({ label, uploading }: { label: string; uploading?: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" loading={pending || uploading}>
      {uploading ? 'Caricamento foto...' : label}
    </Button>
  )
}

// --- Props ---
interface Props {
  action: (prevState: ExpenseFormState, formData: FormData) => Promise<ExpenseFormState>
  expense?: {
    projectId?: string | null; supplierId?: string | null; expenseType: string; paymentStatus: string
    description: string; amount: number; currency: string
    amountChf?: number | null; exchangeRate?: number | null
    exchangeRateUpdatedAt?: Date | string | null; isItalianPurchase?: boolean | null
    date: Date; notes?: string | null
  }
  projects: ProjectOption[]
  suppliers: SupplierOption[]
  title: string
  backHref: string
  isEdit?: boolean
  defaultEurChfRate?: number
  eurChfRateUpdatedAt?: Date | string | null
  shoppingListItemId?: string | null
}

// --- Component ---
export function ExpenseForm({
  action,
  expense,
  projects,
  suppliers: initialSuppliers,
  title,
  backHref,
  isEdit,
  defaultEurChfRate = 0.9119,
  eurChfRateUpdatedAt,
  shoppingListItemId,
}: Props) {
  const { toastError, toaster } = useToast()
  const [state, formAction] = useActionState(action, null)
  const router = useRouter()
  const e = state?.errors ?? {}

  // Receipt
  const cameraRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  // Tipo
  const [expenseType, setExpenseType] = useState(expense?.expenseType ?? 'MATERIAL')

  // Description
  const [description, setDescription] = useState(expense?.description ?? '')
  const descKey = `${expenseType}:`
  const descSuggestions = DESCRIPTIONS[descKey] ?? []

  // Currency & exchange rate
  const [currency, setCurrency] = useState(expense?.currency ?? 'CHF')
  const [isItalianPurchase, setIsItalianPurchase] = useState(Boolean(expense?.isItalianPurchase) || expense?.currency === 'EUR')
  const [amount, setAmount] = useState(String(expense?.amount ?? ''))
  const [exchangeRate, setExchangeRate] = useState<number | null>(expense?.exchangeRate ?? null)
  const [amountChf, setAmountChf] = useState<number | null>(expense?.amountChf ?? null)
  const rateDate = expense?.exchangeRateUpdatedAt ?? eurChfRateUpdatedAt ?? null
  const rateDateLabel = rateDate
    ? new Intl.DateTimeFormat('it-CH', { month: 'long', year: 'numeric' }).format(new Date(rateDate))
    : 'maggio 2026'

  // Suppliers
  const [suppliers, setSuppliers] = useState<SupplierOption[]>(initialSuppliers)
  const [selectedSupplierId, setSelectedSupplierId] = useState(expense?.supplierId ?? '')
  const [showNewSupplier, setShowNewSupplier] = useState(false)
  const [newSupplierName, setNewSupplierName] = useState('')
  const [newSupplierVat, setNewSupplierVat] = useState('')
  const [newSupplierCountry, setNewSupplierCountry] = useState('')
  const [supplierPending, startSupplierTransition] = useTransition()

  // Geolocation
  const [nearestSupplier, setNearestSupplier] = useState<{ name: string; km: number } | null>(null)
  const [geoError, setGeoError] = useState(false)
  const [geoLoading, setGeoLoading] = useState(false)

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) { setGeoError(true); return }
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLoading(false)
        const { latitude, longitude } = pos.coords

        // Detect country â†’ pre-fill currency
        if (!expense?.currency) {
          const country = detectCountry(latitude, longitude)
          if (country === 'CH') setCurrency('CHF')
          else if (country === 'IT') setCurrency('EUR')
        }

        // Find nearest supplier (max 25km)
        let minDist = Infinity
        let nearest: { name: string; km: number } | null = null
        for (const s of SUPPLIER_COORDS) {
          const km = haversineKm(latitude, longitude, s.lat, s.lon)
          if (km < minDist) { minDist = km; nearest = { name: s.name, km: Math.round(km * 10) / 10 } }
        }
        if (nearest && nearest.km <= 25) setNearestSupplier(nearest)
      },
      () => { setGeoLoading(false); setGeoError(true) },
      { timeout: 8000 },
    )
  }, [expense?.currency])

  // Auto-request location on mount (no-op if already denied)
  useEffect(() => {
    if (!isEdit) requestLocation()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function recalcAmountChf(rate: number) {
    const n = parseFloat(amount)
    if (!isNaN(n) && rate) setAmountChf(Math.round(n * rate * 100) / 100)
  }

  useEffect(() => {
    if (!state?.createdId) return
    const id = state.createdId
    if (pendingFile) {
      queueMicrotask(() => setUploading(true))
      const fd = new FormData()
      fd.append('file', pendingFile)
      fd.append('expenseId', id)
      uploadExpenseReceipt(fd).finally(() => { setUploading(false); router.push(`/expenses/${id}`) })
    } else {
      router.push(`/expenses/${id}`)
    }
  }, [state?.createdId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (currency !== 'EUR') {
      if (!expense?.currency || expense.currency !== 'EUR') queueMicrotask(() => { setExchangeRate(null); setAmountChf(null) })
      return
    }
    if (expense?.exchangeRate && !exchangeRate) {
      queueMicrotask(() => { setExchangeRate(expense.exchangeRate ?? null); recalcAmountChf(expense.exchangeRate ?? 0) })
      return
    }
    if (!exchangeRate) queueMicrotask(() => { setExchangeRate(defaultEurChfRate); recalcAmountChf(defaultEurChfRate) })
  }, [currency]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleAmountChange(val: string) {
    setAmount(val)
    if (currency === 'EUR' && exchangeRate) {
      const n = parseFloat(val)
      setAmountChf(!isNaN(n) ? Math.round(n * exchangeRate * 100) / 100 : null)
    }
  }

  function handleRateChange(val: string) {
    const rate = parseFloat(val)
    if (!isNaN(rate)) { setExchangeRate(rate); recalcAmountChf(rate) }
    else { setExchangeRate(null); setAmountChf(null) }
  }

  function handleAddSupplier() {
    if (!newSupplierName.trim()) return
    startSupplierTransition(async () => {
      const result = await createSupplierQuick(newSupplierName.trim(), newSupplierVat.trim() || undefined, newSupplierCountry.trim() || undefined)
      if ('error' in result) { toastError(result.error); return }
      setSuppliers(prev => [...prev, { id: result.id, name: result.name }])
      setSelectedSupplierId(result.id)
      setShowNewSupplier(false)
      setNewSupplierName(''); setNewSupplierVat(''); setNewSupplierCountry('')
    })
  }

  function applyNearestSupplier() {
    if (!nearestSupplier) return
    const found = suppliers.find((s) => s.name.toLowerCase().includes(nearestSupplier.name.toLowerCase().split(' ')[0]))
    if (found) setSelectedSupplierId(found.id)
    setNearestSupplier(null)
  }

  return (
    <>
      {toaster}
      <form action={formAction}>
      {shoppingListItemId && <input type="hidden" name="shoppingListItemId" value={shoppingListItemId} />}
      <input type="hidden" name="isItalianPurchase" value={isItalianPurchase ? 'on' : ''} />
      {currency === 'EUR' && exchangeRate && (
        <>
          <input type="hidden" name="amountChf" value={amountChf ?? ''} />
          <input type="hidden" name="exchangeRate" value={exchangeRate} />
          <input type="hidden" name="exchangeRateUpdatedAt" value={rateDate ? new Date(rateDate).toISOString() : '2026-05-22T00:00:00.000Z'} />
        </>
      )}

      <Card>
        <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
        <CardContent className="space-y-4">

          {/* Geolocation banner */}
          {nearestSupplier && !selectedSupplierId && (
            <div className="flex items-center gap-3 px-3 py-2.5 bg-action-surface border border-action-border rounded-surface text-body">
              <Navigation className="w-4 h-4 text-action shrink-0" />
              <span className="flex-1 text-action">
                Sei vicino a <strong>{nearestSupplier.name}</strong> ({nearestSupplier.km} km) — vuoi selezionarlo?
              </span>
              <button type="button" onClick={applyNearestSupplier} className="tap-target shrink-0 rounded-control bg-action px-3 text-label text-ink-inverse transition-colors duration-state hover:bg-action-hover">Sì</button>
              <button type="button" onClick={() => setNearestSupplier(null)} aria-label="Ignora il suggerimento" className="tap-target inline-flex shrink-0 items-center justify-center rounded-control text-ink-muted hover:text-ink"><X className="w-3.5 h-3.5" /></button>
            </div>
          )}

          {/* Twenty-one fields in one undivided run meant reading all of them to
              find the four that matter. Grouped by the question each answers:
              what was bought, what it cost, what proves it. */}
          <FormSection title="Cosa" description="A quale opera appartiene e da chi arriva">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Project */}
            <div className="md:col-span-2">
              <Select
                name="projectId"
                label="Opera / Progetto"
                options={[{ value: '', label: '— Spesa aziendale (nessun progetto) —' }, ...projects.map((p) => ({ value: p.id, label: `${p.client.name} — ${p.name}` }))]}
                defaultValue={expense?.projectId ?? ''}
              />
              <p className="text-label text-ink-muted mt-1">Lascia vuoto per spese aziendali non legate a un progetto</p>
            </div>

            {/* Supplier with geolocation + inline creation */}
            <div className="md:col-span-2">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Select
                    name="supplierId"
                    label="Fornitore"
                    options={[{ value: '', label: 'Nessuno' }, ...suppliers.map((s) => ({ value: s.id, label: s.name }))]}
                    value={selectedSupplierId}
                    onChange={ev => setSelectedSupplierId(ev.target.value)}
                  />
                </div>
                {!geoError && (
                  <button type="button" onClick={requestLocation} aria-label="Rileva posizione per suggerire fornitore"
                    className="tap-target flex shrink-0 items-center justify-center rounded-control border border-action-border bg-action-surface text-action transition-colors duration-state hover:bg-action-surface/70">
                    {geoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                  </button>
                )}
                <button type="button" onClick={() => setShowNewSupplier(v => !v)}
                  aria-label={showNewSupplier ? 'Annulla il nuovo fornitore' : 'Aggiungi un fornitore'}
                  className="tap-target flex shrink-0 items-center justify-center rounded-control border border-line-strong bg-surface text-ink-muted transition-colors duration-state hover:bg-surface-raised hover:text-ink">
                  {showNewSupplier ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </button>
              </div>
              {showNewSupplier && (
                <div className="mt-2 space-y-2 rounded-control border border-line bg-surface-raised p-3">
                  <p className="text-label font-medium text-ink-muted">Nuovo fornitore</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <Input label="Nome *" value={newSupplierName} onChange={ev => setNewSupplierName(ev.target.value)} placeholder="Nome fornitore" />
                    <Input label="P.IVA" value={newSupplierVat} onChange={ev => setNewSupplierVat(ev.target.value)} placeholder="Partita IVA" />
                    <Input label="Paese" value={newSupplierCountry} onChange={ev => setNewSupplierCountry(ev.target.value)} placeholder="es. IT, CH" />
                  </div>
                  <Button type="button" size="sm" onClick={handleAddSupplier} loading={supplierPending} disabled={!newSupplierName.trim()}>Aggiungi</Button>
                </div>
              )}
            </div>

            {/* Tipo spesa */}
            <Select
              name="expenseType"
              label="Tipo spesa"
              options={expenseTypeOptions}
              value={expenseType}
              onChange={(ev) => setExpenseType(ev.target.value)}
            />

            <label className="mt-6 flex min-h-11 cursor-pointer items-center gap-2 rounded-control border border-line bg-surface-raised px-3 text-body text-ink">
              <input
                type="checkbox"
                checked={isItalianPurchase}
                onChange={(ev) => {
                  const checked = ev.target.checked
                  setIsItalianPurchase(checked)
                  if (checked) setCurrency('EUR')
                  else if (currency === 'EUR') setCurrency('CHF')
                }}
                className="rounded border-line-strong"
              />
              Acquisto in Italia
            </label>

            {/* Descrizione con suggerimenti */}
            <div className="md:col-span-2">
              <label className="block text-body font-medium text-ink mb-1">
                Descrizione <span className="text-negative">*</span>
              </label>
              <input
                name="description"
                list="desc-suggestions"
                value={description}
                onChange={(ev) => setDescription(ev.target.value)}
                required
                placeholder={descSuggestions.length > 0 ? 'Inizia a digitare o scegli un suggerimento…' : 'Descrizione spesa…'}
                className="min-h-11 w-full rounded-control border border-line-strong px-3 text-body outline-none focus:border-action focus:ring-1 focus:ring-action"
                autoComplete="off"
              />
              {descSuggestions.length > 0 && (
                <datalist id="desc-suggestions">
                  {descSuggestions.map((d) => <option key={d} value={d} />)}
                </datalist>
              )}
              {e.description && <p className="text-label text-negative mt-1">{e.description[0]}</p>}
            </div>

          </div>
          </FormSection>

          <FormSection title="Quanto" description="Importo, valuta e stato del pagamento">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input name="amount" label="Importo" type="number" step="0.01" min="0" required
                value={amount} onChange={ev => handleAmountChange(ev.target.value)} error={e.amount?.[0]} />
            </div>
            <div>
              <Select
                name="currency"
                label="Valuta"
                options={currencyOptions}
                value={currency}
                onChange={(ev) => {
                  setCurrency(ev.target.value)
                  if (ev.target.value === 'EUR') setIsItalianPurchase(true)
                }}
              />
              {currency === 'CHF' && (
                <p className="mt-1 text-label text-ink-muted">Rilevato: Svizzera</p>
              )}
            </div>

            {/* EUR conversion */}
            {currency === 'EUR' && (
              <>
                <div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Input label="Cambio EUR → CHF" type="number" step="0.0001"
                        value={exchangeRate ?? ''} onChange={ev => handleRateChange(ev.target.value)} placeholder="es. 0.9500" />
                    </div>
                  </div>
                  <p className="text-label text-ink-muted mt-1">Cambio da impostazioni, aggiornato: {rateDateLabel}</p>
                </div>
                <div className="flex items-end">
                  <div className="w-full rounded-control border border-line bg-surface-raised px-3 py-2">
                    <p className="mb-0.5 text-label text-ink-muted">Equivalente CHF</p>
                    <p className="font-semibold text-ink numeric">
                      {amountChf != null ? `≈ CHF ${amountChf.toFixed(2)}` : '—'}
                    </p>
                  </div>
                </div>
                <div className="md:col-span-2 text-label text-attention bg-attention-surface border border-attention-border rounded-control px-3 py-2">
                  Acquisto Italia: valuta impostata in EUR e conversione CHF calcolata con il cambio salvato nelle impostazioni.
                </div>
              </>
            )}

            <Input name="date" label="Data" type="date" required defaultValue={formatDateInput(expense?.date) || formatDateInput(new Date())} />
            <Select name="paymentStatus" label="Stato pagamento" options={paymentStatusOptions} defaultValue={expense?.paymentStatus ?? 'PAID'} />
          </div>
          </FormSection>

          <FormSection title="Prova e note" description="Lo scontrino e qualsiasi cosa vada ricordata">
          <Textarea name="notes" label="Note" defaultValue={expense?.notes ?? ''} rows={2} />

          {!isEdit && (
            <div className="mt-4">
              <p className="mb-2 text-body font-medium text-ink">Foto / documento fattura (opzionale)</p>
              {pendingFile ? (
                <div className="flex items-center gap-2 p-2 rounded-control border border-positive-border bg-positive-surface">
                  <Paperclip className="w-4 h-4 text-positive shrink-0" />
                  <span className="text-body text-positive truncate flex-1">{pendingFile.name}</span>
                  <button type="button" onClick={() => setPendingFile(null)} aria-label="Rimuovi il file allegato" className="tap-target inline-flex shrink-0 items-center justify-center rounded-control text-ink-muted hover:text-negative"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button type="button" onClick={() => cameraRef.current?.click()}
                    className="tap-target flex items-center gap-2 rounded-control bg-action px-3 text-body font-medium text-ink-inverse transition-colors duration-state hover:bg-action-hover">
                    <Camera className="w-4 h-4" /><span>Scatta foto</span>
                  </button>
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="tap-target flex items-center gap-2 rounded-control border border-line-strong bg-surface px-3 text-body font-medium text-ink transition-colors duration-state hover:bg-surface-raised">
                    <Paperclip className="w-4 h-4" /><span>Allega file</span>
                  </button>
                </div>
              )}
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={ev => handleFileSelected(ev.target.files)} />
              <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.heic" className="hidden" onChange={ev => handleFileSelected(ev.target.files)} />
            </div>
          )}
          </FormSection>
        </CardContent>

        <CardFooter className="flex justify-between">
          <ButtonLink href={backHref} variant="secondary">Annulla</ButtonLink>
          <SubmitButton label={isEdit ? 'Salva modifiche' : 'Registra spesa'} uploading={uploading} />
        </CardFooter>
      </Card>
      </form>
    </>
  )

  function handleFileSelected(files: FileList | null) {
    if (!files || files.length === 0) return
    setPendingFile(files[0])
  }
}
