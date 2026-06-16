import { AuthLayout } from '@/components/auth/AuthLayout'
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'

export const metadata = {
  title: 'Reset Password - Skulture',
  description: 'Enter your verification code and set a new password for your Skulture account.',
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Enter the verification code and set your new password"
    >
      <ResetPasswordForm />
    </AuthLayout>
  )
}
