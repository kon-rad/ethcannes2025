import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  // Generate a nonce that's at least 8 alphanumeric characters
  const nonce = crypto.randomUUID().replace(/-/g, '').substring(0, 16)
  
  // Set the nonce in a cookie for verification
  const response = NextResponse.json({ nonce })
  response.cookies.set('siwe', nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 5 // 5 minutes
  })
  
  return response
} 