import { supabase } from '@/integrations/supabase/client';

// Define proper types for ZAP scan results
interface ZapAlert {
  pluginid: string;
  alertRef: string;
  alert: string;
  name: string;
  riskcode: string;
  confidence: string;
  riskdesc: string;
  desc: string;
  instances: {
    uri: string;
    method: string;
    param?: string;
    evidence?: string;
  }[];
  count: string;
  solution: string;
  otherinfo?: string;
  reference?: string;
  cweid?: string;
  wascid?: string;
  sourceid?: string;
  risk: string;
}

export interface ZapScanResult {
  '@version': string;
  '@generated': string;
  site: string;
  alerts: ZapAlert[];
  summary: {
    High: number;
    Medium: number;
    Low: number;
    Informational: number;
  };
}

export interface ScanResponse {
  scanId: string;
  data: ZapScanResult;
}

// Function to start a ZAP scan using the real ZAP endpoint
export async function startZapScan(targetUrl: string, userId: string): Promise<ScanResponse> {
  try {
    console.log('Starting ZAP scan for URL:', targetUrl);
    
    // Call the ZAP API endpoint with additional error handling
    const response = await fetch('https://zap-scanner-211605900220.europe-west2.run.app/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        url: targetUrl,
      }),
      mode: 'cors', // Explicitly set CORS mode
      cache: 'no-cache', // Don't use cached results
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ZAP API returned an error response:', response.status, errorText);
      throw new Error(`API error: ${response.status} - ${errorText || 'No error details available'}`);
    }

    const scanData = await response.json();
    console.log('Scan data received:', scanData);
    
    // Generate a scan ID if one isn't provided by the ZAP API
    const scanId = scanData.scanId || `scan-${Date.now()}`;
    
    // Store the scan results in Supabase
    const { filePath } = await uploadScanResults(scanId, scanData, userId, targetUrl);
    console.log('Scan results saved to:', filePath);
    
    // Return the scan results
    return { 
      scanId, 
      data: scanData 
    };
  } catch (error) {
    console.error('Error starting ZAP scan:', error);
    throw error;
  }
}

// Function to get scan status - might not be needed if your ZAP API returns results immediately
export async function getScanStatus(scanId: string) {
  try {
    const response = await fetch(`/api/scan/${scanId}/status`);
    if (!response.ok) {
      throw new Error('Failed to fetch scan status');
    }
    return await response.json();
  } catch (error) {
    console.error('Error getting scan status:', error);
    throw error;
  }
}

// Function to upload scan results to Supabase
export async function uploadScanResults(scanId: string, scanResults: any, userId: string, targetUrl: string) {
  try {
    // Convert scan results to JSON string
    const resultsJson = JSON.stringify(scanResults);
    const fileName = `scan_${scanId}.json`;
    const filePath = `${userId}/${fileName}`;
    
    console.log('Attempting to upload scan results:', {
      scanId,
      userId,
      fileName,
      filePath
    });
    
    // Get a signed URL for uploading
    const { data, error } = await supabase
      .storage
      .from('scan-results')
      .createSignedUploadUrl(filePath);
    
    if (error) {
      console.error('Error getting signed URL:', error);
      throw error;
    }
    
    console.log('Got signed URL:', data.signedUrl);
    
    // Upload the file using the signed URL
    const uploadResponse = await fetch(data.signedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: resultsJson,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Upload failed:', {
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        error: errorText
      });
      throw new Error(`Failed to upload scan results: ${errorText}`);
    }
    
    console.log('File uploaded successfully');
    
    // Calculate alert counts
    const alerts = scanResults.site?.[0]?.alerts || [];
    const alertCounts = {
      high: alerts.filter((alert: any) => alert.riskdesc.toLowerCase().includes('high')).length,
      medium: alerts.filter((alert: any) => alert.riskdesc.toLowerCase().includes('medium')).length,
      low: alerts.filter((alert: any) => alert.riskdesc.toLowerCase().includes('low')).length,
      info: alerts.filter((alert: any) => alert.riskdesc.toLowerCase().includes('informational')).length,
    };
    
    console.log('Creating scan record with alert counts:', alertCounts);
    
    // Create a record in scans table with the correct schema
    const { error: dbError } = await supabase
      .from('scans')
      .insert({
        id: scanId,
        user_id: userId,
        url: scanResults.site?.[0]?.['@name'] || targetUrl,
        scan_type: 'ZAP',
        status: 'completed',
        file_path: filePath,
        alerts_high: alertCounts.high,
        alerts_medium: alertCounts.medium,
        alerts_low: alertCounts.low,
        alerts_info: alertCounts.info,
      });
    
    if (dbError) {
      console.error('Error creating scan record:', dbError);
      throw dbError;
    }
    
    console.log('Scan record created successfully');
    
    // Return the file path for later reference
    return { fileName, filePath };
  } catch (error) {
    console.error('Error in uploadScanResults:', error);
    throw error;
  }
}

// Function to count alerts by severity
function countAlertsBySeverity(results: any, severity: string) {
  let count = 0;
  if (results.alerts && Array.isArray(results.alerts)) {
    count = results.alerts.filter((alert: any) => alert.risk === severity).length;
  }
  return count;
}

// Function to get user's scan history
export async function getUserScans(userId: string) {
  try {
    const { data, error } = await supabase
      .from('scans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user scans:', error);
    throw error;
  }
}

// Function to get a specific scan's results
export async function getScanResults(userId: string, filePath: string) {
  try {
    const { data, error } = await supabase
      .storage
      .from('scan-results')
      .createSignedUrl(filePath, 3600); // 1 hour expiry
    
    if (error) throw error;
    
    const response = await fetch(data.signedUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch scan results');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching scan results:', error);
    throw error;
  }
}

// Legacy mock function - keeping for backward compatibility or testing
export async function mockZapScan(targetUrl: string): Promise<ScanResponse> {
  console.log('Using mock ZAP scan for URL:', targetUrl);
  
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockScanData: ZapScanResult = {
        "@version": "2.11.1",
        "@generated": new Date().toISOString(),
        "site": targetUrl,
        "alerts": [
          {
            "pluginid": "10016",
            "alertRef": "10016",
            "alert": "Web Browser XSS Protection Not Enabled",
            "name": "Web Browser XSS Protection Not Enabled",
            "riskcode": "1",
            "confidence": "2",
            "riskdesc": "Low (Medium)",
            "desc": "<p>Web Browser XSS Protection is not enabled, or is disabled by the configuration of the 'X-XSS-Protection' HTTP response header on the web server</p>",
            "instances": [
              {
                "uri": targetUrl,
                "method": "GET",
                "param": "X-XSS-Protection",
                "evidence": "X-XSS-Protection: 0"
              }
            ],
            "count": "1",
            "solution": "<p>Ensure that the web browser's XSS filter is enabled, by setting the X-XSS-Protection HTTP response header to '1'.</p>",
            "otherinfo": "<p>The X-XSS-Protection HTTP response header allows the web server to enable or disable the web browser's XSS protection mechanism. The following values would attempt to enable it: </p><p>X-XSS-Protection: 1; mode=block</p><p>X-XSS-Protection: 1; report=http://www.example.com/xss</p><p>The following values would disable it:</p><p>X-XSS-Protection: 0</p><p>The X-XSS-Protection HTTP response header is currently supported on Internet Explorer, Chrome and Safari (WebKit).</p><p>Note that this alert is only raised if the response body could potentially contain an XSS payload (with a text-based content type, with a non-zero length).</p>",
            "reference": "<p>https://www.owasp.org/index.php/XSS_(Cross_Site_Scripting)_Prevention_Cheat_Sheet</p><p>https://blog.veracode.com/2014/03/guidelines-for-setting-security-headers/</p>",
            "cweid": "16",
            "wascid": "14",
            "sourceid": "3",
            "risk": "Low"
          },
          {
            "pluginid": "10021",
            "alertRef": "10021",
            "alert": "X-Content-Type-Options Header Missing",
            "name": "X-Content-Type-Options Header Missing",
            "riskcode": "2",
            "confidence": "2",
            "riskdesc": "Medium (Medium)",
            "desc": "<p>The Anti-MIME-Sniffing header X-Content-Type-Options was not set to 'nosniff'. This allows older versions of Internet Explorer and Chrome to perform MIME-sniffing on the response body, potentially causing the response body to be interpreted and displayed as a content type other than the declared content type. Current (early 2014) and legacy versions of Firefox will use the declared content type (if one is set), rather than performing MIME-sniffing.</p>",
            "instances": [
              {
                "uri": targetUrl,
                "method": "GET"
              }
            ],
            "count": "1",
            "solution": "<p>Ensure that the application/web server sets the Content-Type header appropriately, and that it sets the X-Content-Type-Options header to 'nosniff' for all web pages.</p><p>If possible, ensure that the end user uses a standards-compliant and modern web browser that does not perform MIME-sniffing at all, or that can be directed by the web application/web server to not perform MIME-sniffing.</p>",
            "otherinfo": "<p>This issue still applies to error type pages (401, 403, 500, etc.) as they are often still affected by injection issues, in which case there is still concern for browsers sniffing pages away from their actual content type.</p><p>At \"High\" threshold this scan rule will not alert on client or server error responses.</p>",
            "reference": "<p>http://msdn.microsoft.com/en-us/library/ie/gg622941%28v=vs.85%29.aspx</p><p>https://owasp.org/www-community/Security_Headers</p>",
            "cweid": "16",
            "wascid": "15",
            "sourceid": "3",
            "risk": "Medium"
          },
          {
            "pluginid": "10202",
            "alertRef": "10202",
            "alert": "Absence of Anti-CSRF Tokens",
            "name": "Absence of Anti-CSRF Tokens",
            "riskcode": "3",
            "confidence": "2",
            "riskdesc": "High (Medium)",
            "desc": "<p>No Anti-CSRF tokens were found in a HTML submission form.</p><p>A cross-site request forgery is an attack that involves forcing a victim to send an HTTP request to a target destination without their knowledge or intent in order to perform an action as the victim. The underlying cause is application functionality using predictable URL/form actions in a repeatable way. The nature of the attack is that CSRF exploits the trust that a web site has for a user. By contrast, cross-site scripting (XSS) exploits the trust that a user has for a web site. Like XSS, CSRF attacks are not necessarily cross-site, but they can be. Cross-site request forgery is also known as CSRF, XSRF, one-click attack, session riding, confused deputy, and sea surf.</p><p>CSRF attacks are effective in a number of situations, including:</p><p>    * The victim has an active session on the target site.</p><p>    * The victim is authenticated via HTTP auth on the target site.</p><p>    * The victim is on the same local network as the target site.</p><p>CSRF has primarily been used to perform an action against a target site using the victim's privileges, but recent techniques have been discovered to disclose information by gaining access to the response. The risk of information disclosure is significantly greater when using a cross-origin resource sharing (CORS) implementation on the target site.</p>",
            "instances": [
              {
                "uri": targetUrl + "/login",
                "method": "GET",
                "evidence": "<form action=\"/login\" method=\"post\">"
              }
            ],
            "count": "1",
            "solution": "<p>Phase: Architecture and Design</p><p>Use a vetted library or framework that does not allow this weakness to occur or provides constructs that make this weakness easier to avoid.</p><p>For example, use anti-CSRF packages such as the OWASP CSRFGuard.</p><p></p><p>Phase: Implementation</p><p>Ensure that your application is free of cross-site scripting issues, because most CSRF defenses can be bypassed using attacker-controlled script.</p><p></p><p>Phase: Architecture and Design</p><p>Generate a unique nonce for each form, place the nonce into the form, and verify the nonce upon receipt of the form. Be sure that the nonce is not predictable (CWE-330).</p><p>Note that this can be bypassed using XSS.</p><p></p><p>Identify especially dangerous operations. When the user performs a dangerous operation, send a separate confirmation request to ensure that the user intended to perform that operation.</p><p>Note that this can be bypassed using XSS.</p><p></p><p>Use the ESAPI Session Management control.</p><p>This control includes a component for CSRF.</p><p></p><p>Do not use the GET method for any request that triggers a state change.</p><p></p><p>Phase: Implementation</p><p>Check the HTTP Referer header to see if the request originated from an expected page. This could break legitimate functionality, because users or proxies might have disabled sending the Referer for privacy reasons.</p>",
            "otherinfo": "",
            "reference": "<p>http://projects.webappsec.org/Cross-Site-Request-Forgery</p><p>http://cwe.mitre.org/data/definitions/352.html</p>",
            "cweid": "352",
            "wascid": "9",
            "sourceid": "3",
            "risk": "High"
          }
        ],
        "summary": {
          "High": 1,
          "Medium": 1,
          "Low": 1,
          "Informational": 0
        }
      };
      
      console.log('Mock scan completed successfully');
      resolve({ scanId: 'mock-scan-id-' + Date.now(), data: mockScanData });
    }, 2000);
  });
}
