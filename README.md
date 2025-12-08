# Nordholm Auction House

A modern auction platform built with HTML, Tailwind CSS, and vanilla JavaScript, fully integrated with the Noroff Auction API. Users can register, log in, create listings, bid on items, edit their profile, and browse auctions in a clean and elegant UI.

---

## Features

Authentication

- Register and log in via Noroff API.
- Auth is stored securely in localStorage.
- Pages gated with auth guards.
- Auto-redirect after login/logout.

Profile Page

- View profile details: username, email, bio, avatar, banner, credits.
- Edit profile (avatar, banner, bio) with live API updates.
- Tabs for: My Listings, My Bids & My Wins.
- Owner-only listing edit cogwheel.

Listings

- Fetch & display listings with seller info, bids, and timers.
- Create, update, delete listings.
- Place bids.
- Individual listing pages with detailed info.
- Fully responsive cards with hover effects.

---

## Tech Stack

- HTML
- Tailwind CSS
- Vanilla JavaScript
- Noroff Auction API v2

---

## Project Setup

1. Get a free API Key at https://docs.noroff.dev/docs/v2/auth/api-key.
2. Clone the repo

```bash
git clone "https://github.com/JKollerud/semesterProject2.git"
```

3. Install NPM packages

```bash
npm install
```

4. Enter your API in config.js

```bash
const API_KEY = 'ENTER_YOUR_API_KEY';
```

5. Start development (Tailwind watch + local server)

```bash
npm run dev
```

6. Build minifield CSS for production

```bash
npm run build
```

## Folder Structure

```
semesterProject2/
├── index.html
├── listings.html
├── listing-page.html
├── login.html
├── register.html
├── profile.html
├── create-listing.html
├── edit-listing.html
├── assets/
│   ├── icons/
│   └── images/
├── js/
│   ├── profile-page.js
│   ├── listing-page.js
│   ├── create-listing-page.js
│   ├── register.js
│   ├── login.js
│   ├── listings.js
│   ├── index.js
│   ├── edit-listing.js
│   ├── api/
│   │   ├── auth.js
│   │   ├── config.js
│   │   ├── listings.js
│   │   └── profiles.js
│   └── utils/
│       ├── nav.js
│       ├── storage.js
│       ├── guards.js
│       └── date.js
└── README.md
```

## Author

Student: Joakim Kollerud

Course: Noroff Front-End Development - Semester Project 2
