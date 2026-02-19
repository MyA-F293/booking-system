# 🎨 EYSA Language Center - Theme Guide

Complete design system and brand guidelines for EYSA Language Center booking system.

---

## 📋 Table of Contents
1. [Tech Stack](#tech-stack)
2. [Brand Colors](#brand-colors)
3. [Typography](#typography)
4. [Logo & Branding](#logo--branding)
5. [UI Components](#ui-components)
6. [Gradients & Effects](#gradients--effects)
7. [Spacing & Layout](#spacing--layout)
8. [Icons & Emojis](#icons--emojis)
9. [Responsive Design](#responsive-design)
10. [Animation & Transitions](#animation--transitions)
11. [Landing Page Recommendations](#landing-page-recommendations)

---

## 🛠️ Tech Stack

### Frontend Framework
```json
{
  "framework": "React 18.3.1",
  "language": "JavaScript (ES6+)",
  "buildTool": "Vite 5.4.2",
  "styling": "Tailwind CSS 3.4.1"
}
```

### Core Libraries
```bash
# React & React DOM
react: ^18.3.1
react-dom: ^18.3.1

# Routing
react-router-dom: ^6.22.0

# State Management
# (Using React Context API - built-in)

# Backend/Database
@supabase/supabase-js: ^2.39.3

# UI Components & Icons
lucide-react: ^0.344.0

# Animations
lottie-react: ^2.4.0

# Excel/CSV Export
xlsx: ^0.18.5

# PDF Generation
jspdf: ^2.5.2

# Utilities
dompurify: ^3.2.2
date-fns: ^3.3.1
```

### Development Tools
```bash
# Build Tool
vite: ^5.4.2

# Linting
eslint: ^9.9.1
@eslint/js: ^9.9.1
eslint-plugin-react: ^7.35.0
eslint-plugin-react-hooks: ^5.1.0-rc.0
eslint-plugin-react-refresh: ^0.4.11

# PostCSS & Tailwind
tailwindcss: ^3.4.1
postcss: ^8.4.35
autoprefixer: ^10.4.17
```

### Recommended for Landing Page

#### Option 1: Same Stack (React + Vite + Tailwind)
```bash
# Create new Vite project
npm create vite@latest eysa-landing -- --template react

# Install dependencies
cd eysa-landing
npm install

# Install Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Install additional libraries
npm install lucide-react
npm install react-router-dom
```

#### Option 2: Next.js (Recommended for SEO)
```bash
# Create Next.js project with Tailwind
npx create-next-app@latest eysa-landing --typescript --tailwind --app

# Install additional libraries
npm install lucide-react
npm install framer-motion  # For advanced animations
```

#### Option 3: Static Site (HTML + Tailwind CDN)
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EYSA Language Center</title>
  
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  
  <!-- Custom Config -->
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            'navy': '#1F4E8C',
            'orange': '#F39C32',
          }
        }
      }
    }
  </script>
  
  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Montserrat:wght@700;800&display=swap" rel="stylesheet">
</head>
<body>
  <!-- Your landing page content -->
</body>
</html>
```

### Project Structure (React + Vite)
```
eysa-landing/
├── public/
│   ├── eysa-logo.svg
│   ├── eysa-icon.png
│   └── images/
├── src/
│   ├── components/
│   │   ├── Hero.jsx
│   │   ├── Features.jsx
│   │   ├── Programs.jsx
│   │   ├── Testimonials.jsx
│   │   ├── CTA.jsx
│   │   └── Footer.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

### Installation Commands
```bash
# Clone or create new project
npm create vite@latest eysa-landing -- --template react

# Navigate to project
cd eysa-landing

# Install dependencies
npm install

# Install Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Install UI libraries
npm install lucide-react

# Install animation library (optional)
npm install lottie-react

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Tailwind Configuration
```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'navy': {
          DEFAULT: '#1F4E8C',
          light: '#2a5fa3',
          dark: '#163a6b',
        },
        'orange': {
          DEFAULT: '#F39C32',
          light: '#f5a847',
          dark: '#e08a1f',
        },
        'dark-orange': {
          DEFAULT: '#E67E22',
          hover: '#D35400',
          darkest: '#C0392B',
        }
      },
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif'],
        'montserrat': ['Montserrat', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in',
        'slide-in-left': 'slideInLeft 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.5s ease-out',
        'slide-in-up': 'slideInUp 0.5s ease-out',
        'bounce-slow': 'bounceSlow 2s infinite',
        'pulse-slow': 'pulseSlow 3s infinite',
        'count-up': 'countUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        slideInLeft: {
          'from': { transform: 'translateX(-20px)', opacity: '0' },
          'to': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInRight: {
          'from': { transform: 'translateX(20px)', opacity: '0' },
          'to': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInUp: {
          'from': { transform: 'translateY(20px)', opacity: '0' },
          'to': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceSlow: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseSlow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        countUp: {
          'from': { transform: 'scale(0.8)', opacity: '0' },
          'to': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
```

### CSS Setup
```css
/* src/index.css */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Montserrat:wght@700;800&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply font-poppins;
  }
  
  h1, h2, h3, h4, h5, h6 {
    @apply font-montserrat;
  }
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}
```

### Deployment Options
```bash
# 1. Vercel (Recommended - Free)
npm install -g vercel
vercel

# 2. Netlify (Free)
npm install -g netlify-cli
netlify deploy

# 3. GitHub Pages (Free)
npm install -g gh-pages
npm run build
gh-pages -d dist

# 4. Traditional Hosting (cPanel, etc)
npm run build
# Upload 'dist' folder to public_html
```

### Environment Variables
```bash
# .env (if needed for API integration)
VITE_API_URL=https://your-api.com
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Performance Optimization
```javascript
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['lucide-react'],
        }
      }
    }
  }
})
```

---

---

## 🎨 Brand Colors

### Primary Colors
```css
/* Navy Blue - Primary Brand Color */
--navy-blue: #1F4E8C;
--navy-blue-light: #2a5fa3;
--navy-blue-dark: #163a6b;

/* Orange - Secondary Brand Color (Accent) */
--orange: #F39C32;
--orange-light: #f5a847;
--orange-dark: #e08a1f;

/* Darker Orange - For Admin/Fill Tab */
--dark-orange: #E67E22;
--dark-orange-hover: #D35400;
--dark-orange-darkest: #C0392B;
```

### Neutral Colors
```css
/* Grays */
--gray-50: #F9FAFB;
--gray-100: #F3F4F6;
--gray-200: #E5E7EB;
--gray-300: #D1D5DB;
--gray-400: #9CA3AF;
--gray-500: #6B7280;
--gray-600: #4B5563;
--gray-700: #374151;
--gray-800: #1F2937;
--gray-900: #111827;

/* White & Black */
--white: #FFFFFF;
--black: #000000;
```

### Semantic Colors
```css
/* Success - Green */
--success: #10B981;
--success-light: #34D399;
--success-dark: #059669;
--success-bg: #D1FAE5;

/* Warning - Amber */
--warning: #F59E0B;
--warning-light: #FBBF24;
--warning-dark: #D97706;
--warning-bg: #FEF3C7;

/* Error - Red */
--error: #EF4444;
--error-light: #F87171;
--error-dark: #DC2626;
--error-bg: #FEE2E2;

/* Info - Blue */
--info: #3B82F6;
--info-light: #60A5FA;
--info-dark: #2563EB;
--info-bg: #DBEAFE;
```

### Background Colors
```css
/* Page Backgrounds */
--bg-primary: linear-gradient(to bottom right, #FFF7ED, #FFFFFF, #FEF3C7);
--bg-orange-light: linear-gradient(to bottom right, #FFF7ED, #FFEDD5);
--bg-navy-light: linear-gradient(to bottom right, #EFF6FF, #DBEAFE);

/* Card Backgrounds */
--card-white: #FFFFFF;
--card-gray: #F9FAFB;
--card-orange: linear-gradient(to bottom right, #FFF7ED, #FFEDD5);
--card-blue: linear-gradient(to bottom right, #EFF6FF, #DBEAFE);
```

---

## 📝 Typography

### Font Families
```css
/* Primary Font - Poppins (Body Text) */
font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Secondary Font - Montserrat (Headings) */
font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Monospace - For IDs, Codes */
font-family: 'Courier New', Courier, monospace;

century ghotic yang utama
```

### Font Sizes (Tailwind)
```css
/* Mobile First Approach */
text-xs: 0.75rem;    /* 12px */
text-sm: 0.875rem;   /* 14px */
text-base: 1rem;     /* 16px */
text-lg: 1.125rem;   /* 18px */
text-xl: 1.25rem;    /* 20px */
text-2xl: 1.5rem;    /* 24px */
text-3xl: 1.875rem;  /* 30px */
text-4xl: 2.25rem;   /* 36px */
text-5xl: 3rem;      /* 48px */

/* Responsive Example */
className="text-sm sm:text-base lg:text-lg"
```

### Font Weights
```css
font-normal: 400;
font-medium: 500;
font-semibold: 600;
font-bold: 700;
font-extrabold: 800;
```

---

## 🏷️ Logo & Branding

### Logo Specifications
```
Format: SVG (vector) + PNG (raster backup)
Location: /public/eysa-logo.svg, /public/eysa-logo.png
Dimensions: 
  - Full Logo: 200x80px (2.5:1 ratio)
  - Icon Only: 80x80px (square)
  
Color Variations:
  1. Full Color (Navy + Orange)
  2. White (for dark backgrounds)
  3. Navy Only (monochrome)
  4. Orange Only (accent)
```

### Logo Usage
```jsx
{/* Header Logo */}
<img 
  src="/eysa-logo.svg" 
  alt="EYSA Logo" 
  className="h-6 sm:h-10 lg:h-14 w-auto drop-shadow-md"
/>

{/* Favicon */}
<link rel="icon" href="/eysa-icon.png" />
```

### Brand Name
```
Full Name: EYSA Language Center
Short Name: EYSA
Tagline: "Your Gateway to English Excellence"
```

---

## 🧩 UI Components

### Buttons

#### Primary Button (Navy Blue)
```jsx
<button className="bg-gradient-to-r from-[#1F4E8C] to-[#2a5fa3] hover:from-[#163a6b] hover:to-[#1F4E8C] text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl">
  Primary Action
</button>
```

#### Secondary Button (Orange)
```jsx
<button className="bg-gradient-to-r from-[#F39C32] to-[#f5a847] hover:from-[#e08a1f] hover:to-[#F39C32] text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl">
  Secondary Action
</button>
```

#### Darker Orange Button (Admin/Fill)
```jsx
<button className="bg-gradient-to-r from-[#E67E22] to-[#D35400] hover:from-[#D35400] hover:to-[#C0392B] text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl">
  Admin Action
</button>
```

#### Outline Button
```jsx
<button className="border-2 border-[#1F4E8C] text-[#1F4E8C] hover:bg-[#1F4E8C] hover:text-white px-6 py-3 rounded-xl font-semibold transition-all">
  Outline Button
</button>
```

### Cards

#### Standard Card
```jsx
<div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100 hover:shadow-xl transition-all">
  {/* Card Content */}
</div>
```

#### Featured Card (Orange Accent)
```jsx
<div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-orange-200 hover:shadow-xl hover:border-orange-300 transition-all">
  {/* Card Content */}
</div>
```

#### Card with Left Accent
```jsx
<div className="bg-white rounded-xl shadow-md p-4 border-2 border-gray-200 border-l-4 border-l-orange-500 hover:shadow-lg transition-all">
  {/* Card Content */}
</div>
```

### Headers

#### Hero Header (Navy Blue)
```jsx
<div className="bg-gradient-to-r from-[#1F4E8C] to-[#2a5fa3] rounded-2xl shadow-xl relative overflow-hidden">
  {/* Decorative Elements */}
  <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4"></div>
  <div className="absolute bottom-0 left-1/3 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
  
  <div className="relative z-10 p-6">
    <h1 className="text-3xl font-bold text-white">Welcome to EYSA</h1>
    <p className="text-blue-100 mt-2">Your Gateway to English Excellence</p>
  </div>
</div>
```

#### Section Header (Orange)
```jsx
<div className="bg-gradient-to-r from-[#F39C32] to-[#f5a847] rounded-xl p-4">
  <h2 className="text-xl font-bold text-white">Section Title</h2>
  <p className="text-orange-100 text-sm">Section description</p>
</div>
```

### Stats Cards
```jsx
<div className="bg-white rounded-2xl p-5 border-2 border-orange-200 shadow-sm hover:shadow-md transition-all">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-gray-600 mb-1">📚 Total Students</p>
      <p className="text-3xl font-bold text-[#F39C32]">150</p>
    </div>
    <div className="w-14 h-14 bg-gradient-to-br from-[#F39C32] to-[#e08a1f] rounded-xl flex items-center justify-center shadow-lg">
      <Users className="w-7 h-7 text-white" />
    </div>
  </div>
</div>
```

---

## 🌈 Gradients & Effects

### Background Gradients
```css
/* Page Background */
background: linear-gradient(to bottom right, #FFF7ED, #FFFFFF, #FEF3C7);

/* Orange Gradient */
background: linear-gradient(to right, #F39C32, #f5a847);

/* Navy Gradient */
background: linear-gradient(to right, #1F4E8C, #2a5fa3);

/* Darker Orange Gradient */
background: linear-gradient(to right, #E67E22, #D35400);
```

### Shadows
```css
/* Small Shadow */
box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);

/* Medium Shadow */
box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);

/* Large Shadow */
box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);

/* Extra Large Shadow */
box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1);

/* Colored Shadow (Orange) */
box-shadow: 0 10px 25px -5px rgba(243, 156, 50, 0.3);
```

### Backdrop Effects
```css
/* Blur */
backdrop-filter: blur(8px);
background: rgba(0, 0, 0, 0.5);

/* Glass Effect */
background: rgba(255, 255, 255, 0.8);
backdrop-filter: blur(10px);
border: 1px solid rgba(255, 255, 255, 0.3);
```

---

## 📏 Spacing & Layout

### Container Widths
```css
max-w-sm: 24rem;    /* 384px */
max-w-md: 28rem;    /* 448px */
max-w-lg: 32rem;    /* 512px */
max-w-xl: 36rem;    /* 576px */
max-w-2xl: 42rem;   /* 672px */
max-w-4xl: 56rem;   /* 896px */
max-w-6xl: 72rem;   /* 1152px */
max-w-7xl: 80rem;   /* 1280px */
```

### Padding & Margin
```css
/* Mobile First */
p-2: 0.5rem;   /* 8px */
p-3: 0.75rem;  /* 12px */
p-4: 1rem;     /* 16px */
p-5: 1.25rem;  /* 20px */
p-6: 1.5rem;   /* 24px */
p-8: 2rem;     /* 32px */

/* Responsive Example */
className="p-3 sm:p-4 lg:p-6"
```

### Border Radius
```css
rounded-lg: 0.5rem;   /* 8px */
rounded-xl: 0.75rem;  /* 12px */
rounded-2xl: 1rem;    /* 16px */
rounded-3xl: 1.5rem;  /* 24px */
rounded-full: 9999px; /* Circle */
```

---

## 🎯 Icons & Emojis

### Icon Library
```
Using: Lucide React Icons
Installation: npm install lucide-react
```

### Common Icons
```jsx
import { 
  Users,           // Students
  GraduationCap,   // Teachers
  Calendar,        // Schedule
  Clock,           // Time
  BookOpen,        // Classes
  CheckCircle,     // Success
  AlertCircle,     // Warning
  XCircle,         // Error
  BarChart3,       // Stats
  Upload,          // Import
  Download,        // Export
  Eye,             // View
  Edit2,           // Edit
  Trash2,          // Delete
  Plus,            // Add
  X,               // Close
  ChevronRight,    // Next
  ChevronLeft,     // Previous
  LogOut,          // Logout
  Key,             // Password
  Shield           // Security
} from 'lucide-react';
```

### Emoji Usage
```
📚 - Books/Learning
👥 - Students/Users
👨‍🏫 - Teachers
📅 - Calendar/Schedule
⏰ - Time
✅ - Success/Complete
⏱️ - Pending
❌ - Error/Cancel
🎓 - Education
🏆 - Achievement
📊 - Statistics
🔍 - Search
🌟 - Featured
🎉 - Celebration
🚀 - Launch/Start
💡 - Idea/Tip
⚡ - Fast/Quick
🔥 - Popular/Hot
🌙 - Monday
🔥 - Tuesday
🌿 - Wednesday
⚡ - Thursday
🎉 - Friday
🌟 - Saturday
☀️ - Sunday
```

---

## 📱 Responsive Design

### Breakpoints (Tailwind)
```css
/* Mobile First Approach */
sm: 640px   /* Small devices (landscape phones) */
md: 768px   /* Medium devices (tablets) */
lg: 1024px  /* Large devices (desktops) */
xl: 1280px  /* Extra large devices */
2xl: 1536px /* 2X Extra large devices */
```

### Responsive Patterns
```jsx
{/* Text Size */}
<h1 className="text-xl sm:text-2xl lg:text-4xl">Responsive Heading</h1>

{/* Padding */}
<div className="p-3 sm:p-4 lg:p-6">Responsive Padding</div>

{/* Grid */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Cards */}
</div>

{/* Flex Direction */}
<div className="flex flex-col sm:flex-row gap-4">
  {/* Items */}
</div>

{/* Hide/Show */}
<span className="hidden sm:inline">Desktop Only</span>
<span className="sm:hidden">Mobile Only</span>
```

---

## ✨ Animation & Transitions

### Transitions
```css
/* Standard Transition */
transition: all 0.3s ease;
className="transition-all duration-300"

/* Hover Effects */
className="hover:scale-105 hover:shadow-xl transition-all"
className="hover:bg-orange-600 transition-colors"
```

### Custom Animations (in index.css)
```css
/* Fade In */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.animate-fade-in {
  animation: fadeIn 0.5s ease-in;
}

/* Slide In */
@keyframes slideInLeft {
  from { transform: translateX(-20px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
.animate-slide-in-left {
  animation: slideInLeft 0.5s ease-out;
}

/* Bounce Slow */
@keyframes bounceSlow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
.animate-bounce-slow {
  animation: bounceSlow 2s infinite;
}

/* Pulse Slow */
@keyframes pulseSlow {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
.animate-pulse-slow {
  animation: pulseSlow 3s infinite;
}

/* Count Up (for numbers) */
@keyframes countUp {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
.animate-count-up {
  animation: countUp 0.5s ease-out;
}
```

---

## 🌐 Landing Page Recommendations

### Hero Section
```jsx
<section className="relative min-h-screen flex items-center justify-center overflow-hidden">
  {/* Background Gradient */}
  <div className="absolute inset-0 bg-gradient-to-br from-[#1F4E8C] via-[#2a5fa3] to-[#F39C32] opacity-90"></div>
  
  {/* Decorative Circles */}
  <div className="absolute top-0 left-0 w-96 h-96 bg-orange-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slow"></div>
  <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slow"></div>
  
  {/* Content */}
  <div className="relative z-10 max-w-6xl mx-auto px-4 text-center">
    <img src="/eysa-logo.svg" alt="EYSA" className="h-24 mx-auto mb-8 drop-shadow-2xl" />
    <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 animate-fade-in">
      EYSA Language Center
    </h1>
    <p className="text-xl md:text-2xl text-blue-100 mb-8 animate-slide-in-left">
      Your Gateway to English Excellence
    </p>
    <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-in-right">
      <button className="bg-white text-[#1F4E8C] px-8 py-4 rounded-xl font-bold text-lg hover:scale-105 transition-all shadow-2xl">
        Get Started
      </button>
      <button className="bg-[#F39C32] text-white px-8 py-4 rounded-xl font-bold text-lg hover:scale-105 transition-all shadow-2xl">
        Learn More
      </button>
    </div>
  </div>
</section>
```

### Features Section
```jsx
<section className="py-20 bg-gradient-to-br from-orange-50 via-white to-blue-50">
  <div className="max-w-7xl mx-auto px-4">
    <h2 className="text-4xl font-bold text-center text-[#1F4E8C] mb-4">
      Why Choose EYSA?
    </h2>
    <p className="text-xl text-center text-gray-600 mb-12">
      Modern learning platform with powerful features
    </p>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Feature Card */}
      <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all hover:scale-105 border-2 border-orange-200">
        <div className="w-16 h-16 bg-gradient-to-br from-[#F39C32] to-[#e08a1f] rounded-xl flex items-center justify-center mb-4">
          <BookOpen className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-[#1F4E8C] mb-3">Easy Booking</h3>
        <p className="text-gray-600">Book your classes online anytime, anywhere with our intuitive system.</p>
      </div>
      
      {/* More feature cards... */}
    </div>
  </div>
</section>
```

### CTA Section
```jsx
<section className="py-20 bg-gradient-to-r from-[#1F4E8C] to-[#2a5fa3] relative overflow-hidden">
  <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10"></div>
  
  <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
      Ready to Start Your Journey?
    </h2>
    <p className="text-xl text-blue-100 mb-8">
      Join hundreds of students improving their English skills
    </p>
    <button className="bg-[#F39C32] hover:bg-[#e08a1f] text-white px-12 py-5 rounded-xl font-bold text-xl transition-all shadow-2xl hover:scale-105">
      Enroll Now 🚀
    </button>
  </div>
</section>
```

### Footer
```jsx
<footer className="bg-[#1F4E8C] text-white py-12">
  <div className="max-w-7xl mx-auto px-4">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
      {/* Logo & Description */}
      <div className="col-span-2">
        <img src="/eysa-logo-white.svg" alt="EYSA" className="h-12 mb-4" />
        <p className="text-blue-200">
          EYSA Language Center - Your Gateway to English Excellence
        </p>
      </div>
      
      {/* Quick Links */}
      <div>
        <h4 className="font-bold mb-4">Quick Links</h4>
        <ul className="space-y-2 text-blue-200">
          <li><a href="#" className="hover:text-[#F39C32] transition-colors">About Us</a></li>
          <li><a href="#" className="hover:text-[#F39C32] transition-colors">Programs</a></li>
          <li><a href="#" className="hover:text-[#F39C32] transition-colors">Contact</a></li>
        </ul>
      </div>
      
      {/* Contact */}
      <div>
        <h4 className="font-bold mb-4">Contact</h4>
        <ul className="space-y-2 text-blue-200">
          <li>📧 info@eysa.com</li>
          <li>📱 +62 xxx xxxx</li>
          <li>📍 Jakarta, Indonesia</li>
        </ul>
      </div>
    </div>
    
    <div className="border-t border-blue-700 pt-8 text-center text-blue-200">
      <p>© 2026 EYSA Language Center. All rights reserved.</p>
    </div>
  </div>
</footer>
```

---

## 📦 Quick Reference

### Color Palette Summary
```
Primary: #1F4E8C (Navy Blue)
Secondary: #F39C32 (Orange)
Admin: #E67E22 (Darker Orange)
Success: #10B981 (Green)
Warning: #F59E0B (Amber)
Error: #EF4444 (Red)
```

### Component Sizes
```
Button: px-6 py-3 rounded-xl
Card: p-6 rounded-2xl
Header: p-4 sm:p-6
Modal: max-w-lg rounded-2xl
```

### Common Patterns
```jsx
{/* Gradient Button */}
className="bg-gradient-to-r from-[#F39C32] to-[#f5a847] hover:from-[#e08a1f] hover:to-[#F39C32]"

{/* Card with Hover */}
className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all"

{/* Responsive Text */}
className="text-sm sm:text-base lg:text-lg"

{/* Flex Center */}
className="flex items-center justify-center"
```

---

## 🎓 Best Practices

1. **Always use gradients** for primary actions (buttons, headers)
2. **Maintain 2:1 contrast ratio** for accessibility
3. **Use responsive classes** (sm:, md:, lg:) for all layouts
4. **Add transitions** to all interactive elements
5. **Use emojis sparingly** for visual interest
6. **Keep shadows consistent** across similar components
7. **Test on mobile first** before desktop
8. **Use brand colors consistently** - Navy for primary, Orange for accents

---

**Created for EYSA Language Center Booking System**
*Last Updated: February 2026*
