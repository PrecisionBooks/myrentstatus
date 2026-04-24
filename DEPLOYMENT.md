# Tenant Manager - Complete Deployment Guide

## 📋 Overview
This is a complete property management application built with Next.js, Supabase, and Tailwind CSS. It includes password protection, real-time database, and full CRUD operations for managing tenants across 7 buildings and 63 units.

---

## 🚀 DEPLOYMENT STEPS

### Step 1: Set Up Supabase (5 minutes)

1. **Go to** [supabase.com](https://supabase.com)
2. **Click** "Start your project"
3. **Sign up** with GitHub (recommended) or email
4. **Create new project:**
   - Organization: Create new or use existing
   - Project name: `tenant-manager`
   - Database password: **(SAVE THIS!)** e.g., `YourSecurePass123!`
   - Region: Choose closest to you (e.g., US West, US East)
   - Pricing: Free tier (perfect for this app)
5. **Wait 2 minutes** for project to be created

6. **Get your credentials:**
   - In Supabase dashboard, click "Project Settings" (gear icon)
   - Click "API" in sidebar
   - Copy these two values:
     - `Project URL` (looks like: `https://xxxxx.supabase.co`)
     - `anon public` key (long string starting with `eyJ...`)

7. **Create database tables:**
   - In Supabase dashboard, click "SQL Editor"
   - Click "New query"
   - **Copy and paste this entire SQL script:**

```sql
-- Buildings table
CREATE TABLE buildings (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Units table
CREATE TABLE units (
  id SERIAL PRIMARY KEY,
  building_id INTEGER REFERENCES buildings(id),
  unit_number VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tenants table
CREATE TABLE tenants (
  id SERIAL PRIMARY KEY,
  unit_id INTEGER REFERENCES units(id),
  primary_tenant_name VARCHAR(255) NOT NULL,
  primary_tenant_email VARCHAR(255),
  primary_tenant_phone VARCHAR(20),
  secondary_tenant_name VARCHAR(255),
  secondary_tenant_email VARCHAR(255),
  secondary_tenant_phone VARCHAR(20),
  move_in_date DATE NOT NULL,
  lease_end_date DATE NOT NULL,
  current_rent DECIMAL(10,2) NOT NULL,
  original_rent DECIMAL(10,2) NOT NULL,
  security_deposit DECIMAL(10,2) NOT NULL,
  rent_anniversary_date DATE NOT NULL,
  has_pet BOOLEAN DEFAULT FALSE,
  has_parking BOOLEAN DEFAULT FALSE,
  notes TEXT,
  lease_document_url VARCHAR(500),
  prorated_first_month DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Rent increases table
CREATE TABLE rent_increases (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id),
  previous_rent DECIMAL(10,2) NOT NULL,
  new_rent DECIMAL(10,2) NOT NULL,
  effective_date DATE NOT NULL,
  new_anniversary_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Move-outs table
CREATE TABLE move_outs (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id),
  move_out_date DATE NOT NULL,
  deposit_refund_amount DECIMAL(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert 7 buildings
INSERT INTO buildings (name) VALUES
  ('Building 1'),
  ('Building 2'),
  ('Building 3'),
  ('Building 4'),
  ('Building 5'),
  ('Building 6'),
  ('Building 7');

-- Insert units for each building (63 total - 9 per building)
INSERT INTO units (building_id, unit_number)
SELECT 
  b.id,
  CASE 
    WHEN n <= 3 THEN '10' || n
    WHEN n <= 6 THEN '20' || (n-3)
    ELSE '30' || (n-6)
  END
FROM buildings b
CROSS JOIN generate_series(1, 9) n;
```

   - Click "Run" button
   - You should see "Success. No rows returned"

---

### Step 2: Deploy to Vercel (3 minutes)

1. **Go to** [vercel.com](https://vercel.com)
2. **Click** "Sign Up" → Continue with GitHub
3. **Authorize Vercel** to access your GitHub
4. **Push this project to GitHub:**
   - Go to [github.com/new](https://github.com/new)
   - Repository name: `tenant-manager`
   - Privacy: Private (recommended)
   - Click "Create repository"
   - In your terminal:
     ```bash
     cd tenant-manager
     git init
     git add .
     git commit -m "Initial commit"
     git branch -M main
     git remote add origin https://github.com/YOUR_USERNAME/tenant-manager.git
     git push -u origin main
     ```

5. **Import to Vercel:**
   - In Vercel dashboard, click "Add New" → "Project"
   - Click "Import" next to your `tenant-manager` repository
   - Click "Import"

6. **Configure Environment Variables:**
   - Before clicking "Deploy", add these environment variables:
     
     **Variable 1:**
     - Name: `NEXT_PUBLIC_SUPABASE_URL`
     - Value: `https://xxxxx.supabase.co` (from Supabase Step 1)
     
     **Variable 2:**
     - Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - Value: `eyJ...` (from Supabase Step 1)
     
     **Variable 3:**
     - Name: `NEXT_PUBLIC_APP_PASSWORD`
     - Value: Choose your password (e.g., `MySecurePassword123`)

7. **Click "Deploy"**
   - Wait 2-3 minutes
   - You'll see "Congratulations!" when done

8. **Get your live URL:**
   - Copy the URL (looks like: `tenant-manager-xxxxx.vercel.app`)
   - Click "Visit" to open your app!

---

### Step 3: Test Your App (2 minutes)

1. **Open your Vercel URL**
2. **Enter the password** you set in `NEXT_PUBLIC_APP_PASSWORD`
3. **You should see** an empty tenant table!
4. **Click "Move-in"** to add your first tenant
5. **Click "Export list"** to download CSV

---

## 🔐 SECURITY NOTES

### Password Protection
- Current: Simple password check (good for personal use)
- Password stored in environment variable (not in code)
- Session persists until browser closes
- Can be upgraded to proper authentication later

### Database Security
- Supabase free tier includes:
  - Row Level Security (RLS) - **IMPORTANT: Enable this!**
  - SSL connections
  - Automatic backups

**To enable RLS (Do this now!):**
1. In Supabase dashboard → Authentication → Policies
2. For each table (`tenants`, `buildings`, `units`, etc):
   - Click "New Policy"
   - Choose "Enable access to all users"
   - Click "Review" → "Save policy"

---

## 📱 CUSTOM DOMAIN (Optional)

### To use your own domain (e.g., `myproperties.com`):

1. **Buy a domain:**
   - Namecheap.com ($10-15/year)
   - Google Domains
   - Cloudflare

2. **In Vercel:**
   - Go to your project → Settings → Domains
   - Add your domain: `myproperties.com`
   - Vercel gives you DNS records to add

3. **In your domain registrar:**
   - Add the DNS records Vercel provided
   - Wait 24-48 hours for DNS to propagate
   - Done! Your app is now at `myproperties.com`

**Both are 100% free** - Vercel doesn't charge for custom domains

---

## 🔄 MAKING UPDATES

### To update your app after making changes:

```bash
git add .
git commit -m "Your update description"
git push
```

Vercel auto-deploys every push! ✨

---

## 📊 VERCEL FREE TIER LIMITS

**You get for FREE:**
- ✅ Unlimited projects
- ✅ 100GB bandwidth/month (plenty for personal use)
- ✅ SSL certificate (HTTPS)
- ✅ Custom domain
- ✅ Automatic deployments
- ✅ Preview deployments

**Bandwidth usage estimate:**
- Each page load: ~500KB
- 100GB = 200,000 page loads/month
- For personal use: virtually unlimited

---

## 🗄️ SUPABASE FREE TIER LIMITS

**You get for FREE:**
- ✅ 500MB database (stores ~50,000+ tenant records)
- ✅ 1GB file storage (for lease documents)
- ✅ 50,000 monthly active users
- ✅ Unlimited API requests
- ✅ Automatic backups

**Database size estimate:**
- 100 tenants + history: ~50KB
- Your 63 units: ~20KB
- Years of data: still under 1MB
- You'll use < 1% of the free tier

---

## 🐛 TROUBLESHOOTING

### Problem: "Supabase client error"
**Solution:** Check environment variables in Vercel
- Go to Vercel → Settings → Environment Variables
- Make sure all 3 variables are set correctly
- Redeploy: Deployments → click ⋯ → "Redeploy"

### Problem: "Password not working"
**Solution:** Check `NEXT_PUBLIC_APP_PASSWORD` variable
- Make sure there are no extra spaces
- Redeploy after changing

### Problem: "No tenants showing"
**Solution:** Check Supabase database
- Go to Supabase → Table Editor
- Verify tables exist and have data
- Check SQL queries ran successfully

### Problem: "Can't add tenant"
**Solution:** Enable Row Level Security policies
- See "Security Notes" section above
- Add policies for all tables

---

## 📞 NEED HELP?

Common issues and solutions:

1. **Forgot Supabase password:** 
   - Project Settings → Database → Reset password

2. **Want to change app password:**
   - Vercel → Settings → Environment Variables
   - Edit `NEXT_PUBLIC_APP_PASSWORD`
   - Redeploy

3. **Want to backup data:**
   - Click "Export list" to download CSV
   - Save to Google Drive/Dropbox weekly

4. **Want to add more buildings:**
   - Supabase → SQL Editor
   - `INSERT INTO buildings (name) VALUES ('Building 8');`

---

## ✅ CHECKLIST

- [ ] Supabase project created
- [ ] Database tables created (SQL ran successfully)
- [ ] Supabase URL and key copied
- [ ] Code pushed to GitHub
- [ ] Vercel project created
- [ ] Environment variables added
- [ ] App deployed successfully
- [ ] Password works
- [ ] Can add/edit/delete tenants
- [ ] CSV export works
- [ ] Row Level Security enabled (IMPORTANT!)

---

## 🎉 YOU'RE DONE!

Your tenant management system is live at:
`https://your-project.vercel.app`

**Next steps:**
1. Add your 63 units data
2. Start adding tenants
3. Set up weekly CSV backup routine
4. Consider custom domain (optional)

**Estimated total time:** 15-20 minutes
**Estimated total cost:** $0/month (both free tiers)
