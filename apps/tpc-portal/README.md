# TPC Portal

Training and Placement Cell (TPC) Portal for CampusConnect - A comprehensive admin interface for managing student placement activities, resume exports, and placement operations.

## 🌟 Features

### Student Management
- **Advanced Search**: Multi-criteria search with filters for department, graduation year, GPA, skills, and verification status
- **Student Profiles**: Complete student profile view with academic details, projects, experience, and skills
- **Verification Status**: Track and filter by student profile verification status
- **Readiness Scoring**: Automated placement readiness scoring based on profile completeness

### Resume Export System
- **Single Export**: Download individual student resumes in PDF or DOCX format
- **Batch Export**: Bulk export resumes for multiple students with background processing
- **Template Support**: Multiple resume templates (standard, modern, minimal)
- **Export History**: Track all export operations with download links and metadata

### Job Management
- **Background Processing**: Handle large batch exports (>100 students) asynchronously
- **Progress Tracking**: Real-time progress updates for batch export jobs
- **Artifact Management**: Secure file storage with automatic cleanup of expired downloads

### Security & Access Control
- **Role-Based Access**: Restricted to TPC admin and admin users only
- **Secure Authentication**: JWT-based authentication with automatic session management
- **Data Privacy**: Ensure student data is only accessible to authorized personnel

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- Running CampusConnect backend server
- Supabase database with TPC tables (migration required)

### Installation

1. **Install Dependencies**
   ```bash
   cd apps/tpc-portal
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Update .env.local with your configuration
   ```

3. **Run Database Migration**
   ```bash
   node run-migration.js
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Build for Production**
   ```bash
   npm run build
   npm run preview
   ```

### Environment Configuration

Create `.env.local` with these variables:

```env
# Backend API
VITE_API_BASE_URL=http://localhost:3001/api

# Supabase (shared with main app)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Feature Configuration
VITE_ENABLE_BATCH_EXPORT=true
VITE_MAX_BATCH_SIZE=500
```

## 📁 Project Structure

```
apps/tpc-portal/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Layout.jsx       # Main layout wrapper
│   │   ├── SearchFilters.jsx # Advanced search filters
│   │   ├── StudentsGrid.jsx # Student results display
│   │   └── LoadingSpinner.jsx
│   ├── pages/              # Main application pages
│   │   ├── Login.jsx       # TPC admin authentication
│   │   ├── Search.jsx      # Student search interface
│   │   ├── Export.jsx      # Export management
│   │   └── StudentDetail.jsx # Individual student profile
│   ├── contexts/           # React contexts
│   │   └── AuthContext.tsx # Authentication state management
│   ├── services/           # API services
│   │   └── api.ts          # Backend API integration
│   ├── types/              # TypeScript type definitions
│   └── App.jsx             # Main application component
├── public/                 # Static assets
├── package.json            # Dependencies and scripts
├── vite.config.ts          # Vite build configuration
├── tailwind.config.js      # Tailwind CSS configuration
└── run-migration.js        # Database migration script
```

## 🔧 Backend Integration

### Required Backend Routes

The TPC portal expects these API endpoints from the CampusConnect backend:

```
GET  /api/tpc/search           # Student search with filters
GET  /api/tpc/profile/:id      # Get student profile
POST /api/tpc/export/single    # Export single resume
POST /api/tpc/export/batch     # Batch export resumes
GET  /api/tpc/export/jobs/:id  # Get export job status
GET  /api/tpc/export/history   # Export history
GET  /api/tpc/departments      # Available departments
GET  /api/tpc/skills           # Available skills
GET  /api/tpc/graduation-years # Available graduation years
```

### Database Tables

The TPC portal requires these additional tables in Supabase:

- `tpc_export_jobs` - Background job tracking
- `tpc_export_artifacts` - Export file management

Run the migration script to create these tables:

```bash
node run-migration.js
```

## 🎯 Usage Guide

### For TPC Admins

1. **Login**: Use your CampusConnect admin credentials
2. **Search Students**: Use filters to find specific students
3. **View Profiles**: Click on student cards to see detailed profiles
4. **Export Resumes**: 
   - Single: Use download button on student profile
   - Batch: Select multiple students and use bulk export
5. **Track Exports**: Check export history and download status

### Search Filters

- **Text Search**: Search by name, email, or general keywords
- **Department**: Filter by academic department
- **Graduation Year**: Filter by expected graduation year
- **Skills**: Search for specific technical skills (AND/OR logic)
- **GPA Range**: Set minimum GPA requirements
- **Verification**: Show only verified profiles
- **Profile Completeness**: Filter by projects/experience availability

### Export Options

- **Template**: Choose resume template (standard, modern, minimal)
- **Format**: PDF or DOCX output
- **Verified Only**: Include only verified profile data
- **Batch Size**: Automatic background processing for large exports

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - TypeScript type checking

### Code Style

- **React 18+** with hooks and functional components
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Vite** for build tooling
- **ESLint + Prettier** for code formatting

### Adding New Features

1. **Components**: Add reusable components in `src/components/`
2. **Pages**: Add new pages in `src/pages/`
3. **API Methods**: Extend `src/services/api.ts`
4. **Types**: Define TypeScript types in `src/types/`
5. **Routes**: Update routing in `src/App.jsx`

## 🔐 Security Considerations

- **Authentication**: Only TPC admins can access the portal
- **Data Access**: All student data access is logged and tracked
- **File Security**: Export files have expiration and access controls
- **CORS**: Configure proper CORS settings for production
- **Environment Variables**: Never commit sensitive data to version control

## 📊 Performance Optimization

- **Lazy Loading**: Components and routes are lazy-loaded
- **Pagination**: Student search results are paginated
- **Caching**: API responses are cached where appropriate
- **Background Jobs**: Large exports run asynchronously
- **File Compression**: Export files are compressed for faster downloads

## 🤝 Contributing

1. Follow existing code patterns and component structure
2. Add TypeScript types for new features
3. Update tests for new functionality
4. Document API changes in backend integration
5. Test with both small and large datasets

## 📈 Monitoring & Analytics

- **Export Tracking**: All export operations are logged
- **User Activity**: Login and search activities are tracked
- **Performance Metrics**: Export job completion times and success rates
- **Error Logging**: Failed operations are logged for debugging

## 🚀 Deployment

### Production Build

```bash
npm run build
```

### Environment Variables

Set these in your production environment:

```env
VITE_API_BASE_URL=https://your-api-domain.com/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_anon_key
```

### Hosting Options

- **Vercel**: Connect to Git repo for automatic deployments
- **Netlify**: Drag and drop `dist/` folder
- **AWS S3 + CloudFront**: Static site hosting
- **Firebase Hosting**: Google Cloud hosting

## 📞 Support

For issues or questions:

1. Check the CampusConnect main repository documentation
2. Review backend API documentation
3. Check Supabase database configuration
4. Verify environment variables and permissions

---

**TPC Portal** - Streamlining placement operations for educational institutions.