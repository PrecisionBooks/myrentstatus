# 🚀 Quick Start Guide - Tenant Manager

## What You've Got

A **complete, production-ready** property management application with:
- ✅ Password-protected login
- ✅ Real-time database (Supabase PostgreSQL)
- ✅ Full tenant CRUD operations
- ✅ Move-in/move-out forms
- ✅ Rent increase tracking
- ✅ CSV export
- ✅ Search, filter, sort
- ✅ Fully responsive design

**Total cost: $0/month** (Vercel + Supabase free tiers)

---

## 🎯 Deploy in 15 Minutes

### Step 1: Extract the Project (1 min)

```bash
# Extract the archive
tar -xzf tenant-manager-complete.tar.gz
cd tenant-manager

# View the structure
ls -la
```

You should see:
```
tenant-manager/
├── src/
│   ├── app/
│   │   ├── page.tsx          (Main app with password gate)
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── TenantTable.tsx   (Main table with filters)
│   │   ├── MoveInForm.tsx    (Complete move-in form)
│   │   ├── MoveOutForm.tsx   (Complete move-out form)
│   │   └── EditTenantForm.tsx (Edit with rent history)
│   └── lib/
│       └── supabase.ts       (Database connection)
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── .env.example
├── DEPLOYMENT.md             (Detailed deployment guide)
└── README.md                 (Project overview)
```

---

### Step 2: Set Up Supabase Database (5 min)

1. **Go to** https://supabase.com
2. **Sign up** with GitHub (free)
3. **Create new project:**
   - Name: `tenant-manager`
   - Database password: `YourSecurePassword123!` (save this!)
   - Region: Closest to you
   - Wait ~2 minutes for setup

4. **Get your credentials:**
   - Settings (gear icon) → API
   - Copy:
     - `Project URL` (https://xxxxx.supabase.co)
     - `anon public` key (long string starting with eyJ...)

5. **Create database tables:**
   - Click SQL Editor → New Query
   - Copy the entire SQL from `DEPLOYMENT.md` (lines 28-109)
   - Paste and click "Run"
   - Should see "Success"

---

### Step 3: Deploy to Vercel (3 min)

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   
   # Create repo at github.com/new
   # Then:
   git remote add origin https://github.com/YOUR_USERNAME/tenant-manager.git
   git push -u origin main
   ```

2. **Deploy to Vercel:**
   - Go to https://vercel.com
   - Sign up with GitHub
   - Click "Add New" → "Project"
   - Import your `tenant-manager` repo
   
3. **Add environment variables** (BEFORE deploying):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...
   NEXT_PUBLIC_APP_PASSWORD=YourChosenPassword123
   ```

4. **Click "Deploy"** (takes ~2 minutes)

---

### Step 4: Test Your App (2 min)

1. **Open your Vercel URL** (looks like: `tenant-manager-abc123.vercel.app`)
2. **Enter your password** (the one you set in `NEXT_PUBLIC_APP_PASSWORD`)
3. **Click "Move-in"** to add your first tenant
4. **Test all features:**
   - ✅ Add a tenant
   - ✅ Edit a tenant
   - ✅ Add rent increase
   - ✅ Move out a tenant
   - ✅ Export CSV

---

## 🔒 Security Checklist

### CRITICAL: Enable Row Level Security

**Do this now!** Without this, your database is not secure.

1. In Supabase → Authentication → Policies
2. For EACH table (tenants, buildings, units, rent_increases, move_outs):
   - Click "New Policy"
   - Choose "Enable access to all users"
   - Click "Review" → "Save policy"

This makes your data secure while still allowing your app to access it.

---

## 📋 What Each File Does

### Core Files
- `src/app/page.tsx` - Main app, password protection, modal routing
- `src/components/TenantTable.tsx` - Main table with search/filter/export
- `src/components/MoveInForm.tsx` - Add new tenants
- `src/components/MoveOutForm.tsx` - Process move-outs
- `src/components/EditTenantForm.tsx` - Edit tenants & rent increases
- `src/lib/supabase.ts` - Database connection & TypeScript types

### Config Files
- `package.json` - Dependencies (Next.js, Supabase, date-fns)
- `next.config.js` - Next.js configuration
- `tailwind.config.js` - Styling configuration
- `tsconfig.json` - TypeScript configuration
- `.env.example` - Template for environment variables

---

## 🎨 Features Overview

### 1. Password Protection
- Session-based (persists until browser closes)
- Password set via environment variable
- Easy to change: Update env var → redeploy

### 2. Main Dashboard
- **Stats:** Occupied, Vacant, Projected Income, Deposits
- **Search:** By name, unit, or building
- **Filters:** Building, move-in month, rent range
- **Sort:** By rent, deposit, or move-in date
- **Export:** Download full CSV

### 3. Move-In Form
- Building & unit selection (dropdowns)
- Primary tenant (required)
- Secondary tenant (optional)
- Lease terms with auto-calculated end date
- Prorated rent option
- Pet/parking checkboxes
- Notes field

### 4. Move-Out Form
- Select building → filters tenants
- Shows tenant details
- Move-out date
- Deposit refund (pre-filled, editable)
- Updates tenant status to 'moved_out'

### 5. Edit Tenant Form
- Edit all tenant fields
- Change building/unit
- Switch primary/secondary tenant
- Remove secondary tenant
- **Rent History:** Shows all increases
- **Add Rent Increase:** Creates history record, updates current rent & anniversary
- Edit security deposit, lease end date

---

## 💰 Pricing Breakdown

### Vercel (Free Tier)
- ✅ Unlimited projects
- ✅ 100GB bandwidth/month
- ✅ SSL/HTTPS automatic
- ✅ Custom domain (free)
- ✅ Automatic deployments

**Your usage:** ~500KB per page load = 200,000 loads/month (way more than you'll need)

### Supabase (Free Tier)
- ✅ 500MB database
- ✅ 1GB file storage
- ✅ 50K monthly active users
- ✅ Unlimited API requests

**Your usage:** 63 units + history = ~1MB (0.2% of limit)

### Custom Domain (Optional)
- Domain name: $10-15/year (Namecheap, Google Domains)
- SSL certificate: FREE (included with Vercel)
- Setup: Point DNS to Vercel (takes 24-48 hrs)

---

## 🔄 Making Updates

### Change Password
1. Vercel → Settings → Environment Variables
2. Edit `NEXT_PUBLIC_APP_PASSWORD`
3. Save
4. Redeploy (automatic)

### Update Code
```bash
# Make your changes
git add .
git commit -m "Description of changes"
git push
```
Vercel auto-deploys every push! ✨

### Add More Buildings/Units
1. Supabase → SQL Editor
2. For buildings:
   ```sql
   INSERT INTO buildings (name) VALUES ('Building 8');
   ```
3. For units:
   ```sql
   INSERT INTO units (building_id, unit_number) VALUES (8, '101');
   ```

---

## 🐛 Common Issues & Solutions

### "Supabase client error"
**Fix:** Check environment variables in Vercel
- All 3 variables must be set
- No extra spaces
- Redeploy after fixing

### "Password not working"
**Fix:** Case-sensitive, check for typos
- Verify `NEXT_PUBLIC_APP_PASSWORD` in Vercel
- Try clearing browser cache

### "Can't add tenant"
**Fix:** Enable Row Level Security (see Security Checklist above)

### "No tenants showing"
**Fix:** Check Supabase Table Editor
- Verify tables exist
- Check if SQL script ran successfully
- Look for data in `tenants` table

---

## 📱 Browser Compatibility

**Desktop:**
- ✅ Chrome (recommended)
- ✅ Safari
- ✅ Firefox
- ✅ Edge

**Mobile:**
- ✅ iOS Safari
- ✅ Android Chrome
- ✅ Samsung Internet

**Works offline?** No - requires internet for database access

---

## 💡 Tips & Best Practices

### Backups
- **Weekly:** Export CSV (click "Export list")
- **Save to:** Google Drive, Dropbox, or local folder
- **Automatic:** Supabase backs up database daily

### Data Entry
- Use "Last, First" format for tenant names
- Keep emails lowercase
- Use (XXX) XXX-XXXX format for phone numbers

### Rent Increases
- Anniversary date = 12 months from increase date
- Always first of month (e.g., April 1, 2027)
- Original rent is always preserved

### Security
- Change default password immediately
- Use strong password (12+ characters, mix of letters/numbers/symbols)
- Don't share password in emails
- Enable Row Level Security in Supabase (CRITICAL!)

---

## 🎯 Next Steps

**Immediate (required):**
1. ✅ Deploy app
2. ✅ Enable Row Level Security
3. ✅ Change default password
4. ✅ Test all features

**Soon (recommended):**
1. Add your 63 units
2. Set up weekly CSV export routine
3. Bookmark your app URL

**Optional (nice to have):**
1. Custom domain ($10-15/year)
2. Add sample data for testing
3. Customize colors in `globals.css`

---

## 📊 File Checklist

Make sure you have all these files:

**Core App Files:**
- [x] src/app/page.tsx
- [x] src/app/layout.tsx
- [x] src/app/globals.css
- [x] src/components/TenantTable.tsx
- [x] src/components/MoveInForm.tsx
- [x] src/components/MoveOutForm.tsx
- [x] src/components/EditTenantForm.tsx
- [x] src/lib/supabase.ts

**Config Files:**
- [x] package.json
- [x] next.config.js
- [x] tailwind.config.js
- [x] postcss.config.js
- [x] tsconfig.json
- [x] .gitignore
- [x] .env.example

**Documentation:**
- [x] README.md
- [x] DEPLOYMENT.md
- [x] QUICKSTART.md (this file)

---

## ✅ Success Criteria

You know everything is working when you can:
1. ✅ Log in with your password
2. ✅ See the empty tenant table
3. ✅ Add a new tenant (move-in)
4. ✅ Edit that tenant
5. ✅ Add a rent increase
6. ✅ Move out that tenant
7. ✅ Export CSV

---

## 🎉 You're Ready!

Your complete tenant management system is ready to deploy.

**Time to deploy:** 15-20 minutes  
**Difficulty:** Easy (step-by-step instructions)  
**Cost:** $0/month

**Questions?** See DEPLOYMENT.md for detailed troubleshooting.

**Let's go!** 🚀
