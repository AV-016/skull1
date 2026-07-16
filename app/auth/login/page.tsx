import { Suspense } from 'react'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to access your account"
    >
      <Suspense fallback={<div className="text-xs text-muted-text">Loading form...</div>}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  )
}
