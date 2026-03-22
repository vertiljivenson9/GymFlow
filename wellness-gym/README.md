# Wellness Gym Cabarete

A production-grade booking application for a tourist gym in Cabarete, Dominican Republic.

## Stack

- **Frontend**: React 18 + Vite + TypeScript
- **Backend**: Cloudflare Workers (Hono framework)
- **Database**: Firebase Firestore (REST API)
- **Design**: Brutalist minimal, CSS Modules only

## Project Structure

```
wellness-gym/
├── frontend/           # React + Vite application
│   ├── src/
│   │   ├── components/ # UI components
│   │   ├── pages/      # Page components
│   │   ├── styles/     # CSS modules & design system
│   │   ├── lib/        # API client & context
│   │   ├── types/      # TypeScript types
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── index.html
├── worker/             # Cloudflare Workers API
│   └── src/
│       ├── index.ts    # API routes
│       └── firebase.ts # Firebase REST client
├── shared/             # Shared types
└── package.json
```

## Quick Start

### Prerequisites

- Node.js 18+
- npm or bun
- Cloudflare account (for deployment)

### Development

```bash
# Install dependencies
npm install

# Run frontend dev server
npm run dev:frontend

# Run worker dev server (separate terminal)
npm run dev:worker
```

The frontend runs on `http://localhost:3000` and the worker on `http://localhost:8787`.

### Environment Setup

1. Copy `.env.example` to `.env`
2. Add your Firebase project ID
3. Configure KV namespace in wrangler.toml

### Deployment

```bash
# Build frontend
npm run build

# Deploy worker to Cloudflare
npm run deploy
```

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/services` | List all active services |
| GET | `/api/availability?serviceId&startDate` | Get available time slots |
| POST | `/api/create-booking` | Create a new booking |
| POST | `/api/create-payment` | Process payment |
| POST | `/api/webhook` | Payment webhook handler |
| GET | `/api/bookings/:id` | Get booking details |

## Booking Flow

1. **Service Selection** — Choose from training, classes, or wellness
2. **Time Selection** — Pick date and available time slot
3. **Customer Details** — Enter name, email, phone
4. **Payment** — Secure card payment

## Design System

### Colors
- **Primary**: `#0a0a0a` (black) / `#fafafa` (white)
- **Accent**: `#c45d3e` (terracotta)
- **Grays**: 9-step scale from `#f5f5f5` to `#171717`

### Typography
- **Display**: Space Grotesk (headings)
- **Body**: Inter (text)

### Spacing
- 8px base unit: 4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 64px, 80px, 96px

## Anti-Patterns Avoided

- Generic SaaS UI layouts
- Template-style designs
- AI-generated visual patterns
- Overuse of components
- Unnecessary animations
- Gradient backgrounds
- Heavy shadows
- Rounded cards everywhere
- Generic labels like "Submit" or "Click here"

## Humanization

- Real language: "Pick Your Session", "Choose a Time", "Confirm and Pay"
- Intentional design decisions
- No login required before payment
- Maximum 4 steps in booking flow
- Clear, direct copy throughout

## License

MIT
