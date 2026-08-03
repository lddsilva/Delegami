// Registry of technical reports. Add a new entry here whenever a new report page is created.
export type ReportType = 'eletrico' | 'hidraulico' | 'strutturale' | 'termico' | 'altro'

export interface ReportEntry {
  id: string
  title: string
  description: string
  type: ReportType
  href: string
  quoteId?: string
  projectId?: string
  createdAt: string // ISO date string
}

/**
 * Hardcoded report pages. Empty on purpose: the previous entries were reports
 * written for one specific client's jobs and were removed with their data.
 * New reports are created through the AI import flow and live in the database.
 */
export const RELATORI_REGISTRY: ReportEntry[] = []
