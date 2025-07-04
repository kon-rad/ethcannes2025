import { NextResponse } from 'next/server'

export async function GET() {
  // Generate a nonce that's at least 8 alphanumeric characters
  const nonce = crypto.randomUUID().replace(/-/g, '').substring(0, 16)
  
  return NextResponse.json({ nonce })
} 