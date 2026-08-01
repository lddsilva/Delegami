export const MATERIAL_UNITS = [
  'pz',
  'm²',
  'm³',
  'ml',
  'kg',
  't',
  'l',
  'h',
  'set',
  'corpo',
  'sacco',
  'scatola',
  'confezione',
  'rotolo',
  'tubo',
  'lastra',
  'barattolo',
] as const

export const MATERIAL_UNIT_OPTIONS = [...MATERIAL_UNITS, 'Altro'] as const

export function isKnownMaterialUnit(unit: string | null | undefined) {
  return Boolean(unit && (MATERIAL_UNITS as readonly string[]).includes(unit))
}
