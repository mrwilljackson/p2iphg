# Vercel Deployment Guide - Power2Inspire Event CRM Web App

**Date:** 2026-02-11  
**Purpose:** Step-by-step guide for deploying the NextJS web app to Vercel

---

## Prerequisites

- GitHub repository with NextJS project
- Vercel account (free tier is sufficient)
- Airtable API key and Base ID

---

## Step 1: Connect GitHub Repository to Vercel

### 1.1 Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up"
3. Choose "Continue with GitHub"
4. Authorize Vercel to access your GitHub account

### 1.2 Import Project
1. Click "Add New..." → "Project"
2. Select your GitHub repository: `power2inspire/event-crm-app`
3. Click "Import"

### 1.3 Configure Project
1. **Framework Preset:** NextJS (auto-detected)
2. **Root Directory:** `./` (or specify if NextJS project is in subdirectory)
3. **Build Command:** `npm run build` (default)
4. **Output Directory:** `.next` (default)
5. **Install Command:** `npm install` (default)

---

## Step 2: Configure Environment Variables

### 2.1 Add Environment Variables in Vercel Dashboard
1. In project settings, go to "Environment Variables"
2. Add the following variables:

| Name | Value | Environments |
|------|-------|--------------|
| `AIRTABLE_API_KEY` | Your Airtable API key (starts with `key`) | Production, Preview |
| `AIRTABLE_BASE_ID` | Your Airtable Base ID (starts with `app`) | Production, Preview |
| `NEXT_PUBLIC_APP_URL` | Your production URL (e.g., `https://event-crm.vercel.app`) | Production |
| `NEXT_PUBLIC_APP_URL` | Preview deployment URL | Preview |

### 2.2 How to Get Airtable Credentials

**API Key:**
1. Go to [airtable.com/create/tokens](https://airtable.com/create/tokens)
2. Click "Create new token"
3. Name: "Power2Inspire Event CRM"
4. Scopes: `data.records:read`, `data.records:write`
5. Access: Select your base
6. Click "Create token"
7. Copy the token (starts with `key`)

**Base ID:**
1. Go to your Airtable base
2. Click "Help" → "API documentation"
3. Find "The ID of this base is `appXXXXXXXXXXXXXX`"
4. Copy the Base ID

---

## Step 3: Deploy to Production

### 3.1 Initial Deployment
1. Click "Deploy" in Vercel dashboard
2. Wait for build to complete (~2-3 minutes)
3. Vercel will provide a production URL: `https://event-crm.vercel.app`

### 3.2 Verify Deployment
1. Visit the production URL
2. Test registration form
3. Verify Airtable integration works
4. Check all 8 screens load correctly

---

## Step 4: Set Up Custom Domain (Optional)

### 4.1 Add Custom Domain
1. Go to project settings → "Domains"
2. Click "Add"
3. Enter your domain (e.g., `events.power2inspire.org`)
4. Follow DNS configuration instructions

### 4.2 Configure DNS
1. Add CNAME record pointing to `cname.vercel-dns.com`
2. Wait for DNS propagation (~5-60 minutes)
3. Vercel will automatically provision SSL certificate

---

## Step 5: Configure Deployment Settings

### 5.1 Production Branch
1. Go to project settings → "Git"
2. Set "Production Branch" to `main` (or `master`)
3. Every push to this branch will trigger production deployment

### 5.2 Preview Deployments
1. Every push to non-production branches creates preview deployment
2. Preview URL format: `https://event-crm-git-[branch-name]-[team].vercel.app`
3. Use preview deployments for testing before merging to production

### 5.3 Deployment Protection (Optional)
1. Go to project settings → "Deployment Protection"
2. Enable "Vercel Authentication" to require login for preview deployments
3. Useful for protecting work-in-progress features

---

## Step 6: Monitor and Optimize

### 6.1 Analytics
1. Go to project → "Analytics"
2. View page views, unique visitors, top pages
3. Monitor performance metrics

### 6.2 Logs
1. Go to project → "Deployments" → Select deployment → "Logs"
2. View build logs and runtime logs
3. Debug errors and performance issues

### 6.3 Performance
1. Run Lighthouse audit on production URL
2. Aim for scores: Performance 90+, Accessibility 100, Best Practices 100, SEO 100
3. Optimize images, enable caching, minimize JavaScript

---

## Step 7: Rollback (If Needed)

### 7.1 Instant Rollback
1. Go to project → "Deployments"
2. Find previous working deployment
3. Click "..." → "Promote to Production"
4. Confirm rollback

---

## Deployment Workflow

### Development Workflow
```
1. Create feature branch: git checkout -b feature/new-feature
2. Make changes and commit: git commit -m "Add new feature"
3. Push to GitHub: git push origin feature/new-feature
4. Vercel creates preview deployment automatically
5. Test preview URL
6. Create pull request on GitHub
7. Review and merge to main
8. Vercel deploys to production automatically
```

### Hotfix Workflow
```
1. Create hotfix branch: git checkout -b hotfix/critical-bug
2. Fix bug and commit: git commit -m "Fix critical bug"
3. Push to GitHub: git push origin hotfix/critical-bug
4. Test preview deployment
5. Merge to main immediately
6. Production deployment happens automatically
7. If issues, rollback to previous deployment
```

---

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Verify all dependencies are in `package.json`
- Ensure TypeScript types are correct
- Check environment variables are set

### Runtime Errors
- Check runtime logs in Vercel dashboard
- Verify Airtable API key and Base ID are correct
- Check API route responses
- Test locally with `npm run dev`

### Slow Performance
- Enable Vercel Edge caching
- Optimize images (use Next.js Image component)
- Minimize JavaScript bundle size
- Use lazy loading for heavy components

---

## Security Best Practices

1. **Never commit `.env.local`** - Always use `.gitignore`
2. **Rotate Airtable tokens** - Regenerate tokens periodically
3. **Use environment variables** - Never hardcode secrets
4. **Enable HTTPS only** - Vercel provides automatic HTTPS
5. **Monitor logs** - Check for suspicious activity

---

## Cost Estimate

**Vercel Free Tier (Hobby):**
- ✅ Unlimited deployments
- ✅ 100 GB bandwidth/month
- ✅ Automatic HTTPS
- ✅ Preview deployments
- ✅ Analytics
- ✅ Serverless functions (100 GB-hours/month)

**Expected Usage:**
- ~1,000 registrations/month = ~5 GB bandwidth
- ~10,000 page views/month = ~10 GB bandwidth
- **Total: ~15 GB/month (well within free tier)**

**Upgrade to Pro ($20/month) if:**
- Need more than 100 GB bandwidth
- Need team collaboration features
- Need advanced analytics
- Need password protection for production

---

**Document End**

*This guide was created on 2026-02-11 to assist with deploying the Power2Inspire Event CRM web app to Vercel.*

