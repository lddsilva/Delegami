import type { ReportBlock } from '@/modules/custom-reports/schema'

const STYLES = {
  h1: { fontSize: '13pt', fontWeight: 700, color: 'var(--doc-brand)', marginBottom: '4px', marginTop: '14px', borderBottom: '2px solid var(--doc-brand)', paddingBottom: '3px' } as React.CSSProperties,
  h2: { fontSize: '11pt', fontWeight: 700, color: 'var(--doc-ink-strong)', marginTop: '12px', marginBottom: '4px' } as React.CSSProperties,
  h3: { fontSize: '10pt', fontWeight: 700, color: 'var(--doc-ink-strong)', marginTop: '10px', marginBottom: '3px' } as React.CSSProperties,
  p: { fontSize: '9.5pt', lineHeight: 1.55, color: 'var(--doc-ink-strong)', margin: '5px 0', whiteSpace: 'pre-wrap' as const } as React.CSSProperties,
  ul: { paddingLeft: '20px', margin: '5px 0' } as React.CSSProperties,
  li: { fontSize: '9.5pt', lineHeight: 1.55, color: 'var(--doc-ink-strong)', marginBottom: '3px' } as React.CSSProperties,
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: '9pt', margin: '8px 0 12px' } as React.CSSProperties,
  tableTitle: { fontSize: '8.5pt', fontWeight: 600, color: 'var(--doc-ink-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.04em', margin: '8px 0 3px' } as React.CSSProperties,
  th: { background: 'var(--doc-brand)', color: 'var(--doc-paper)', padding: '4px 7px', textAlign: 'left' as const, fontWeight: 600, fontSize: '8.5pt' } as React.CSSProperties,
  td: { padding: '4px 7px', borderBottom: '1px solid var(--doc-line)', fontSize: '9pt', verticalAlign: 'top' as const } as React.CSSProperties,
  diagram: { background: 'var(--doc-fill)', padding: '10px 14px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '8.5pt', lineHeight: 1.55, whiteSpace: 'pre' as const, margin: '8px 0', overflow: 'auto' as const } as React.CSSProperties,
  divider: { border: 'none', borderTop: '1px solid var(--doc-line-strong)', margin: '14px 0' } as React.CSSProperties,
  kvWrap: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', margin: '8px 0 12px' } as React.CSSProperties,
  kvItem: { background: 'var(--doc-fill)', border: '1px solid var(--doc-line)', borderRadius: '4px', padding: '6px 10px' } as React.CSSProperties,
  kvLabel: { fontSize: '7.5pt', textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: 'var(--doc-ink-muted)', marginBottom: '2px' } as React.CSSProperties,
  kvValue: { fontSize: '10pt', fontWeight: 600, color: 'var(--doc-ink)' } as React.CSSProperties,
} as const

const CALLOUT_STYLES: Record<NonNullable<Extract<ReportBlock, { type: 'callout' }>['variant']>, React.CSSProperties> = {
  info: { background: 'var(--doc-accent-soft)', borderLeft: '4px solid var(--doc-accent)' },
  warning: { background: 'var(--doc-warn-soft)', borderLeft: '4px solid var(--doc-warn)' },
  success: { background: 'var(--doc-positive-soft)', borderLeft: '4px solid var(--doc-positive)' },
  danger: { background: 'var(--doc-negative-soft)', borderLeft: '4px solid var(--doc-negative)' },
}

function renderBlock(block: ReportBlock, key: number) {
  switch (block.type) {
    case 'heading': {
      const level = block.level ?? 1
      if (level === 1) return <h2 key={key} style={STYLES.h1}>{block.text}</h2>
      if (level === 2) return <h3 key={key} style={STYLES.h2}>{block.text}</h3>
      return <h4 key={key} style={STYLES.h3}>{block.text}</h4>
    }

    case 'paragraph':
      return <p key={key} style={STYLES.p}>{block.text}</p>

    case 'list': {
      const items = block.items.map((item, i) => <li key={i} style={STYLES.li}>{item}</li>)
      return block.ordered
        ? <ol key={key} style={STYLES.ul}>{items}</ol>
        : <ul key={key} style={STYLES.ul}>{items}</ul>
    }

    case 'table': {
      const align = block.align ?? []
      return (
        <div key={key}>
          {block.title && <p style={STYLES.tableTitle}>{block.title}</p>}
          <table style={STYLES.table}>
            <thead>
              <tr>
                {block.columns.map((col, i) => (
                  <th key={i} style={{ ...STYLES.th, textAlign: align[i] ?? 'left' }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr key={ri} style={{ background: ri % 2 ? 'var(--doc-fill)' : 'var(--doc-paper)' }}>
                  {row.map((cell, ci) => (
                    <td key={ci} style={{ ...STYLES.td, textAlign: align[ci] ?? 'left' }}>
                      {cell === null || cell === undefined ? '' : String(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }

    case 'callout': {
      const variant = block.variant ?? 'info'
      const base: React.CSSProperties = {
        ...CALLOUT_STYLES[variant],
        padding: '8px 12px',
        margin: '10px 0',
        fontSize: '9.5pt',
        lineHeight: 1.5,
        borderRadius: '0 4px 4px 0',
      }
      return (
        <div key={key} style={base}>
          {block.title && <p style={{ fontWeight: 700, margin: '0 0 4px' }}>{block.title}</p>}
          <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{block.text}</p>
        </div>
      )
    }

    case 'diagram':
      return <div key={key} style={STYLES.diagram}>{block.text}</div>

    case 'keyValue':
      return (
        <div key={key} style={STYLES.kvWrap}>
          {block.items.map((kv, i) => (
            <div key={i} style={STYLES.kvItem}>
              <div style={STYLES.kvLabel}>{kv.label}</div>
              <div style={STYLES.kvValue}>{kv.value}</div>
            </div>
          ))}
        </div>
      )

    case 'divider':
      return <hr key={key} style={STYLES.divider} />
  }
}

export function ReportBlocks({ blocks }: { blocks: ReportBlock[] }) {
  return <>{blocks.map((block, i) => renderBlock(block, i))}</>
}
