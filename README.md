# Tale Weave

AI-Generated Children's Story Platform - Create custom stories with AI-generated text, images, and audio narration.

## Features

- ✨ **AI-Generated Stories**: Custom stories using GPT-4o tailored to child's name, age, and interests
- 🎨 **Beautiful Images**: Stunning illustrations generated with Flux AI for each story page
- 🎵 **Audio Narration**: Professional voice narration using ElevenLabs
- 💳 **Flexible Pricing**: Pay per story ($1.99) or monthly subscription ($9.99/unlimited)
- 📄 **Export Options**: Download stories as PDF or ePub

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **AI Services**:
  - OpenAI (GPT-4o) for story generation
  - Replicate (Flux) for image generation
  - ElevenLabs for audio narration
- **Payments**: Stripe
- **Styling**: Tailwind CSS
- **Typography**: Fredoka (headings), Nunito (body)

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- Supabase account and project
- API keys for:
  - OpenAI
  - Replicate
  - ElevenLabs
  - Stripe

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Database (optional - for direct connection)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Replicate
REPLICATE_API_TOKEN=your_replicate_api_token

# ElevenLabs
ELEVENLABS_API_KEY=your_elevenlabs_api_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# App URL
NEXT_PUBLIC_APP_URL=https://lightslategray-caribou-743803.hostingersite.com
```

### 4. Database Setup

Run the SQL schema in your Supabase project:

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and run the SQL from `database/schema.sql`

This will create:
- `users` table
- `stories` table
- `story_pages` table
- `user_credits` table
- Storage buckets for images and audio
- Row Level Security policies

### 5. Static Assets

Copy the logo files from the `Branding` folder to the `public` folder:

```bash
cp Branding/tw-logo.ico public/
cp Branding/twlogo-full.svg public/
```

### 6. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see your app.

### 7. Build for Production

```bash
npm run build
npm start
```

## Deployment to Hostinger

### Option 1: Git Deployment

1. Push your code to GitHub repository
2. Connect Hostinger to your repository
3. Set build command: `npm run build`
4. Set start command: `npm start`
5. Add all environment variables in Hostinger dashboard

### Option 2: FTP Deployment

1. Build the project locally: `npm run build`
2. Upload the following to `public_html`:
   - `.next` folder
   - `public` folder
   - `package.json`
   - `node_modules` (or install on server)
3. SSH into server and run:
   ```bash
   cd public_html
   npm install --production
   npm start
   ```
4. Configure environment variables on the server

### Stripe Webhook Setup

1. Create a webhook endpoint in Stripe dashboard
2. Set URL: `https://lightslategray-caribou-743803.hostingersite.com/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

## Project Structure

```
taleweave/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── checkout/     # Stripe checkout
│   │   ├── stories/      # Story management
│   │   └── webhooks/     # Stripe webhooks
│   ├── create/           # Story creation page
│   ├── login/            # Login page
│   ├── signup/           # Signup page
│   ├── pricing/          # Pricing page
│   ├── stories/[id]/     # Story viewer
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Home page
│   └── globals.css       # Global styles
├── lib/
│   └── supabase/         # Supabase client utilities
├── public/               # Static assets
├── database/
│   └── schema.sql        # Database schema
├── Branding/             # Logo files (copy to public/)
├── Fonts/                # Custom fonts
└── middleware.ts         # Next.js middleware
```

## Color Palette

- Coral: `#FF6B6B`
- Turquoise: `#4ECDC4`
- Lemon: `#FFE66D`
- Mint: `#95E1D3`
- White: `#FFFFFF`

## License

© 2024 Tale Weave. All rights reserved.

