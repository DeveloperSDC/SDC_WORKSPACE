'use client'

import { useRef, useState, useTransition } from 'react'
import { Send } from 'lucide-react'

import { addTaskComment } from '../../actions'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

export interface TaskCommentItem {
  id: string
  author: string
  content: string
  createdAt: string
}

export function TaskComments({
  taskId,
  comments,
}: {
  taskId: string
  comments: TaskCommentItem[]
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  function submit(formData: FormData) {
    const content = (formData.get('content') as string) ?? ''
    if (!content.trim()) return

    setError(null)
    startTransition(async () => {
      try {
        await addTaskComment(taskId, content)
        formRef.current?.reset()
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : 'Failed to post comment.')
      }
    })
  }

  return (
    <div className="bg-card rounded-xl border p-6">
      <h2 className="mb-4 text-lg font-semibold">Discussion ({comments.length})</h2>

      {comments.length === 0 ? (
        <p className="text-muted-foreground text-sm">No comments yet. Start the conversation.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {comments.map((comment) => (
            <li key={comment.id} className="flex gap-3">
              <div className="bg-muted flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
                <span className="text-xs font-medium">
                  {comment.author.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium">{comment.author}</span>
                  <span className="text-muted-foreground text-xs">{comment.createdAt}</span>
                </div>
                <p className="mt-0.5 text-sm whitespace-pre-wrap">{comment.content}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form ref={formRef} action={submit} className="mt-6 flex flex-col gap-2">
        <Textarea name="content" rows={3} placeholder="Write a comment…" required />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="flex justify-end">
          <Button type="submit" disabled={pending} size="sm" className="gap-1">
            <Send className="h-4 w-4" />
            {pending ? 'Posting…' : 'Post'}
          </Button>
        </div>
      </form>
    </div>
  )
}
