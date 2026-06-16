import { AuthLayout } from '@/components/auth/AuthLayout'
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'

export const metadata = {
  title: 'Forgot Password - Skulture',
  description: 'Request a password reset code for your Skulture account.',
}

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="Forgot Password"
      subtitle="Enter your email to request a reset code"
    >
      <ForgotPasswordForm />
    </AuthLayout>
  )
}
