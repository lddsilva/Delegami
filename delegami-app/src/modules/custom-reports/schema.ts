import { z } from 'zod'

const headingBlock = z.object({
  type: z.literal('heading'),
  level: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  text: z.string().min(1),
})

const paragraphBlock = z.object({
  type: z.literal('paragraph'),
  text: z.string().min(1),
})

const listBlock = z.object({
  type: z.literal('list'),
  ordered: z.boolean().optional(),
  items: z.array(z.string()).min(1),
})

const tableBlock = z.object({
  type: z.literal('table'),
  columns: z.array(z.string()).min(1),
  rows: z.array(z.array(z.union([z.string(), z.number(), z.null()]))).min(1),
  align: z.array(z.enum(['left', 'right', 'center'])).optional(),
  title: z.string().optional(),
})

const calloutBlock = z.object({
  type: z.literal('callout'),
  variant: z.enum(['info', 'warning', 'success', 'danger']).optional(),
  text: z.string().min(1),
  title: z.string().optional(),
})

const diagramBlock = z.object({
  type: z.literal('diagram'),
  text: z.string().min(1),
})

const keyValueBlock = z.object({
  type: z.literal('keyValue'),
  items: z.array(z.object({ label: z.string(), value: z.string() })).min(1),
})

const dividerBlock = z.object({
  type: z.literal('divider'),
})

export const reportBlockSchema = z.discriminatedUnion('type', [
  headingBlock,
  paragraphBlock,
  listBlock,
  tableBlock,
  calloutBlock,
  diagramBlock,
  keyValueBlock,
  dividerBlock,
])

export type ReportBlock = z.infer<typeof reportBlockSchema>

export const REPORT_TYPES = ['eletrico', 'hidraulico', 'strutturale', 'termico', 'altro'] as const
export type ReportTypeValue = typeof REPORT_TYPES[number]
