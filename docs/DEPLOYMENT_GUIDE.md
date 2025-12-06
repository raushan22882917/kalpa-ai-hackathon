# Deployment Guide - Kalpa AI

Deploy your projects to production with one click, just like Lovable.dev!

## Overview

Kalpa AI allows you to connect your own deployment accounts and deploy directly from the IDE. You maintain full control over your deployments and data.

## Supported Platforms

### ▲ Vercel
- **Best for**: Next.js, React, Vue, Static sites
- **Free Tier**: 100GB bandwidth, unlimited deployments
- **Features**: Automatic HTTPS, CDN, Serverless functions

### ◆ Netlify
- **Best for**: Static sites, JAMstack apps
- **Free Tier**: 100GB bandwidth, 300 build minutes
- **Features**: Forms, Functions, Split testing

### 📄 GitHub Pages
- **Best for**: Static sites, Documentation
- **Free Tier**: Unlimited for public repos
- **Features**: Custom domains, HTTPS

### 🚂 Railway
- **Best for**: Full-stack apps, Databases
- **Free Tier**: $5 credit/month
- **Features**: Databases, Docker support

### 🎨 Render
- **Best for**: Web services, Static sites
- **Free Tier**: 750 hours/month
- **Features**: Auto-deploy, Custom domains

## Quick Start

### 1. Open Deployment Panel

Click the **🚀 Deploy** icon in the activity bar (left sidebar)

### 2. Connect a Platform

Choose your preferred platform and click **"Connect"**

### 3. Enter API Key

Follow the instructions to get your API key from the platform

### 4. Deploy!

Click **"Deploy"** and your project goes live!

## Platform Setup Guides

### Vercel Setup

1. **Get API Token**
   - Go to https://vercel.com/account/tokens
   - Click "Create Token"
   - Give it a name (e.g., "Kalpa AI")
   - Copy the token

2. **Connect in Kalpa AI**
   - Click "Connect" on Vercel card
   - Paste your API token
   - Click "Connect"

3. **Deploy**
   - Click "Deploy" button
   - Your project is live at `https://your-project.vercel.app`

**Vercel Features:**
- Automatic HTTPS
- Global CDN
- Instant rollbacks
- Preview deployments
- Environment variables
- Custom domains

### Netlify Setup

1. **Get API Token**
   - Go to https://app.netlify.com/user/applications
   - Click "New access token"
   - Give it a name
   - Copy the token

2. **Connect in Kalpa AI**
   - Click "Connect" on Netlify card
   - Paste your API token
   - (Optional) Enter Site ID if you have one
   - Click "Connect"

3. **Deploy**
   - Click "Deploy" button
   - Your project is live at `https://your-site.netlify.app`

**Netlify Features:**
- Form handling
- Serverless functions
- Split testing
- Deploy previews
- Custom domains
- Analytics

### GitHub Pages Setup

1. **Connect GitHub**
   - First connect your GitHub account (Source Control panel)
   - Enable Pages in your repository settings

2. **Deploy**
   - Select the repository
   - Choose branch (usually `main` or `gh-pages`)
   - Your site is live at `https://username.github.io/repo`

**GitHub Pages Features:**
- Free for public repos
- Custom domains
- HTTPS included
- Jekyll support
- Simple and reliable

### Railway Setup

1. **Get API Token**
   - Go to https://railway.app/account/tokens
   - Click "Create Token"
   - Copy the token

2. **Connect in Kalpa AI**
   - Click "Connect" on Railway card
   - Paste your API token
   - Click "Connect"

3. **Deploy**
   - Click "Deploy" button
   - Your app is deployed with a Railway URL

**Railway Features:**
- Databases included
- Docker support
- Environment variables
- Automatic HTTPS
- Custom domains
- Metrics and logs

### Render Setup

1. **Get API Key**
   - Go to https://dashboard.render.com/account/api-keys
   - Click "Create API Key"
   - Copy the key

2. **Connect in Kalpa AI**
   - Click "Connect" on Render card
   - Paste your API key
   - Click "Connect"

3. **Deploy**
   - Click "Deploy" button
   - Your service is live on Render

**Render Features:**
- Free SSL
- Auto-deploy from Git
- Environment variables
- Custom domains
- Background workers
- Cron jobs

## Deployment Configuration

### Build Settings

Configure how your project is built:

```javascript
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install"
}
```

### Environment Variables

Add environment variables for your deployment:

```javascript
{
  "NODE_ENV": "production",
  "API_URL": "https://api.example.com",
  "DATABASE_URL": "postgresql://..."
}
```

### Custom Domains

Most platforms support custom domains:

1. Add your domain in the platform's dashboard
2. Update your DNS records
3. Wait for DNS propagation (up to 48 hours)
4. Your site is live on your custom domain!

## Best Practices

### 1. Use Environment Variables

Never commit secrets to your code:

```javascript
// ✅ Good
const apiKey = process.env.API_KEY;

// ❌ Bad
const apiKey = 'abc123...';
```

### 2. Test Before Deploying

Always test your build locally:

```bash
npm run build
npm run preview
```

### 3. Use Preview Deployments

Deploy to a preview URL first:
- Test everything works
- Share with team for review
- Then deploy to production

### 4. Monitor Your Deployments

Check deployment status:
- Build logs
- Error messages
- Performance metrics

### 5. Set Up Automatic Deployments

Connect your Git repository:
- Push to deploy automatically
- Preview PRs before merging
- Rollback if needed

## Troubleshooting

### "Invalid API Key"

**Solution:**
- Check if you copied the full key
- Verify the key hasn't expired
- Create a new key if needed

### "Build Failed"

**Solution:**
- Check build logs for errors
- Verify build command is correct
- Ensure all dependencies are listed
- Check Node.js version compatibility

### "Deployment Timeout"

**Solution:**
- Optimize your build process
- Reduce bundle size
- Use caching when possible
- Consider upgrading your plan

### "Domain Not Working"

**Solution:**
- Verify DNS records are correct
- Wait for DNS propagation (up to 48 hours)
- Check SSL certificate status
- Try accessing via HTTPS

## Comparison with Lovable.dev

| Feature | Kalpa AI | Lovable.dev |
|---------|----------|-------------|
| Connect Own Accounts | ✅ Yes | ✅ Yes |
| Vercel Support | ✅ Yes | ✅ Yes |
| Netlify Support | ✅ Yes | ✅ Yes |
| GitHub Pages | ✅ Yes | ❌ No |
| Railway Support | ✅ Yes | ❌ No |
| Render Support | ✅ Yes | ❌ No |
| One-Click Deploy | ✅ Yes | ✅ Yes |
| Environment Variables | ✅ Yes | ✅ Yes |
| Custom Domains | ✅ Yes | ✅ Yes |
| Free to Use | ✅ Yes | ✅ Yes |

## Why Connect Your Own Accounts?

### Full Control
- You own your deployments
- Access all platform features
- No middleman

### Cost Effective
- Use platform free tiers
- Pay only for what you use
- No markup fees

### Data Privacy
- Your code stays in your accounts
- Direct deployment
- No third-party access

### Flexibility
- Switch platforms anytime
- Use multiple platforms
- Custom configurations

## Advanced Features

### Automatic Deployments

Set up automatic deployments from Git:

1. Connect your GitHub account
2. Link repository to deployment platform
3. Push code to deploy automatically

### Preview Deployments

Deploy PRs for review:

1. Create a pull request
2. Preview deployment created automatically
3. Review and test
4. Merge to deploy to production

### Rollback

Quickly rollback to previous version:

1. Go to platform dashboard
2. Find previous deployment
3. Click "Rollback"
4. Previous version is live

### Custom Build Commands

Configure custom build process:

```json
{
  "scripts": {
    "build": "vite build",
    "build:prod": "NODE_ENV=production vite build",
    "build:staging": "NODE_ENV=staging vite build"
  }
}
```

## Need Help?

- **Documentation**: Check platform-specific docs
- **Support**: Email support@kalpa-ai.com
- **Community**: Join our Discord
- **Issues**: Report on GitHub

## What's Next?

Now that you can deploy:
- ✅ Connect your deployment platform
- ✅ Deploy with one click
- ✅ Share your live project
- ✅ Iterate and redeploy
- ✅ Scale as you grow

Happy deploying! 🚀
