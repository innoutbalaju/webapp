# Hotel Room Service & Auto-Print Web App

A lightweight, real-time Hotel Room Service ordering web application built with React, Tailwind CSS, and Supabase. Features a Mobile-First Guest Portal and a Desktop Admin Dashboard with automated 80mm thermal receipt printing via WebUSB.

## Features

### Guest Portal (Mobile-First)
- **Secure Login**: Google OAuth + Room Number + 4-digit check-in PIN verification.
- **Room Binding**: Google ID is automatically linked to the room on first successful login.
- **Real-time Status**: Live order tracking (Placed → Preparing → Delivered).
- **Session Protection**: Immediate logout if the room is blocked or checked out.
- **Rate Limiting**: Prevents abuse with order interval checks.

### Admin Dashboard (Desktop)
- **Live Order Queue**: Real-time order notifications with audio chimes.
- **Auto-Print**: Automatic 80mm thermal receipt printing via WebUSB (ESC/POS).
- **Room Management**: Reset PINs, check out guests, or block rooms.
- **Menu Management**: Manage items, pricing, and availability.
- **Sales Reports**: Daily and historical sales overview.

## Tech Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Zustand.
- **Backend**: Supabase (Auth, PostgreSQL, Realtime, RLS).
- **Printing**: WebUSB + `@point-of-sale/receipt-printer-encoder` (ESC/POS).
- **Hosting**: GitHub Pages (HashRouter for SPA support).

## Prerequisites
- **Node.js**: v18 or higher.
- **Supabase Project**: A free Supabase project with Google OAuth enabled.
- **Browser**: Chromium-based (Chrome, Edge) required for WebUSB printing.

## Setup Instructions

### 1. Supabase Configuration
1. Run the migration script found in `migrations/01_initial_schema.sql` in your Supabase SQL Editor.
2. Enable Google OAuth in **Authentication > Providers**.
3. Add your deployment URL to the **Redirect URLs** in Supabase Auth settings.

### 2. Environment Variables
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Installation
```bash
npm install
```

### 4. Development
```bash
npm run dev
```

### 5. Deployment (GitHub Pages)
1. Build the project:
   ```bash
   npm run build
   ```
2. Deploy the `dist` folder to GitHub Pages.

## Printing Notes
- Ensure your thermal printer is connected via USB and is not claimed by another driver (on Windows, you might need to use [Zadig](https://zadig.akeo.ie/) to install the WinUSB driver for the printer).
- The dashboard will show a "Connected" status when the printer is successfully paired via the "Connect Printer" button.

## Security & Validation
- **Price Integrity**: Total prices are computed server-side via a PostgreSQL trigger.
- **RLS**: Row Level Security ensures guests only access their own room and orders.
- **Validation**: Server-side checks for item availability, room status, and rate limits.
