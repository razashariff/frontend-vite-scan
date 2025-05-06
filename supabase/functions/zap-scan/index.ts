import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://web-watchdog-guardian-scan-main-d4rxnnf3z.vercel.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url, scanType } = await req.json()
    const scanId = `scan-${Date.now()}`

    // Start the scan asynchronously
    startScan(url, scanType, scanId).catch(console.error)

    // Return immediately with the scan ID
    return new Response(
      JSON.stringify({ 
        message: 'Scan started',
        scanId,
        url,
        scanType,
        status: 'pending'
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    )
  }
})

async function startScan(url: string, scanType: string, scanId: string) {
  try {
    // Your ZAP scan logic here
    // This will run in the background
    console.log(`Starting scan ${scanId} for ${url}`)
    
    // Simulate a long-running scan
    await new Promise(resolve => setTimeout(resolve, 60000))
    
    // Store results in Supabase
    const { data, error } = await supabase
      .from('scans')
      .update({ 
        status: 'completed',
        results: { /* scan results */ }
      })
      .eq('id', scanId)
    
    if (error) throw error
    
    console.log(`Scan ${scanId} completed`)
  } catch (error) {
    console.error(`Scan ${scanId} failed:`, error)
    
    // Update scan status to failed
    await supabase
      .from('scans')
      .update({ 
        status: 'failed',
        error: error.message
      })
      .eq('id', scanId)
  }
} 