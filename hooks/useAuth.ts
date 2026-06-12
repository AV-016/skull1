'use client'

import { useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import { AuthResponse, LoginRequest } from '@/lib/types'
import { ENDPOINTS } from '@/lib/constants'
import { useAuth } from '@/context/AuthContext'
import { setToken } from '@/lib/auth'

export const useLogin = () => {
  const { login } = useAuth()

  return useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      const response = await api.post<any>(ENDPOINTS.LOGIN, credentials)
      return response.data.data
    },
    onSuccess: (data) => {
      setToken(data.token)
      login(data.token, data.user)
    },
  })
}

export const useRegister = () => {
  const { login } = useAuth()

  return useMutation({
    mutationFn: async (credentials: any) => {
      const response = await api.post<any>(ENDPOINTS.REGISTER, credentials)
      return response.data.data
    },
    onSuccess: (data) => {
      if (data?.user?.isVerified) {
        setToken(data.token)
        login(data.token, data.user)
      }
    },
  })
}

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: async (email: string) => {
      const response = await api.post(ENDPOINTS.FORGOT_PASSWORD || '/auth/forgot-password', { email })
      return response.data
    },
  })
}

export const useResetPassword = () => {
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post(ENDPOINTS.RESET_PASSWORD || '/auth/reset-password', data)
      return response.data
    },
  })
}

export const useVerifyOtp = () => {
  return useMutation({
    mutationFn: async (data: { email: string; otp: string }) => {
      const response = await api.post(ENDPOINTS.VERIFY_OTP, data)
      return response.data
    },
  })
}

export const useResendOtp = () => {
  return useMutation({
    mutationFn: async (email: string) => {
      const response = await api.post(ENDPOINTS.RESEND_OTP, { email })
      return response.data
    },
  })
}

export const useSendPhoneOtp = () => {
  return useMutation({
    mutationFn: async (phone: string) => {
      const response = await api.post('/auth/send-phone-otp', { phone })
      return response.data
    },
  })
}

export const useVerifyPhoneOtp = () => {
  return useMutation({
    mutationFn: async (data: { phone: string; otp: string }) => {
      const response = await api.post('/auth/verify-phone-otp', data)
      return response.data
    },
  })
}

export const useDeleteAccount = () => {
  const { logout } = useAuth()

  return useMutation({
    mutationFn: async () => {
      const response = await api.delete('/auth/me')
      return response.data
    },
    onSuccess: () => {
      logout()
    },
  })
}


