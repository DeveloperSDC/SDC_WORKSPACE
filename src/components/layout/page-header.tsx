interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
}

/**
 * Reusable page-level header component.
 * Renders the page title, optional description, and optional action buttons.
 */
export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-muted-foreground mt-1 text-sm">{description}</p>}
      </div>
      {actions && <div className="mt-3 flex items-center gap-2 sm:mt-0">{actions}</div>}
    </div>
  )
}
