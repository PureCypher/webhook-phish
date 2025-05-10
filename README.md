# Webhook Phishing PoC

⚠️ **IMPORTANT: This is a proof-of-concept (PoC) for SOC testing ONLY. Do not use in production or against real users.**

This project demonstrates a simulated phishing campaign using a webhook-based redirector for security operation centers (SOCs) to test detection and response capabilities.

## Components

1. **Email Template (`email.html`)**
   - HTML email with a malicious link
   - Tracking parameter embedded in URL

2. **Redirector (`redirector.js`)**
   - Node.js/Express server that:
     - Logs visitor metadata (IP, User-Agent, timestamp, tracking ID)
     - POSTs this data to a configurable webhook
     - Redirects the victim to the phishing page

3. **Phishing Page (`merged-phishing.html`)**
   - Fake Microsoft 365 login page
   - Captures credentials and session tokens
   - Encodes and exfiltrates them via webhook
   - Redirects to the legitimate site

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm

### Installation

1. Clone this repository
   ```
   git clone https://github.com/yourusername/webhook-phish.git
   cd webhook-phish
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Configure Discord webhook endpoints
   - Create Discord webhooks:
     1. In your Discord server, go to Server Settings > Integrations > Webhooks
     2. Click "New Webhook", name it, and select a channel to post to
     3. Click "Copy Webhook URL" - this will be your webhook endpoint
   - Open `redirector.js` and update these variables:
     - `METADATA_WEBHOOK_URL`: Discord webhook for visitor tracking data
     - `CREDENTIALS_WEBHOOK_URL`: Discord webhook for captured credentials (can be same or different)
   - Open `merged-phishing.html` and update:
     - `WEBHOOK_URL`: Should match the `CREDENTIALS_WEBHOOK_URL` from redirector.js

4. Start the server
   ```
   npm start
   ```

5. Access the email template
   - Open `email.html` in a browser to preview
   - The link will point to http://localhost:3000/?id=test123

## Testing Workflow

1. A SOC tester opens the email template
2. They click the "View Secure Document" link
3. The redirector logs their info and serves the phishing page directly
4. The phishing page presents a fake Microsoft 365 login form
5. When credentials are entered and submitted:
   - Data is encoded and sent to the webhook
   - User is redirected to the real Microsoft 365 site

## Using Discord Webhooks

This project uses Discord webhooks to exfiltrate data, which is a common technique in real phishing campaigns:

1. **Create Discord Webhooks:**
   - In your Discord server, go to Server Settings > Integrations > Webhooks
   - Click "New Webhook", give it a name, and select a channel
   - Click "Copy Webhook URL" - you'll need this URL for configuration

2. **Webhook Data Formatting:**
   - The project automatically formats data as Discord embeds with fields
   - Visitor metadata uses orange embeds with tracking information
   - Captured credentials use red embeds with username/password data
   - Passwords are spoiler-tagged in Discord (||password||)

3. **Webhook Security:**
   - Keep your webhook URLs private - anyone with the URL can post to your channel
   - Create a private channel specifically for testing
   - Delete webhooks after testing is complete

## Detection Opportunities

This PoC can help SOCs test detection capabilities for:

- Suspicious HTTP 302 redirects
- Query parameter usage for tracking
- Discord webhook exfiltration of data (increasingly common in real attacks)
- Base64 encoding of sensitive information
- Fake login pages mimicking legitimate services

## Security Notice

This code is provided for educational and defensive security testing purposes only. Misuse of this code may violate laws and regulations. Always:

- Obtain proper authorization before conducting security tests
- Only use in controlled environments
- Never target real users
- Document all testing activities

## Disclaimer

The authors assume no liability and are not responsible for any misuse or damage caused by this project.

## Additional Resources

This repository includes a detailed document (`webhook-phish.md`) that provides:

- In-depth analysis of webhook-based data exfiltration techniques
- Information on how attackers use webhooks for dynamic content delivery and redirection
- SOC detection and mitigation strategies with example KQL queries
- MITRE ATT&CK mapping of these techniques
- References to recent threat intelligence reports

SOC teams can use this document as a reference for understanding the techniques demonstrated in this PoC and developing detection strategies.
