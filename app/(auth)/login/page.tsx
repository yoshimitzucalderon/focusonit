'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Mail, Lock, Eye, EyeOff, Zap, Loader2, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { FcGoogle } from 'react-icons/fc'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const router = useRouter()
  const supabase = createClient()

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {}

    if (!email) {
      newErrors.email = 'El correo es requerido'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Correo inválido'
    }

    if (!password) {
      newErrors.password = 'La contraseña es requerida'
    } else if (password.length < 6) {
      newErrors.password = 'Mínimo 6 caracteres'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      toast.success('¡Bienvenido de vuelta! 🎉')
      router.push('/today')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Error al iniciar sesión')
      setErrors({ password: 'Credenciales incorrectas' })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) throw error

      // Redirect automático por Supabase
    } catch (error: any) {
      console.error('Error signing in with Google:', error)
      toast.error('Error al iniciar sesión con Google')
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-purple-900/20 dark:to-slate-900 relative overflow-hidden">
      {/* Animated blobs de fondo */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-blue-200 dark:bg-blue-500/30 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute top-40 right-10 w-64 h-64 bg-purple-200 dark:bg-purple-500/30 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-20 left-1/2 w-64 h-64 bg-pink-200 dark:bg-pink-500/30 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

      {/* Contenido principal */}
      <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md">
          {/* Logo animado */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <motion.div
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-4 shadow-lg"
            >
              <Zap className="text-white" size={32} />
            </motion.div>

            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
              FocusOnIt
            </h1>

            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Enfócate en lo que realmente importa ✨
            </p>
          </motion.div>

          {/* Card con glassmorphism */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20 dark:border-slate-700/50"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Bienvenido de vuelta
            </h2>

            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Inicia sesión para continuar
            </p>

            {/* Formulario */}
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Correo electrónico
                </label>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="text-gray-400" size={20} />
                  </div>

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (errors.email) setErrors({ ...errors, email: undefined })
                    }}
                    className={`w-full pl-10 pr-4 py-3 border ${
                      errors.email
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                    } rounded-xl focus:ring-2 focus:border-transparent transition-all outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500`}
                    placeholder="tu@email.com"
                  />
                </div>

                {errors.email && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
                  >
                    <AlertCircle size={14} />
                    {errors.email}
                  </motion.p>
                )}
              </div>

              {/* Contraseña con toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Contraseña
                </label>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="text-gray-400" size={20} />
                  </div>

                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (errors.password) setErrors({ ...errors, password: undefined })
                    }}
                    className={`w-full pl-10 pr-12 py-3 border ${
                      errors.password
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                    } rounded-xl focus:ring-2 focus:border-transparent transition-all outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500`}
                    placeholder="••••••••"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {errors.password && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
                  >
                    <AlertCircle size={14} />
                    {errors.password}
                  </motion.p>
                )}
              </div>

              {/* Recordarme + Olvidé contraseña */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer"
                  />
                  <span className="ml-2 text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                    Recordarme
                  </span>
                </label>

                <Link
                  href="/forgot-password"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              {/* Botón principal */}
              <motion.button
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-blue-500 dark:to-purple-500 dark:hover:from-blue-600 dark:hover:to-purple-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={20} />
                    Iniciando...
                  </span>
                ) : (
                  'Iniciar sesión'
                )}
              </motion.button>
            </form>

            {/* Separador */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white/80 dark:bg-slate-800/80 text-gray-500 dark:text-gray-400">
                  o continúa con
                </span>
              </div>
            </div>

            {/* Login social */}
            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: googleLoading ? 1 : 1.02 }}
                whileTap={{ scale: googleLoading ? 1 : 0.98 }}
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl py-3 hover:bg-gray-50 dark:hover:bg-slate-600 hover:border-gray-400 dark:hover:border-gray-500 transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {googleLoading ? (
                  <Loader2 className="animate-spin text-gray-600 dark:text-gray-300" size={20} />
                ) : (
                  <FcGoogle className="w-6 h-6" />
                )}
                <span className="font-medium text-gray-700 dark:text-gray-200">
                  {googleLoading ? 'Conectando...' : 'Continuar con Google'}
                </span>
              </motion.button>
            </div>

            {/* Link de registro */}
            <p className="text-center mt-6 text-sm text-gray-600 dark:text-gray-300">
              ¿No tienes cuenta?{' '}
              <Link
                href="/signup"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-colors"
              >
                Créala gratis
              </Link>
            </p>
          </motion.div>

          {/* Stats motivacionales */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8 text-center text-sm text-gray-600 dark:text-gray-300"
          >
            <p>
              Únete a <strong className="text-blue-600 dark:text-blue-400">10,000+</strong> usuarios productivos 🚀
            </p>
          </motion.div>
        </div>
      </div>

      {/* Estilos para animaciones de blobs */}
      <style jsx global>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}
