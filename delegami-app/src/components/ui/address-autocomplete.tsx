'use client'

import { useEffect, useRef, useState } from 'react'
import { MapPin, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'

type Suggestion = {
  display_name: string
  address?: {
    road?: string
    house_number?: string
    postcode?: string
    city?: string
    town?: string
    village?: string
    country_code?: string
  }
}

interface Props {
  name: string
  label: string
  defaultValue?: string | null
  placeholder?: string
  required?: boolean
  error?: string
  hint?: string
  selectionMode?: 'full' | 'street'
  onAddressSelect?: (selection: {
    address: string
    street: string
    city: string
    postalCode: string
    country: string
    fullAddress: string
  }) => void
}

function addressParts(suggestion: Suggestion) {
  const a = suggestion.address
  if (!a) {
    return {
      street: '',
      city: '',
      postalCode: '',
      country: '',
      fullAddress: suggestion.display_name,
    }
  }
  const street = [a.road, a.house_number].filter(Boolean).join(' ')
  const city = a.city ?? a.town ?? a.village ?? ''
  const postalCode = a.postcode ?? ''
  const country = a.country_code?.toUpperCase() ?? ''
  const cityLine = [postalCode, city].filter(Boolean).join(' ')
  const fullAddress = [street, cityLine, country].filter(Boolean).join(', ') || suggestion.display_name

  return { street, city, postalCode, country, fullAddress }
}

export function AddressAutocomplete({
  name,
  label,
  defaultValue,
  placeholder,
  required,
  error,
  hint,
  selectionMode = 'full',
  onAddressSelect,
}: Props) {
  const [value, setValue] = useState(defaultValue ?? '')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const userEditedRef = useRef(false)

  useEffect(() => {
    if (!userEditedRef.current) return

    if (value.trim().length < 4) {
      return
    }

    const handle = window.setTimeout(() => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      setLoading(true)
      const params = new URLSearchParams({
        q: value,
        format: 'json',
        addressdetails: '1',
        limit: '5',
        countrycodes: 'ch,it',
      })
      fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      })
        .then((response) => response.ok ? response.json() : [])
        .then((data) => {
          if (Array.isArray(data)) {
            setSuggestions(data)
            setOpen(data.length > 0)
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    }, 350)

    return () => window.clearTimeout(handle)
  }, [value])

  return (
    <div className="relative">
      <Input
        name={name}
        label={label}
        required={required}
        value={value}
        onChange={(event) => {
          const next = event.target.value
          userEditedRef.current = true
          setValue(next)
          if (next.trim().length < 4) {
            setSuggestions([])
            setOpen(false)
          } else {
            setOpen(true)
          }
        }}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onBlur={() => setOpen(false)}
        placeholder={placeholder}
        error={error}
        hint={hint}
        autoComplete="street-address"
      />
      <div className="absolute right-3 top-8 text-ink-subtle">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
      </div>
      {open && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-control border border-line bg-surface shadow-xl overflow-hidden">
          {suggestions.map((suggestion) => {
            const parts = addressParts(suggestion)
            const labelText = parts.fullAddress
            return (
              <button
                key={suggestion.display_name}
                type="button"
                className="w-full px-3 py-2 text-left text-body hover:bg-action-surface border-b border-line last:border-0"
                onMouseDown={(event) => {
                  event.preventDefault()
                  const nextValue = selectionMode === 'street' ? parts.street || labelText : labelText
                  userEditedRef.current = false
                  setValue(nextValue)
                  setSuggestions([])
                  setOpen(false)
                  onAddressSelect?.({
                    address: nextValue,
                    street: parts.street,
                    city: parts.city,
                    postalCode: parts.postalCode,
                    country: parts.country,
                    fullAddress: labelText,
                  })
                }}
              >
                <span className="block font-medium text-ink">{labelText}</span>
                <span className="block text-label text-ink-muted truncate">{suggestion.display_name}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
