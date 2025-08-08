# Pai - AI Digital Twins for Market Research

A Next.js website for Pai, a next-generation market research platform that turns real people into rich, queryable digital personas.

## Features

- **Landing Page**: Compelling value proposition with problem/solution presentation
- **User Onboarding**: Multi-step signup flow with demographics and personality assessment
- **Category Selection**: Users can opt into specific categories for deeper profiling
- **Client Dashboard**: Interactive chat interface to query digital twins
- **Subscription Plans**: Tiered pricing with detailed feature comparison
- **Responsive Design**: Mobile-friendly across all devices

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS with shadcn/ui components
- **TypeScript**: Full type safety
- **Icons**: Lucide React
- **Deployment**: Optimized for Vercel

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd pai-website
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing page
│   ├── signup/               # User registration flow
│   ├── personality-test/     # Personality assessment
│   ├── categories/           # Category selection
│   ├── dashboard/           # Client dashboard
│   ├── login/               # User login
│   └── pricing/             # Subscription plans
├── components/
│   └── ui/                  # Reusable UI components
└── lib/
    └── utils.ts             # Utility functions
```

## Key Pages

### Landing Page (`/`)
- Hero section with value proposition
- Problem statement (traditional market research issues)
- Solution overview with benefits
- How it works process
- Pricing preview
- Trust indicators and CTA

### Signup Flow
1. **Signup** (`/signup`) - Account creation with demographics
2. **Personality Test** (`/personality-test`) - 8-question assessment
3. **Categories** (`/categories`) - Opt into research categories
4. **Dashboard** (`/dashboard`) - Complete onboarding

### Dashboard (`/dashboard`)
- Interactive chat interface
- Filter digital twins by demographics
- Query suggestions
- Panel statistics
- Quick action cards

### Pricing (`/pricing`)
- Three-tier subscription model (Starter, Professional, Enterprise)
- Feature comparison table
- Trust indicators
- FAQ section

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Vercel will automatically detect Next.js and configure build settings
3. Deploy with zero configuration

### Manual Build

```bash
npm run build
npm start
```

## Environment Variables

No environment variables required for basic functionality. For production, you may want to add:

- `NEXT_PUBLIC_API_URL` - Backend API endpoint
- Analytics tracking IDs
- Authentication providers

## Customization

### Brand Colors
Edit `src/app/globals.css` to modify the CSS custom properties:
- `--primary` - Main brand color (currently blue)
- `--secondary` - Secondary color
- `--accent` - Accent color for highlights

### Content
All content is hardcoded in components. Key areas to customize:
- Company name and logo (currently "Pai")
- Value propositions and messaging
- Pricing tiers and features
- Contact information

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

Private project - All rights reserved.
