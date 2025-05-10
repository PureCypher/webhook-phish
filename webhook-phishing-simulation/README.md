# Webhook Phishing Simulation

This is a security simulation for SOC testing purposes only. It demonstrates how attackers use webhooks for dynamic content delivery and user-agent based redirection to phishing pages.

## ⚠️ WARNING: FOR CONTROLLED SOC TESTING ONLY!
DO NOT use against real users or deploy in production environments!

## Directory Structure

- **email/** - Contains the phishing email template with tracking pixel and redirect link
- **webhook-server/** - Contains the Node.js/Express server that handles webhook endpoints
- **phishing-page/** - Contains the phishing page that mimics Microsoft login

## Components

### 1. Webhook Server (webhook-server/webhook.js)

The webhook server implements two key endpoints:
- `/webhook/image` - Returns a dynamic image and logs access
- `/webhook/redirect` - Logs metadata and redirects based on user-agent

Features:
- User-agent based cloaking (redirects scanners to legitimate sites)
- Detailed metadata logging (IP, user-agent, timestamp, tracking IDs)
- Discord webhook integration for exfiltration

### 2. Phishing Email (email/email.html)

The phishing email contains:
- A hidden tracking pixel that connects to `/webhook/image`
- A "View Secure Document" button linking to `/webhook/redirect`

### 3. Phishing Pages

#### 3.1 Standard Phishing Page (phishing-page/index.html)

The standard phishing page features:
- Microsoft login interface clone
- Two-step login process (email then password)
- Credential capture and exfiltration
- Cookie/storage token capture
- Session/token hijacking capabilities
- Base64 encoded payload exfiltration
- Redirection to legitimate site after credential theft

#### 3.2 OAuth Consent Phishing (phishing-page/consent.html)

The consent phishing page simulates an OAuth authorization screen:
- Fake Microsoft OAuth consent screen
- Simulated MS Graph permissions (Mail.Read, Files.Read, offline_access)
- "Accept" button that submits a payload with fake refresh token
- Exfiltration of consent data via webhook

#### 3.3 Browser-in-the-Browser Attack (phishing-page/bitb.html)

The BitB attack page simulates a browser popup window:
- Realistic browser chrome UI using CSS
- Microsoft OAuth popup styled login form
- Full-screen overlay mode with no actual browser elements
- Credential exfiltration similar to standard phishing page

## Running the Simulation

1. Install dependencies:
   ```
   cd webhook-server
   npm install
   ```

2. Start the webhook server:
   ```
   cd webhook-server
   node webhook.js
   ```

3. Start a web server for the phishing page:
   ```
   cd phishing-page
   python -m http.server 8080
   ```

4. Open `email/email.html` in a browser
5. Click the "View Secure Document" button
6. Enter credentials in the phishing page

## Detection Opportunities

This simulation demonstrates detection opportunities at multiple levels:

- **Email Gateway**: Hidden images from non-corporate domains, external links
- **Network/Proxy**:
  - Dynamic redirections and user-agent cloaking
  - Outbound webhook POSTs with base64 encoded data
  - Token and session data exfiltration
  - OAuth consent grant monitoring
- **Endpoint**:
  - JavaScript executing fetch to external domains
  - Cookie and localStorage access
  - Form data exfiltration
  - Browser-in-the-Browser attack techniques
  - OAuth consent phishing indicators

## MITRE ATT&CK Techniques

- T1566.002 (Spearphishing Link)
- T1567.004 (Exfiltration via Web Service)
- T1528 (Steal Application Access Token)
- T1539 (Steal Web Session Cookie)
- T1185 (Browser Session Hijacking)
- T1204.001 (User Execution: Malicious Link)

## Testing Resources

This simulation includes several testing resources to help security teams evaluate and understand the phishing techniques:

### 1. Test Links (test-links.html)

An HTML page with various test links to exercise different components of the simulation:
- Tracking pixel tests with different tracking IDs
- Redirect tests with different user-agents
- Direct phishing page access
- Complete phishing flow testing

Open `test-links.html` in a browser to access these test links.

### 2. Testing Documentation (test-documentation.md)

Detailed documentation explaining:
- How each component works
- Test scenarios and expected outcomes
- Detection opportunities
- Advanced testing techniques

### 3. Testing Scripts

Cross-platform scripts for automated testing:

- **Bash Script** (`test-scripts.sh`): For Linux/macOS users
  ```
  chmod +x test-scripts.sh
  ./test-scripts.sh
  ```

- **PowerShell Script** (`test-scripts.ps1`): For Windows users
  ```
  powershell -ExecutionPolicy Bypass -File test-scripts.ps1
  ```

- **Python Script** (`test_scripts.py`): Cross-platform with advanced features
  ```
  pip install -r requirements.txt
  python test_scripts.py
  ```

These scripts allow testing:
- Tracking pixel functionality
- Redirect behavior with different user-agents
- Cloaking mechanisms
- Custom user-agent testing (Python script only)

## Advanced Testing Flow

This enhanced simulation includes multiple attack vectors that can be tested independently or as part of a comprehensive attack chain.

### 1. Session and Token Hijacking Testing

To test the session and token hijacking capabilities:

1. Start the webhook server:
   ```
   cd webhook-server
   node webhook.js
   ```

2. Start a web server for the phishing pages:
   ```
   cd phishing-page
   python -m http.server 8080
   ```

3. Access the redirect endpoint with token parameters:
   ```
   http://localhost:3000/webhook/redirect?id=TEST123&token=fake_token&session=fake_session
   ```

4. Observe in the Discord webhook how the token parameters are captured, base64 encoded, and logged.

5. When credentials are submitted, note how the token data from multiple sources (URL parameters, localStorage, cookies) is captured and exfiltrated.

### 2. Consent Phishing Testing

To test the OAuth consent phishing simulation:

1. Access the redirect endpoint with the consent parameter:
   ```
   http://localhost:3000/webhook/redirect?id=TEST123&consent=true
   ```

   Direct URL: http://localhost:3000/webhook/redirect?id=TEST123&consent=true

2. This will redirect to the consent.html page which simulates an OAuth consent screen.

3. Click "Accept" to grant permissions and observe how the consent data, including scopes and a fake refresh token, is exfiltrated to Discord.

### 3. Browser-in-the-Browser Testing

To test the BitB attack simulation:

1. Access the redirect endpoint with the bitb parameter:
   ```
   http://localhost:3000/webhook/redirect?id=TEST123&bitb=true
   ```

   Direct URL: http://localhost:3000/webhook/redirect?id=TEST123&bitb=true

2. This will redirect to the bitb.html page which simulates a browser popup window.

3. Enter credentials in the fake browser window and observe how they are exfiltrated.

## Log Correlation Guide

The enhanced simulation uses several correlation keys to help SOC teams track attack chains across different components:

1. **Tracking ID**: The `id` parameter is used as the primary correlation key across all components. It's included in:
   - URL parameters
   - Webhook logs
   - Exfiltrated credentials
   - Consent grants

2. **Attack Vector Identification**:
   - Standard phishing logs include token/session data
   - Consent phishing logs include granted scopes and refresh tokens
   - BitB attacks include an "attackVector" field set to "BitB"

3. **Payload Encoding**:
   - All sensitive data is base64 encoded before exfiltration
   - Token data is separately encoded for additional security

This correlation structure allows SOC teams to track the complete attack chain from initial access to credential theft and post-exploitation activities like token theft or OAuth consent grants.

## Quick Test URLs

For quick testing of the different phishing scenarios, use these direct URLs:

1. **Standard Phishing with Token Hijacking**:
   http://localhost:3000/webhook/redirect?id=TEST123&token=fake_token&session=fake_session

2. **OAuth Consent Phishing**:
   http://localhost:3000/webhook/redirect?id=TEST123&consent=true

3. **Browser-in-the-Browser Attack**:
   http://localhost:3000/webhook/redirect?id=TEST123&bitb=true

These URLs will trigger the appropriate redirect to the corresponding phishing page with the necessary parameters for testing.