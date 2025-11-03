# Fix Vercel Build Error

## Problem
Vercel shows: "No Next.js version detected. Make sure your package.json has 'next' in either 'dependencies' or 'devDependencies'."

## Solution

### Step 1: Make sure package.json is committed to GitHub

Your `package.json` has Next.js (`"next": "^14.0.4"`), but Vercel might not be seeing it.

1. **Go to your GitHub repository**: https://github.com/thmsbnsn/taleweave
2. **Check if `package.json` exists** in the root directory
3. **If it's missing**, commit and push it:

```bash
# On your local machine
cd C:\Users\THMS\Desktop\taleweave

# Make sure package.json is tracked
git add package.json
git commit -m "Add package.json with Next.js"
git push origin main
```

### Step 2: Check Vercel Root Directory Setting

In Vercel dashboard:

1. Go to your project settings
2. Go to **Settings → General**
3. Check **Root Directory** - it should be: `./` (or empty/blank)
4. Make sure it matches where your `package.json` is located

### Step 3: Verify Framework Preset

1. Go to **Settings → General**
2. Check **Framework Preset** - should be **Next.js**
3. If not, change it to **Next.js**

### Step 4: Redeploy

After fixing the above:
1. Go to **Deployments** tab
2. Click the three dots (⋯) on the failed deployment
3. Click **Redeploy**
4. Or push a new commit to trigger automatic redeploy

## Quick Fix Checklist

- ✅ `package.json` exists in GitHub repo root
- ✅ `package.json` has `"next": "^14.0.4"` in dependencies
- ✅ Root Directory in Vercel is `./` or blank
- ✅ Framework Preset is set to **Next.js**

## Alternative: Manual Fix

If the issue persists:

1. In Vercel, go to **Settings → General**
2. Under **Build & Development Settings**:
   - **Build Command**: `npm run build` (or leave default)
   - **Output Directory**: `.next` (or leave default)
   - **Install Command**: `npm install` (or leave default)

3. Save and redeploy

## Still Not Working?

1. Check GitHub repo has `package.json` in root
2. Verify `package.json` has `next` in `dependencies` (not `devDependencies`)
3. Make sure you're deploying from the `main` branch
4. Check Vercel logs for more specific errors

