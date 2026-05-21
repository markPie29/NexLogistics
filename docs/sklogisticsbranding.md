SK Logistics Services: Web Branding Guidelines
1. Core Visual Identity (Light Theme)
Primary Background: Pristine White (#FFFFFF).  

Secondary Background: Glacial Gray (#F8F9FA).  

Text: Charcoal (#212529).  

Accents (Interactive Elements): Velocity Red (#D31A21) and Engine Burgundy (#6A0B0B).  

2. Typography
Headings: Montserrat (Black Italic/Bold) to convey speed and authority.  

Body & UI: Roboto for high legibility in tracking interfaces and data tables.  

3. UI Components
Primary Buttons: Linear gradient from Velocity Red to Engine Burgundy (to right, #D31A21, #6A0B0B) with white, uppercase Montserrat Bold text.  

Navigation: Sticky top navbar with a white background and subtle bottom shadow; text links hover to Velocity Red.  

Layout Blocks: Minimalist grid using alternating White and Glacial Gray backgrounds to separate sections without heavy borders.  

Footer: Solid Engine Burgundy (#6A0B0B) background with white text to anchor the page.  

4. Tailwind CSS Configuration
JavaScript
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#D31A21',
          burgundy: '#6A0B0B',
          white: '#FFFFFF',
          offwhite: '#F8F9FA',
          charcoal: '#212529',
          border: '#DEE2E6'
        }
      },
      fontFamily: {
        heading: ['Montserrat', 'sans-serif'],
        body: ['Roboto', 'sans-serif'],
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(to right, #D31A21, #6A0B0B)',
      }
    }
  }
}