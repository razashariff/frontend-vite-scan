import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jjdzrxfriezvfxjacche.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const ZAP_SCANNER_URL = 'https://zap-scanner-211605900220.us-central1.run.app'
const ZAP_SHARED_SECRET = '8bb1c57ce11343100ceb53cfccf9e48373bacce0773b6f91c11e20a8f0f992a'

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  )

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get authorization header
    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' })
    }

    // Verify the JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    const { url, scanType } = req.body
    if (!url) {
      return res.status(400).json({ error: 'URL is required' })
    }

    const scanId = `scan-${Date.now()}`

    // Create initial scan record
    const { error: dbError } = await supabase
      .from('scans')
      .insert({
        id: scanId,
        user_id: user.id,
        url: url,
        scan_type: scanType || 'full',
        status: 'pending',
        created_at: new Date().toISOString()
      })

    if (dbError) {
      console.error('Database error:', dbError)
      return res.status(500).json({ error: `Failed to create scan record: ${dbError.message}` })
    }

    // Start the scan using the ZAP scanner service
    const startResponse = await fetch(`${ZAP_SCANNER_URL}/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-ZAP-API-Key': ZAP_SHARED_SECRET
      },
      body: JSON.stringify({
        url: url,
        scanType: scanType || 'full',
        scanId: scanId,
        userId: user.id
      })
    })
    
    if (!startResponse.ok) {
      const errorText = await startResponse.text()
      console.error('ZAP scanner error:', {
        status: startResponse.status,
        statusText: startResponse.statusText,
        error: errorText
      })
      return res.status(500).json({ error: `Failed to start ZAP scan: ${errorText}` })
    }

    // Return immediately with the scan ID
    return res.status(200).json({ 
      message: 'Scan started',
      scanId,
      url,
      scanType,
      status: 'pending'
    })
  } catch (error: any) {
    console.error('Error in scan endpoint:', error)
    return res.status(500).json({ 
      error: error.message,
      code: error.status || 500
    })
  }
} 