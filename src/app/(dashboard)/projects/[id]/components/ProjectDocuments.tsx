'use client'

import { useState, useTransition } from 'react'
import { FileText, ExternalLink, Trash2, Eye, EyeOff } from 'lucide-react'

import {
  addProjectDocument,
  deleteProjectDocument,
  setDocumentVisibility,
} from '../documents.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

export interface ProjectDocumentItem {
  id: string
  title: string
  url: string
  description: string | null
  isVisibleToTeam: boolean
}

export function ProjectDocuments({
  projectId,
  canManage,
  documents,
}: {
  projectId: string
  /** Admin or project manager — can add docs and control visibility. */
  canManage: boolean
  documents: ProjectDocumentItem[]
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function add(formData: FormData) {
    setError(null)
    startTransition(async () => {
      try {
        await addProjectDocument({
          projectId,
          title: formData.get('title') as string,
          url: formData.get('url') as string,
          description: (formData.get('description') as string) || undefined,
          isVisibleToTeam: formData.get('isVisibleToTeam') === 'on',
        })
      } catch (addError) {
        setError(addError instanceof Error ? addError.message : 'Failed to add document.')
      }
    })
  }

  function toggle(documentId: string, next: boolean) {
    setError(null)
    startTransition(async () => {
      try {
        await setDocumentVisibility(documentId, next)
      } catch (toggleError) {
        setError(toggleError instanceof Error ? toggleError.message : 'Failed to update.')
      }
    })
  }

  function remove(documentId: string, title: string) {
    if (!window.confirm(`Remove document "${title}"?`)) return
    setError(null)
    startTransition(async () => {
      try {
        await deleteProjectDocument(documentId)
      } catch (removeError) {
        setError(removeError instanceof Error ? removeError.message : 'Failed to remove.')
      }
    })
  }

  return (
    <div className="bg-card rounded-xl border p-6 lg:col-span-2">
      <h2 className="mb-1 text-lg font-semibold">Documents ({documents.length})</h2>
      <p className="text-muted-foreground mb-4 text-xs">
        {canManage
          ? 'Share requirement docs (Drive/Docs links). Toggle team visibility per document.'
          : 'Project reference documents shared with the team.'}
      </p>

      {documents.length === 0 ? (
        <p className="text-muted-foreground text-sm">No documents shared yet.</p>
      ) : (
        <ul className="divide-y">
          {documents.map((doc) => (
            <li key={doc.id} className="flex items-center justify-between gap-3 py-3">
              <div className="flex min-w-0 items-start gap-3">
                <FileText className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
                <div className="min-w-0">
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm font-medium hover:underline"
                  >
                    {doc.title}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  {doc.description ? (
                    <p className="text-muted-foreground text-xs">{doc.description}</p>
                  ) : null}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Badge
                  variant="outline"
                  className={
                    doc.isVisibleToTeam
                      ? 'border-green-200 bg-green-100 text-green-700'
                      : 'border-gray-200 bg-gray-100 text-gray-600'
                  }
                >
                  {doc.isVisibleToTeam ? 'Team' : 'Managers only'}
                </Badge>

                {canManage ? (
                  <>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={pending}
                      onClick={() => toggle(doc.id, !doc.isVisibleToTeam)}
                      aria-label={doc.isVisibleToTeam ? 'Hide from team' : 'Show to team'}
                    >
                      {doc.isVisibleToTeam ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={pending}
                      onClick={() => remove(doc.id, doc.title)}
                      aria-label="Remove document"
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      {canManage ? (
        <form action={add} className="mt-5 flex flex-col gap-3 border-t pt-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="doc-title">Title</Label>
              <Input id="doc-title" name="title" placeholder="Requirement spec" required />
            </div>
            <div>
              <Label htmlFor="doc-url">Link</Label>
              <Input
                id="doc-url"
                name="url"
                type="url"
                placeholder="https://docs.google.com/…"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="doc-desc">Description (optional)</Label>
            <Input id="doc-desc" name="description" placeholder="Short note" />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isVisibleToTeam" className="h-4 w-4" />
            Visible to the whole project team
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="flex justify-end">
            <Button type="submit" disabled={pending} size="sm">
              Add document
            </Button>
          </div>
        </form>
      ) : error ? (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      ) : null}
    </div>
  )
}
