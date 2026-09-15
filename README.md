# AcmeHealth — Adobe Stack Sandbox Site

A bare-bones static healthcare site for testing CJA, RTCDP, and AJO.

## Quick Start

Open a terminal, `cd` into this folder, and run **one** of these:

```bash
# Python (built-in on Mac)
python3 -m http.server 8080

# Node (if installed)
npx serve -p 8080

# PHP (if installed)
php -S localhost:8080
```

Then open **http://localhost:8080** in your browser.

> **Why a local server?** File:// protocol won't work well with Web SDK / Launch tags. You need localhost or a hostname.

## Adding Your Adobe Launch Tag

1. In Adobe Launch, grab your **Development** embed script
2. Open each `.html` file and paste it where you see the comment:
   ```html
   <!-- ADOBE LAUNCH EMBED CODE — PASTE HERE -->
   ```
3. Or do it once with a quick find-replace across all files

## Tracking Data Attributes

Every interactive element has `data-track-*` attributes ready for Launch rules:

| Attribute | Purpose | Example |
|-----------|---------|---------|
| `data-track-action` | Event name | `cta-click`, `plan-select`, `rx-refill` |
| `data-track-section` | Page section | `hero`, `quick-links`, `search` |
| `data-track-detail` | Contextual detail | `silver`, `dr-chen`, `lisinopril` |

The JS console logs every tracked click — open DevTools to verify before wiring up Launch rules.

## Pages

| Page | File | Key interactions for testing |
|------|------|------------------------------|
| Homepage | `index.html` | Hero CTAs, quick links, resource cards |
| Plans | `plans.html` | Tab switching, plan selection, comparison table |
| Find a Doctor | `doctors.html` | Search, specialty filter, book appointment |
| Pharmacy | `pharmacy.html` | Rx refill, drug cost estimator form |
| Login | `login.html` | Sign in form, social login, registration CTA |
| Appointments | `appointments.html` | Scheduling form, time slots, telehealth CTA |

## Suggested Web SDK / CJA Use Cases

- **Page views** — track cross-page navigation funnels
- **Plan comparison** — which plans get the most views, tab switches, selects
- **Doctor search → booking** — conversion funnel from search to appointment
- **Rx refill flow** — engagement with pharmacy features
- **Auth events** — sign-in attempts, registration interest, social login preference
- **AJO web personalization** — swap hero content, inject banners, test plan recommendations
- **RTCDP segments** — build audiences based on plan interest, pharmacy engagement, etc.
