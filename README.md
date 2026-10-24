# Nalikeram Direct

A full-stack marketplace prototype that lets small coconut farmers in Kerala list their coconuts at their own price, and lets buyers contact them directly. Built to explore how a simple website could reduce the pricing disadvantage small farmers face when selling through middlemen.

**Live demo:** https://parvathykk2006.github.io/nalikeram-direct/
**API:** https://nalikeram-direct.onrender.com/api/listings

> The free server sleeps when idle, so the first load can take about a minute.

## Features
- Separate sign-up and login for Sellers (farmers) and Buyers (passwords hashed with SHA-256 in the browser)
- Seller dashboard: add and remove listings, live stats (listings, total coconuts, average price)
- Buyer dashboard: search by village or farmer name, sort by price, Call and WhatsApp buttons
- Reference price board to help farmers check a fair rate
- REST API (GET, POST, DELETE) with input validation, MongoDB storage and restricted CORS
- Responsive layout, original SVG illustrations, no external UI libraries

## Tech
- docs: HTML, CSS, vanilla JavaScript
- Backend: Node.js, Express, Mongoose
- Database: MongoDB Atlas
- Hosting: Render

## API
| Method | Endpoint | What it does |
|---|---|---|
| GET | /api/listings | List all listings |
| POST | /api/listings | Create a listing |
| DELETE | /api/listings/:id | Delete a listing |

## Run it locally
1. Copy `backend/.env.example` to `backend/.env` and fill in your MongoDB connection string
2. `cd backend`, then `npm install`, then `npm start`
3. Open `frontend/index.html` in your browser

## Limitations (this is a prototype)
- Accounts and login are stored in each user's own browser; only listings are shared through the database
- The API has no server-side authentication yet, so it is not production-ready
- Prices on the price board and the three starter listings are sample data

## Future work
- Server-side accounts with bcrypt and JWT, so only a seller can edit their own listings
- Malayalam language support
- Farmer verification and ratings

## Author
Parvathy KK
