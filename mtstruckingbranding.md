# MTS Trucking Incorporation
## Web Branding & Design Guidelines

This document serves as the foundational design system for MTS Trucking Incorporation, derived directly from the primary brand logo. The aesthetic communicates industrial strength, forward momentum, and established reliability.

---

## 1. Core Visual Identity

The brand relies on a stark, high-contrast palette. The bold geometry of the forward-pointing chevrons dictates a modern, grid-based web layout with sharp, decisive lines.

### Brand Color Palette

**Primary Colors (High Impact & Typography)**
* **Industrial Black:** `#111111` (Primary headings, strong backgrounds)
* **Chevron Red:** `#E3000F` (Primary Call-to-Action buttons, active states, key visual accents)
* **Pristine White:** `#FFFFFF` (Primary background to maintain clean negative space)

**Secondary Colors (Structural & Supporting)**
* **Charcoal Gray:** `#4A4A4A` (Left logo chevron; use for secondary buttons, dark mode borders)
* **Steel Gray:** `#7A7A7A` (Subtitle text; use for secondary body text, inactive states, subtle borders)
* **Light Ash:** `#F4F4F5` (Use for alternating section backgrounds to break up white space)

---

## 2. Typography System

The typography should echo the solid, sans-serif nature of the MTS logotype and the clean lines of the "INCORPORATED" subtitle.

* **Display & Headings:** `Montserrat` (Bold/Black)
    * *Usage:* Hero sections, primary section titles. Use uppercase for high-impact statements to mirror the "MTS" logomark.
* **Body & UI Elements:** `Inter` or `Roboto` (Regular/Medium)
    * *Usage:* Paragraphs, data tables, navigation links. Optimized for high legibility in dense logistical tracking dashboards.

---

## 3. UI/UX Component Directives

* **Buttons & CTAs:** Solid **Chevron Red** backgrounds with **Pristine White** text. Avoid rounded corners (border-radius: 0 or 2px max) to maintain the sharp, industrial feel of the logo's geometry.
* **Accents:** Utilize right-leaning diagonal lines or subtle chevron patterns as background textures or section dividers to subtly reinforce the logo's forward momentum.
* **Shadows:** The "MTS" logo features a distinct hatched/diagonal drop shadow. For web UI, translate this into crisp, hard-edged offset shadows (e.g., `box-shadow: 4px 4px 0px #111111`) on primary cards or featured images rather than soft, blurred drop shadows.

---

## 4. Development Foundation (Tailwind CSS)

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        mts: {
          black: '#111111',
          red: '#E3000F',
          charcoal: '#4A4A4A',
          steel: '#7A7A7A',
          ash: '#F4F4F5',
          white: '#FFFFFF'
        }
      },
      fontFamily: {
        heading: ['Montserrat', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'industrial': '4px 4px 0px 0px rgba(17, 17, 17, 1)',
      }
    }
  }
}