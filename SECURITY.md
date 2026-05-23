# Security Policy for Mivio (Mivio Smart TV)

At Mivio, we take the security of our users and their media streaming setups very seriously. We want to ensure that Mivio remains a secure and trusted media center for the Mivio Smart TV Ecosystem.

## Supported Versions

Only the latest active release on the `beta` or `main` branches is actively supported with security updates.

| Version | Supported |
| ------- | --------- |
| Smart TV Web Engine | :white_check_mark: Yes |
| Older Versions | :x: No |

## Reporting a Vulnerability

If you discover a security vulnerability in Mivio (such as credentials handling, network exposure in SMB/WebDAV scanning, or local sandbox bypasses), **please do not open a public issue.** Instead, report it privately so we can investigate and patch the issue responsibly.

### How to Report
Please send an email to Alberto Licea at **albertolicea00@gmail.com** (or the respective maintainer email) with:
1. A descriptive title outlining the vulnerability.
2. A detailed description of the vulnerability and its potential impact.
3. Steps to reproduce the issue (including a Proof of Concept if possible).
4. Details of the system configuration you tested (e.g. Samsung TV 2023, LG OLED C2).

We will acknowledge receipt of your report within **48 hours** and strive to provide a resolution or patch within **30 days**.

## Secure Practices in Mivio
To maintain the highest standard of security for media servers:
- **Keychain Storage:** We store sensitive connection data, such as SMB passwords and WebDAV bearer tokens, securely in the secure encrypted storage using our custom storage adapters. We never persist raw credentials to database models or user defaults.
- **App Sandboxing:** All platform targets (iOS, tvOS, visionOS, and macOS App Store builds) run in full compliance with platform-specific sandbox rules.
- **Local Network Usage:** Network protocols such as SMB (AMSMB2/libsmb2) and WebDAV use sandboxed client wrappers and explicitly ask for Local Network permissions.
