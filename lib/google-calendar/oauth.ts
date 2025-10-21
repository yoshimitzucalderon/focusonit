import { google } from 'googleapis';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// Initialize OAuth2 client
export function getOAuth2Client() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  return oauth2Client;
}

// Generate authorization URL
export function generateAuthUrl(state?: string): string {
  const oauth2Client = getOAuth2Client();

  const scopes = [
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/calendar.readonly'
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent', // Force consent to get refresh token
    state: state || '',
  });

  return authUrl;
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(code: string) {
  const oauth2Client = getOAuth2Client();

  try {
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    throw new Error('Failed to exchange authorization code');
  }
}

// Store tokens in Supabase
export async function storeTokens(userId: string, tokens: any) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('google_calendar_tokens')
    .upsert({
      user_id: userId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expiry: new Date(tokens.expiry_date || Date.now() + 3600000).toISOString(),
      scope: tokens.scope || 'https://www.googleapis.com/auth/calendar.events',
      calendar_id: 'primary',
    } as any)
    .select()
    .single();

  if (error) {
    console.error('Error storing tokens:', error);
    throw new Error('Failed to store tokens');
  }

  return data;
}

// Retrieve tokens from Supabase
export async function getStoredTokens(userId: string) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('google_calendar_tokens')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

// Get authenticated OAuth2 client for a user
export async function getAuthenticatedClient(userId: string) {
  const tokens = await getStoredTokens(userId);

  if (!tokens) {
    throw new Error('No tokens found for user');
  }

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: (tokens as any).access_token,
    refresh_token: (tokens as any).refresh_token,
    expiry_date: new Date((tokens as any).token_expiry).getTime(),
  });

  // Check if token is expired and refresh if needed
  const now = Date.now();
  const expiryTime = new Date((tokens as any).token_expiry).getTime();

  if (expiryTime <= now) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(credentials);

      // Update stored tokens
      await storeTokens(userId, credentials);
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw new Error('Failed to refresh access token');
    }
  }

  return oauth2Client;
}

// Delete tokens (disconnect Google Calendar)
export async function deleteTokens(userId: string) {
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from('google_calendar_tokens')
    .delete()
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting tokens:', error);
    throw new Error('Failed to delete tokens');
  }

  return true;
}

// Check if user has connected Google Calendar
export async function isGoogleCalendarConnected(userId: string): Promise<boolean> {
  const tokens = await getStoredTokens(userId);
  return tokens !== null;
}
