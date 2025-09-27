# 🚀 Campus Connect - Deployment Guide

## Quick Setup for New Developers

### 1. Clone and Install
```bash
git clone https://github.com/Codeenk/CampusConnect.git
cd CampusConnect
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

### 3. Database Setup
1. Create Supabase project at https://supabase.com
2. Copy URL and keys to `.env`
3. Run migration from `supabase/migrations/20250126120000_scalable_schema.sql`

### 4. Start Development
```bash
npm run dev:all  # Both frontend & backend
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## 🌐 Production Deployment

### Frontend (Vercel)
1. Connect GitHub repo to Vercel
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Add environment variables

### Backend (Railway/Heroku)
1. Connect GitHub repo
2. Set start command: `npm start`
3. Add environment variables
4. Deploy

## 🔧 Environment Variables Required

```env
NODE_ENV=production
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h
FRONTEND_URL=https://your-frontend-url.com
```

## 📋 Checklist After Deployment

- [ ] Database migration executed
- [ ] Environment variables set
- [ ] Frontend can reach backend API
- [ ] Authentication works with .edu emails
- [ ] RLS policies are active in Supabase
- [ ] Error monitoring configured

## 🆘 Troubleshooting

### Common Issues
1. **CORS errors**: Check FRONTEND_URL in .env
2. **Database errors**: Verify Supabase credentials
3. **Auth issues**: Check JWT_SECRET configuration
4. **Build failures**: Ensure all dependencies installed

### Getting Help
- Check GitHub Issues
- Review ARCHITECTURE.md for technical details
- Verify environment variables match production requirements