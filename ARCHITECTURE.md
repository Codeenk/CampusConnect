# Campus Connect - Restructured Architecture

## Project Structure
```
campus-connect/
├── backend/                 # Express.js API Server
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── config/
│   │   └── utils/
│   ├── supabase/
│   │   └── migrations/
│   ├── package.json
│   └── server.js
├── frontend/               # React App
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── contexts/
│   │   ├── services/
│   │   └── utils/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
└── docker-compose.yml      # For local development
```

## Architecture Benefits
- **Separation of Concerns**: Clear backend/frontend separation
- **Scalability**: Each service can be deployed independently
- **Development**: Teams can work on different parts simultaneously
- **Maintenance**: Easier debugging and updates