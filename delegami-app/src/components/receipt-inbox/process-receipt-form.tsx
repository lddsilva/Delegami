'use client'

import { useActionState, useState, useTransition } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { AlertCircle, CheckCircle2, Sparkles } from 'lucide-react'
import type {
  ProcessReceiptState,
  ReceiptAnalysisResult,
  ReceiptAnalysisSuggestion,
} from '@/modules/receipt-inbox/actions'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDateInput } from '@/lib/utils'

interface ProjectOption { id: string; name: string; client: { name: string } }
interface SupplierOption { id: string; name: string }

interface Props {
  action: (prevState: ProcessReceiptState, formData: FormData) => Promise<ProcessReceiptState>
  analyzeAction?: () => Promise<ReceiptAnalysisResult>
  projects: ProjectOption[]
  suppliers: SupplierOption[]
  defaultEurChfRate?: number
  eurChfRateUpdatedAt?: Date | string | null
  defaultProjectId?: string | null
}

const expenseTypeOptions = [
  { value: 'MATERIAL', label: 'Materiale' },
  { value: 'LABOR', label: 'Manodopera' },
  { value: 'TRANSPORT', label: 'Trasporto' },
  { value: 'EQUIPMENT', label: 'Attrezzatura' },
  { value: 'ADMIN', label: 'Amministrativo' },
  { value: 'OTHER', label: 'Altro' },
]

const paymentStatusOptions = [
  { value: 'PAID', label: 'Pagata' },
  { value: 'PENDING', label: 'In attesa' },
  { value: 'PARTIALLY_PAID', label: 'Pagata parzialmente' },
]

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" loading={pending}>
      {pending ? 'Salvataggio...' : 'Registra spesa'}
    </Button>
  )
}

function formatAmountInput(amount: number) {
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2)
}

function roundCurrency(amount: number) {
  return Math.round(amount * 100) / 100
}

export function ProcessReceiptForm({
  action,
  analyzeAction,
  projects,
  suppliers,
  defaultEurChfRate = 0.9119,
  eurChfRateUpdatedAt,
  defaultProjectId,
}: Props) {
  const [state, formAction] = useActionState(action, null)
  const e = state?.errors ?? {}

  const [analysisPending, startAnalysisTransition] = useTransition()
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [analysisMessage, setAnalysisMessage] = useState<string | null>(null)

  const [expenseType, setExpenseType] = useState('MATERIAL')
  const [paymentStatus, setPaymentStatus] = useState('PAID')
  const [description, setDescription] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [currency, setCurrency] = useState('CHF')
  const [isItalianPurchase, setIsItalianPurchase] = useState(false)
  const [amount, setAmount] = useState('')
  const [amountChf, setAmountChf] = useState<number | null>(null)
  const [date, setDate] = useState(formatDateInput(new Date()))
  const [notes, setNotes] = useState('')

  const rateLabel = eurChfRateUpdatedAt
    ? new Intl.DateTimeFormat('it-CH', { month: 'long', year: 'numeric' }).format(new Date(eurChfRateUpdatedAt))
    : 'maggio 2026'

  function recalc(val: string) {
    const n = parseFloat(val)
    if (!isNaN(n) && defaultEurChfRate) setAmountChf(roundCurrency(n * defaultEurChfRate))
  }

  function applyAnalysis(suggestion: ReceiptAnalysisSuggestion) {
    const nextCurrency = suggestion.currency ?? currency
    const nextItalian = suggestion.isItalianPurchase ?? nextCurrency === 'EUR'

    if (suggestion.description) setDescription(suggestion.description)
    if (suggestion.expenseType) setExpenseType(suggestion.expenseType)
    if (suggestion.paymentStatus) setPaymentStatus(suggestion.paymentStatus)
    if (suggestion.supplierId) setSupplierId(suggestion.supplierId)
    if (suggestion.currency) setCurrency(suggestion.currency)
    if (suggestion.isItalianPurchase != null || nextCurrency === 'EUR') setIsItalianPurchase(nextItalian)
    if (suggestion.date) setDate(suggestion.date)
    if (suggestion.notes) {
      setNotes((current) => current.trim() ? `${current.trim()}\n${suggestion.notes}` : suggestion.notes ?? '')
    }
    if (suggestion.amount != null) {
      const nextAmount = formatAmountInput(suggestion.amount)
      setAmount(nextAmount)
      if (nextItalian || nextCurrency === 'EUR') setAmountChf(roundCurrency(suggestion.amount * defaultEurChfRate))
      else setAmountChf(null)
    }

    const parts = [
      suggestion.matchedSupplierName ? `fornitore: ${suggestion.matchedSupplierName}` : null,
      `${Math.round(suggestion.confidence * 100)}%`,
    ].filter(Boolean)
    setAnalysisMessage(parts.length > 0 ? `Dati suggeriti applicati (${parts.join(' - ')}).` : 'Dati suggeriti applicati.')
  }

  function handleAnalyze() {
    if (!analyzeAction || analysisPending) return
    setAnalysisError(null)
    setAnalysisMessage(null)
    startAnalysisTransition(async () => {
      const result = await analyzeAction()
      if (result.error || !result.data) {
        setAnalysisError(result.error ?? 'Analisi IA non riuscita.')
        return
      }
      applyAnalysis(result.data)
    })
  }

  const showEur = isItalianPurchase || currency === 'EUR'

  return (
    <form action={formAction} className="space-y-4">
      {state?.message && (
        <div className="rounded-control border border-negative-border bg-negative-surface px-4 py-3 text-body text-negative">
          {state.message}
        </div>
      )}

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-body">Dati spesa</CardTitle>
            {analyzeAction && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                loading={analysisPending}
                onClick={handleAnalyze}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Analizza foto
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {analysisError && (
            <div className="flex items-center gap-2 rounded-control border border-negative-border bg-negative-surface px-3 py-2.5 text-body text-negative">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {analysisError}
            </div>
          )}
          {analysisMessage && (
            <div className="flex items-center gap-2 rounded-control border border-positive-border bg-positive-surface px-3 py-2.5 text-body text-positive">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {analysisMessage}
            </div>
          )}

          <div>
            <label className="mb-1 block text-body font-medium text-ink">Opera</label>
            <select
              name="projectId"
              defaultValue={defaultProjectId ?? ''}
              className="w-full rounded-control border border-line bg-surface px-3 py-2 text-body outline-none focus:border-action"
            >
              <option value="">Spesa aziendale (nessuna opera)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.client.name} - {p.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-body font-medium text-ink">Tipo</label>
              <select
                name="expenseType"
                value={expenseType}
                onChange={(ev) => setExpenseType(ev.target.value)}
                className="w-full rounded-control border border-line bg-surface px-3 py-2 text-body outline-none focus:border-action"
              >
                {expenseTypeOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              {e.expenseType && <p className="mt-1 text-label text-negative">{e.expenseType[0]}</p>}
            </div>
            <div>
              <label className="mb-1 block text-body font-medium text-ink">Pagamento</label>
              <select
                name="paymentStatus"
                value={paymentStatus}
                onChange={(ev) => setPaymentStatus(ev.target.value)}
                className="w-full rounded-control border border-line bg-surface px-3 py-2 text-body outline-none focus:border-action"
              >
                {paymentStatusOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-body font-medium text-ink">Descrizione</label>
            <Input
              name="description"
              placeholder="Es. Acquisto piastrelle gres 60x60"
              value={description}
              onChange={(ev) => setDescription(ev.target.value)}
              error={e.description?.[0]}
            />
          </div>

          {suppliers.length > 0 && (
            <div>
              <label className="mb-1 block text-body font-medium text-ink">Fornitore</label>
              <select
                name="supplierId"
                value={supplierId}
                onChange={(ev) => setSupplierId(ev.target.value)}
                className="w-full rounded-control border border-line bg-surface px-3 py-2 text-body outline-none focus:border-action"
              >
                <option value="">Nessun fornitore</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              name="isItalianPurchase"
              checked={isItalianPurchase}
              onChange={(ev) => {
                setIsItalianPurchase(ev.target.checked)
                if (ev.target.checked) {
                  setCurrency('EUR')
                  if (amount) recalc(amount)
                }
              }}
              className="h-4 w-4 rounded border-line-strong"
            />
            <span className="text-body text-ink">Acquisto in Italia (EUR)</span>
          </label>

          {!isItalianPurchase && (
            <div>
              <label className="mb-1 block text-body font-medium text-ink">Valuta</label>
              <select
                name="currency"
                value={currency}
                onChange={(ev) => {
                  setCurrency(ev.target.value)
                  if (ev.target.value === 'EUR' && amount) recalc(amount)
                  if (ev.target.value === 'CHF') setAmountChf(null)
                }}
                className="w-full rounded-control border border-line bg-surface px-3 py-2 text-body outline-none focus:border-action"
              >
                <option value="CHF">CHF - Franco svizzero</option>
                <option value="EUR">EUR - Euro</option>
              </select>
            </div>
          )}
          {isItalianPurchase && (
            <input type="hidden" name="currency" value="EUR" />
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-body font-medium text-ink">
                Importo ({showEur ? 'EUR' : currency})
              </label>
              <Input
                name="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(ev) => {
                  setAmount(ev.target.value)
                  if (showEur) recalc(ev.target.value)
                }}
                placeholder="0.00"
                error={e.amount?.[0]}
              />
            </div>
            {showEur && (
              <div>
                <label className="mb-1 block text-body font-medium text-ink">
                  Equiv. CHF
                  <span className="ml-1 text-label font-normal text-ink-muted">
                    (tasso {rateLabel})
                  </span>
                </label>
                <Input
                  name="amountChf"
                  type="number"
                  step="0.01"
                  min="0"
                  value={amountChf ?? ''}
                  onChange={(ev) => setAmountChf(ev.target.value ? Number(ev.target.value) : null)}
                  placeholder="0.00"
                />
                <input type="hidden" name="exchangeRate" value={defaultEurChfRate} />
                {eurChfRateUpdatedAt && (
                  <input type="hidden" name="exchangeRateUpdatedAt" value={new Date(eurChfRateUpdatedAt).toISOString()} />
                )}
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-body font-medium text-ink">Data</label>
            <Input
              name="date"
              type="date"
              value={date}
              onChange={(ev) => setDate(ev.target.value)}
              error={e.date?.[0]}
            />
          </div>

          <div>
            <label className="mb-1 block text-body font-medium text-ink">Note interne</label>
            <Textarea
              name="notes"
              rows={2}
              placeholder="Note aggiuntive..."
              value={notes}
              onChange={(ev) => setNotes(ev.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <SubmitButton />
        <Link
          href="/receipts"
          className="text-body text-ink-muted transition-colors hover:text-ink"
        >
          Annulla
        </Link>
      </div>
    </form>
  )
}
