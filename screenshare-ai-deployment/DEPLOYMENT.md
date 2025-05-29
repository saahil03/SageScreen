# Deployment Guide

This app requires a hosting platform that supports WebSocket connections. Here are the best free options:

## 1. Railway (Recommended)

Railway offers free hosting with WebSocket support and is perfect for this app.

**Steps:**
1. Create account at [railway.app](https://railway.app)
2. Connect your GitHub repository
3. Deploy automatically - Railway detects Node.js and builds automatically
4. Your app will be available at `https://your-app.railway.app`

**Pros:** WebSocket support, automatic deployments, free tier includes databases

## 2. Render

Render provides free hosting for web services with WebSocket support.

**Steps:**
1. Create account at [render.com](https://render.com)
2. Connect GitHub repository
3. Create new "Web Service"
4. Set build command: `npm run build`
5. Set start command: `npm start`
6. Deploy automatically

**Pros:** Generous free tier, automatic SSL, WebSocket support

## 3. Replit Deployments

Since you're already using Replit, you can deploy directly:

**Steps:**
1. Click the "Deploy" button in your Replit project
2. Choose "Autoscale" deployment
3. Your app will be deployed automatically
4. Get a `.replit.app` domain

**Pros:** Seamless integration, no configuration needed

## 4. Heroku (Limited Free)

Heroku has limited free options but supports WebSockets.

**Steps:**
1. Install Heroku CLI
2. Create Heroku app: `heroku create your-app-name`
3. Add Procfile with: `web: npm start`
4. Deploy: `git push heroku main`

**Note:** Heroku's free tier has limitations on uptime.

## Environment Variables Needed

For any platform, set these if using external services:
- `NODE_ENV=production`
- `PORT` (usually auto-detected)

## Build Configuration

The app is already configured with:
- Build command: `npm run build`
- Start command: `npm start`
- Static files served from `dist/`

## Testing Deployment

After deployment:
1. Visit `/laptop` to test laptop interface
2. Visit `/pairing` to test mobile interface  
3. Test WebSocket connection by creating a session
4. Verify screen sharing permissions work in HTTPS environment

## Important Notes

- Screen sharing requires HTTPS (all platforms provide this)
- WebSocket connections need proper hosting support
- The app uses in-memory storage, so sessions reset on restart
- No external API keys required for basic functionality

## Troubleshooting

If WebSockets don't work:
- Check platform supports WebSocket upgrades
- Verify HTTPS is enabled
- Test with browser developer tools

Choose Railway or Render for the best experience with this type of application.