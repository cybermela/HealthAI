# Vercel Deployment Guide

This guide will help you deploy your HealthAI React application to Vercel.

## Prerequisites
- A Vercel account (sign up at [vercel.com](https://vercel.com) if you don't have one)
- Your project repository pushed to GitHub, GitLab, or Bitbucket
- Supabase project set up with the necessary tables and functions

## Deployment Steps

### 1. Connect Repository to Vercel
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your repository from GitHub/GitLab/Bitbucket
4. Vercel should automatically detect this as a Vite React project

### 2. Configure Build Settings
Vercel should auto-detect the following settings:
- **Framework Preset**: Vite
- **Root Directory**: `./`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

If not auto-detected, set them manually in the project settings.

### 3. Set Environment Variables
In your Vercel project dashboard:
1. Go to Settings > Environment Variables
2. Add the following variables:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

Replace with your actual Supabase project values.

If your app uses AI services through Supabase functions, you may also need:
```
LOVABLE_API_KEY=your_ai_api_key
```

### 4. Deploy
1. Click "Deploy"
2. Vercel will build and deploy your app
3. Once deployed, you'll get a `.vercel.app` URL

## Post-Deployment Checklist

- [ ] Verify the app loads at the Vercel URL
- [ ] Test all routes work correctly (SPA routing with React Router)
- [ ] Check Supabase authentication works
- [ ] Test data fetching from Supabase
- [ ] Verify file uploads work (if applicable)
- [ ] Test AI diagnosis functionality (ensure Supabase functions are deployed separately)

## Configuration Files

Your project includes:
- `vercel.json`: Configures SPA routing for client-side navigation
- `vite.config.ts`: Standard Vite configuration
- `package.json`: Includes build scripts

## Troubleshooting

### 404 Errors on Refresh
The `vercel.json` file handles SPA routing. If you still get 404s:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Build Failures
- Check Vercel build logs for errors
- Ensure all dependencies are listed in `package.json`
- Verify Node.js version compatibility

### Environment Variables Not Working
- Double-check variable names (case-sensitive)
- Ensure variables are set for the correct environment (Production, Preview, Development)
- Restart deployments after adding new variables

### Supabase Connection Issues
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are correct
- Check Supabase project settings for CORS configuration
- Ensure Supabase functions are deployed and accessible

## Additional Notes

- Supabase Edge Functions need to be deployed separately to Supabase, not Vercel
- For production, consider setting up proper error monitoring and analytics
- Configure custom domains in Vercel project settings if needed
