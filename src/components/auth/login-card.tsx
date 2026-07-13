'use client'

import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface LoginCardProps {
  error?: string
  callbackUrl: string
}

const ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: 'Invalid employee ID or password.',
  InvalidCredentials: 'Invalid employee ID or password.',
  AccountInactive: 'Your account has been deactivated. Please contact HR.',
  Configuration: 'Authentication is not configured correctly.',
  Default: 'Something went wrong. Please try again.',
}

const DEFAULT_ERROR_MESSAGE = ERROR_MESSAGES['Default'] ?? 'Something went wrong. Please try again.'

export function LoginCard({ error, callbackUrl }: LoginCardProps) {
  const router = useRouter()
  const [employeeId, setEmployeeId] = useState('')
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const errorMessage = formError ?? (error ? (ERROR_MESSAGES[error] ?? DEFAULT_ERROR_MESSAGE) : null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        employeeId,
        password,
        redirect: false,
        callbackUrl,
      })

      if (result?.error) {
        setFormError(ERROR_MESSAGES[result.error] ?? DEFAULT_ERROR_MESSAGE)
        return
      }

      router.push(result?.url ?? callbackUrl)
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="space-y-1 text-center">
        <div className="bg-primary mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl">
          <span className="text-primary-foreground text-lg font-bold">S</span>
        </div>
        <CardTitle className="text-2xl">SDC Workspace</CardTitle>
        <CardDescription>
          Sign in with your employee credentials to continue.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {errorMessage && (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="employeeId">Employee ID</Label>
            <Input
              id="employeeId"
              name="employeeId"
              autoComplete="username"
              value={employeeId}
              onChange={(event) => setEmployeeId(event.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <Button
            type="submit"
            className={cn('w-full', isLoading && 'cursor-not-allowed opacity-70')}
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
