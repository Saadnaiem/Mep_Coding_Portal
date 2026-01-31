# Deployment Instructions for Render

This project is configured for deployment on [Render](https://render.com/).

## Prerequisites

1.  A GitHub repository containing this code.
2.  A Render account.

## Automated Deployment (Blueprint)

1.  In the Render Dashboard, go to **Blueprints**.
2.  Click **New Blueprint Instance**.
3.  Connect to your GitHub repository.
4.  Render will detect the `render.yaml` file and automatically configure the service.
5.  You will be prompted to enter the values for the Environment Variables configured in `render.yaml`.

## Manual Deployment

If you prefer to set it up manually as a Static Site:

1.  **New Static Site** in Render.
2.  **Build Command**: `npm install && npm run build`
3.  **Publish Directory**: `dist`
4.  **Rewrites / Redirects**:
    *   **Source**: `/*`
    *   **Destination**: `/index.html`
    *   **Action**: Rewrite
5.  **Environment Variables**:
    *   `VITE_SUPABASE_URL`: Your Supabase Project URL.
    *   `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Public Key.

## Environment Variables

Ensure the following variables are set in your Render dashboard:

*   `VITE_SUPABASE_URL`
*   `VITE_SUPABASE_ANON_KEY`
