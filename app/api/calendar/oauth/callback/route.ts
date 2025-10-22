import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens, storeTokens } from '@/lib/google-calendar/oauth';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      return NextResponse.redirect(
        new URL(`/settings?calendar_error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/settings?calendar_error=missing_code', request.url)
      );
    }

    // Verify user is authenticated
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.redirect(
        new URL('/login?redirect=/settings', request.url)
      );
    }

    // Verify state matches user ID (security check)
    if (state !== user.id) {
      return NextResponse.redirect(
        new URL('/settings?calendar_error=invalid_state', request.url)
      );
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // Store tokens in database
    await storeTokens(user.id, tokens);

    // Redirect to settings with success message
    return NextResponse.redirect(
      new URL('/settings?calendar_connected=true', request.url)
    );
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      new URL(`/settings?calendar_error=${encodeURIComponent(error.message || 'connection_failed')}`, request.url)
    );
  }
}
