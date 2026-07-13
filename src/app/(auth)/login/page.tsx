import { redirect } from 'next/navigation'
import { auth } from '@lib/auth/auth'
import { LoginCard } from '@components/auth/login-card'

interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth()

  // Already authenticated — go to dashboard
  if (session?.user?.isActive) {
    const { callbackUrl } = await searchParams
    redirect(getSafeCallbackUrl(callbackUrl))
  }

  const { callbackUrl, error } = await searchParams

  return <LoginCard error={error} callbackUrl={getSafeCallbackUrl(callbackUrl)} />
}

function getSafeCallbackUrl(callbackUrl?: string): string {
  if (!callbackUrl || !callbackUrl.startsWith('/') || callbackUrl.startsWith('//')) {
    return '/dashboard'
  }

  return callbackUrl
}
