# SweetBites Bakery 🍰

A full-stack bakery e-commerce site — browse items, order, pay with Razorpay, and get delivery within 10km of Surat. Admin panel for CRUD + order management.

## Stack
- **Frontend**: React 18 + Vite + Tailwind CSS
- **State**: Zustand (cart, persisted)
- **Routing**: React Router v6
- **Backend**: Firebase (Auth + Firestore + Storage)
- **Maps**: Leaflet.js (free, no key)
- **Payments**: Razorpay
- **Deploy**: Vercel / Firebase Hosting

## Setup

### 1. Clone & Install
```bash
git clone <repo>
cd Bakery
npm install
```

### 2. Firebase Setup
1. Create a project at [Firebase Console](https://console.firebase.google.com)
2. Enable **Authentication** (Email/Password + Google)
3. Enable **Firestore** (start in test mode, then apply `firestore.rules`)
4. Enable **Storage**
5. Copy config values

### 3. Razorpay Setup
1. Sign up at [razorpay.com](https://razorpay.com)
2. Dashboard → Settings → API Keys → Generate Test Key
3. Copy the `Key ID`

### 4. Environment Variables
```bash
cp .env.example .env
# Fill in your Firebase + Razorpay keys
```

### 5. Run Dev Server
```bash
npm run dev
```

### 6. Admin Account
- Set admin email in `src/context/AuthContext.jsx` (`ADMIN_EMAILS` array)
- Default: `admin@sweetbites.com`
- Create this user in Firebase Auth Console

### 7. Deploy to Vercel
```bash
npm run build
# Push to GitHub → connect repo to Vercel → add env vars in Vercel dashboard
```

### 8. Firebase Hosting (optional)
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

## Bakery Location
Hardcoded at `lat: 21.1702, lng: 72.8311` (Surat, Gujarat). Change in `src/services/geolocation.js`.

## Features
- ✅ Item catalog (grid, search, veg/non-veg filter)
- ✅ Item detail page with qty selector
- ✅ Cart (Zustand, persisted, slide-out drawer)
- ✅ Delivery map (Leaflet, click or GPS pin)
- ✅ Distance validation (Haversine, max 10km)
- ✅ Razorpay UPI/card payment
- ✅ Order history page
- ✅ Admin panel (item CRUD, order status updates)
- ✅ Google + Email auth
- ✅ Mobile responsive
- ✅ PWA manifest
- ✅ SEO meta tags
