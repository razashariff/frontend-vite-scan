export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Received request:', {
      body: req.body,
      headers: req.headers
    });

    const response = await fetch('https://jjdzrxfriezvfxjacche.supabase.co/functions/v1/zap-scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization
      },
      body: JSON.stringify(req.body)
    });

    console.log('Supabase response status:', response.status);
    
    const data = await response.json();
    console.log('Supabase response data:', data);

    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Detailed error:', {
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
} 