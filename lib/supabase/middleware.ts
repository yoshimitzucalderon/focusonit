import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Get env vars - MUST be configured as Plaintext in Vercel for Edge Runtime
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Fail fast if env vars not available
  // This indicates misconfiguration in Vercel (vars must be Plaintext, not Encrypted)
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('CRITICAL: Supabase env vars not available in Edge Runtime')
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
    console.error('Solution: Configure these variables as PLAINTEXT (not encrypted) in Vercel')
    console.error('See: docs/deployment/VERCEL_ENV_VARS.md')
    return new Response(
      'Server configuration error. Please check environment variables.',
      { status: 500 }
    )
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          supabaseResponse = NextResponse.next({
            request,
          })
          supabaseResponse.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          supabaseResponse = NextResponse.next({
            request,
          })
          supabaseResponse.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Refrescar sesión si existe
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Proteger rutas del dashboard
  if (!user && request.nextUrl.pathname.startsWith('/today')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (!user && request.nextUrl.pathname.startsWith('/week')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (!user && request.nextUrl.pathname.startsWith('/all')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (!user && request.nextUrl.pathname.startsWith('/completed')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirigir a today si ya está autenticado y trata de ir a login/signup
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup')) {
    return NextResponse.redirect(new URL('/today', request.url))
  }

  return supabaseResponse
}