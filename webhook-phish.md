# Webhook-Based Data Exfiltration of Credentials/Tokens/PII

Attackers increasingly use public webhook endpoints (e.g. Slack/Discord/Telegram) as clandestine exfiltration channels.  Webhooks “allow a server to push data over HTTPS without the client polling”, meaning stolen data (credentials, tokens, PII) can be posted directly to a benign service.  Threat reports document numerous cases: for example, a recent Russian-linked phishing used a WinRAR RCE to run a PowerShell script that stole browser credentials and sent them via the legitimate **webhook.site** service.  Info-stealer malware like *TroubleGrabber* and *KurayStealer* harvest passwords, tokens and screenshots and post them to the attacker’s Discord channel via webhooks.  Similarly, a cloud-phishing tool (“CloudPhish”) used by the SloppyLemming actor logs credentials and exfiltrates them over a Discord webhook.  In one case, a publicly exposed webpage contained 17 active Slack webhook URLs, allowing any visitor to hijack them to post malicious content or collect workspace data.  These examples underscore that any secret or token exposed in code can become an immediate exfiltration vector.

* **Abused Services:**  Common targets include Discord (`discordapp.com/api/webhooks/…`), Slack (`hooks.slack.com/services/…`), Telegram bots (`api.telegram.org/bot<token>/sendMessage`), and generic platforms like **webhook.site** or **mockbin.org**.  Attackers may also use cloud messaging (e.g. GitHub/GitLab webhooks) in similar ways.
* **Evasion Techniques:** Exfiltration traffic is encrypted (HTTPS) and blends with normal cloud/saaS traffic.  Adversaries may employ domain-fronting (T1090.004) via CDNs so the TLS SNI hides the true webhook host.  Disposable endpoints are common: e.g. spin up a fresh webhook.site/Herokuapp link per campaign.  Malware often encodes or encrypts payloads before POSTing to evade signature-based detection.
* **Indicators of Compromise:** Look for unusual network connections or process activity.  Examples include process command lines invoking `curl -X POST`, `Invoke-WebRequest`, or Python `requests.post` to webhook domains.  Network logs may show HTTPS to `discordapp.com/api/webhooks/`, `hooks.slack.com/services/`, `api.telegram.org`, or other webhook endpoints.  File or memory artifacts may contain hard-coded webhook URLs or API tokens.  Exfil endpoints often appear as random GUIDs or benign-looking URIs (e.g. `worker.dev` subdomains).
* **Case Studies:** In addition to Fancy Bear’s use of webhook.site, the *Morphing Meerkat* phishing-as-a-service campaigns used a Telegram bot webhook to immediately relay captured email credentials.  Many commodity info-stealers (e.g. Lumma, Vidar variants) similarly offer Discord/Slack exfil options.  RaaS affiliates and IABs frequently adopt these tactics for initial access or data theft, since they require no infrastructure—just any allowed HTTPS endpoint.

## Webhooks for Dynamic Content Delivery and Redirection

Some phishing kits use webhooks or cloud APIs to serve dynamic landing pages or orchestrate redirects.  For instance, the “SloppyLemming” actor built a phishing platform (CloudPhish) that scrapes legitimate webmail login HTML and injects malicious links to a Cloudflare Worker redirector.  The worker hosts the fake login form and includes JavaScript that posts user activity to a **Discord** webhook (e.g. “User clicked the link…”).  In this flow, the attacker-provided webhook URL and redirect URL are configuration inputs.  After exfiltrating credentials, the site then redirects the victim to the real service, reducing suspicion.  Similarly, Morphing Meerkat kits query DNS MX records (via DoH) to load region- or language-specific phishing pages, and use a Telegram bot webhook to forward stolen credentials in real-time.  These approaches allow attackers to **cloak** the attack: they can serve benign decoys (e.g. a redirected-to legitimate page) and continually update phishing content via the webhook service.

![Figure](https://github.com/PureCypher/webhook-phish/blob/main/images/figure1.png) 

*Figure: Example attack chain (“Morphing Meerkat” PhaaS). (1) Attacker configures campaign in the phishing kit, (2) spawns phishing emails, (3) victim clicks the link, which (4) is resolved via DNS-over-HTTPS to fetch a dynamic phishing page. (5) The page is served (often tailored to the target’s email domain), and (6) captured credentials are sent to a Telegram channel via a bot webhook. Finally (7) the victim is redirected to the real login page.*

* **Dynamic Redirection:** Advanced kits often redirect victims through multiple domains or cloud services.  For example, after credential capture they might issue a 302 redirect to the legitimate login (via S3, CloudFront, or other CDN) to hide the attack.  Webhooks can facilitate this by acting as “controllers” – sending commands (e.g. change redirect targets) or content updates on-the-fly.
* **IoCs for Redirection:** Look for chains of redirects in web traffic or sudden jumps between known domains and generic CDN URLs.  Unusual DNS MX queries or DoH requests (as in Morphing Meerkat) can be a sign.  Watch for HTML/JS that contains fetches to webhook URLs or APIs.  File hashes of staged phishing pages or scripts (often PHP/JS) are also IOCs if known.
* **Evasion:** This vector leverages the same evasions as data exfiltration (TLS, domain fronting) but adds cloaking: victims see legitimate pages at the end, and automated scanners may see only static content.  Adversaries may geo-fence or user-agent check, so that only real users (not analysis tools) see the malicious behavior.

## SOC Detection and Mitigation Strategies

* **Endpoint Detection:** Use EDR/AV policies to block or alert on unusual uses of tools and scripts.  For instance, flag **LOLBins** such as `curl.exe`, `powershell.exe`, `msedge.exe`, or `wscript.exe` when invoked with network-posting flags (e.g. `-UseBasicParsing`, `--post-data`).  Hunt for suspicious command lines (`curl -X POST`, `Invoke-WebRequest`, `Invoke-RestMethod`, `python -c "import requests"`, etc.) on endpoints.  YARA rules can scan for hardcoded webhook patterns in binaries/scripts.  PowerShell or script logging (Sysmon EventID 1) should be enabled.
* **Network Monitoring:** Inspect proxy/IDS logs for connections to webhook domains.  For example, in Microsoft Sentinel one might query network logs for `discordapp.com/api/webhooks`, `hooks.slack.com/services`, `api.telegram.org/bot`, or any known webhook.site URLs.  Example KQL detection (Sentinel):

  ```kql
  DeviceNetworkEvents
  | where RemoteUrl has_any ("discordapp.com/api/webhooks", "hooks.slack.com/services", "api.telegram.org/bot", "webhook.site", "webhook")
  | project TimeGenerated, DeviceName, RemoteUrl, InitiatingProcessFileName
  ```

* **Behavioral Alerts:** Look for anomalous post-login or phishing indicators (e.g. PowerShell spawning `msedge.exe --headless`) as reported by CERT Ukraine.  Monitor SaaS audit logs for unexpected webhook creations (e.g. Slack/Teams connectors) or login events following credential-submission (indicating success).  In Sentinel, one can use analytics to detect new webhook subscriptions or service integrations.
* **Sandbox Analysis:** Execute suspicious attachments or scripts in a sandbox with full network visibility.  Capture outbound HTTP/S requests: malicious payloads often attempt POSTs to webhook URLs or Telegram bot APIs.  Tools like ANY.RUN or Cuckoo (with HTTPS interception) can reveal hidden webhook calls.  Specifically, intercept `Invoke-RestMethod`/`requests.post` calls and record the target URL/IP.  A properly instrumented sandbox will decode any encoded exfil payload and display the stolen data attempted to be sent.
* **MITRE ATT\&CK Mapping:** Malicious webhook use maps primarily to **T1567.004 (Exfiltration Over Webhook)**.  The phishing delivery itself is T1566 (“Phishing” – spearphishing link).  Other relevant techniques include T1090.004 (Domain Fronting), T1059 (Command and Scripting Interpreter), and T1074 (Data Staged) before exfil.  Defenders should align controls to these TTPs: for example, monitoring script execution (T1059.001/003) and network flows (T1041).

**Detection Query Examples (KQL):** For Microsoft Sentinel, the following KQL snippets illustrate hunting for webhook exfiltration activity.

* *Process Command-Lines:*

  ```kql
  DeviceProcessEvents
  | where ProcessCommandLine has_any ("curl -X POST", "Invoke-WebRequest", "wget --post-data", "python -c 'import requests'")
  | extend Risk=case(ProcessCommandLine has "curl -X POST", 9,
                      ProcessCommandLine has "Invoke-WebRequest", 9,
                      ProcessCommandLine has "wget --post-data", 8,
                      ProcessCommandLine contains "requests", 8)
  | where Risk >= 8
  | project TimeGenerated, DeviceName, InitiatingProcessFileName, ProcessCommandLine, Risk
  ```

* *Network Requests to Webhooks:*

  ```kql
  DeviceNetworkEvents
  | where RemoteUrl has_any ("discordapp.com/api/webhooks", "hooks.slack.com/services", "api.telegram.org/bot", "webhook.site")
  | project TimeGenerated, DeviceName, InitiatingProcessFileName, RemoteUrl
  ```

* *SaaS/Webhook Events:* If ingesting collaboration audit logs, filter for webhook or integration creation events.  In KQL (for Slack/Teams logs):

  ```kql
  OfficeActivity
  | where Operation in ("CreateIncomingWebhook", "InstallNewApp", "Add-Webhook")
  | where UserType == "Member"
  | project TimeGenerated, UserId, Operation, AppDisplayName, ClientIP
  ```


By combining process, network and sandbox monitoring, SOC teams can detect anomalous webhook traffic.  Practical controls include blocking known webhook domains at the perimeter, enforcing MFA (limiting impact of stolen credentials), and using DNS filtering to disallow DoH/DNS lookup of unknown mail domains.  Sandboxing suspicious phishing payloads with active network tracing will expose webhook callbacks. In summary, defenders should treat unexpected webhook/API traffic from endpoints as high risk, mapping it to T1567.004 and investigating immediately.

**Sources:** Recent threat intelligence and incident reports have documented these techniques in detail, and the above detection guidance follows MITRE recommendations.

### References: 
- [Exfiltration Over Web Service: Exfiltration Over Webhook, Sub-technique T1567.004 - Enterprise | MITRE ATT&CK®](https://attack.mitre.org/techniques/T1567/004/)
- [October 2023: Key Threat Actors, Malware and Exploited Vulnerabilities](https://www.picussecurity.com/resource/blog/october-2023-key-threat-actors-malware-and-exploited-vulnerabilities)
- [Here Comes TroubleGrabber: Stealing Credentials Through Discord - Netskope](https://www.netskope.com/blog/here-comes-troublegrabber-stealing-credentials-through-discord)
- [KurayStealer: A Bandit Using Discord Webhooks](https://www.uptycs.com/blog/threat-research-report-team/kuraystealer-a-bandit-using-discord-webhooks)
- [Unraveling SloppyLemming’s operations across South Asia | Cloudflare](https://www.cloudflare.com/threat-intelligence/research/report/unraveling-sloppylemmings-operations-across-south-asia/)
- [Canary Trap’s Bi-Weekly Cyber Roundup - Canary Trap](https://www.canarytrap.com/cyber-roundup-march-5/)
- [Proxy: Domain Fronting, Sub-technique T1090.004 - Enterprise | MITRE ATT&CK®](https://attack.mitre.org/techniques/T1090/004/)
- [PhaaS actor uses DoH and DNS MX to dynamically distribute phishing](https://blogs.infoblox.com/threat-intelligence/a-phishing-tale-of-doh-and-dns-mx-abuse/)
- [Unraveling SloppyLemming’s operations across South Asia | Cloudflare](https://www.cloudflare.com/threat-intelligence/research/report/unraveling-sloppylemmings-operations-across-south-asia/)
- [Critical Energy Infrastructure Facility Attack In Ukraine | by SIMKRA | Medium](https://medium.com/@simone.kraus/ritical-engergy-infrastructure-facility-in-ukraine-attack-b15638f6a402)
