# HealthAI - Medical Assistant Application

A comprehensive healthcare management application built with modern web technologies.

## Features

- **AI-Powered Diagnosis**: Get intelligent health insights using advanced AI
- **Appointment Management**: Schedule and manage medical appointments
- **Doctor Directory**: Find and connect with healthcare professionals
- **Medical Document Storage**: Securely store and access medical records
- **Pharmacy Locator**: Find nearby pharmacies and medications
- **Real-time Chat**: Communicate with healthcare providers

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <YOUR_REPOSITORY_URL>
cd healthai
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:8080`.

## Technologies Used

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **Backend**: Supabase (Database & Edge Functions)
- **State Management**: TanStack Query
- **Routing**: React Router

## Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Application pages/routes
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
├── integrations/       # External service integrations
└── types/              # TypeScript type definitions
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions to Vercel.

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License.
