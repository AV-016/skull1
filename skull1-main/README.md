# Skulture Backend

A production-ready Node.js + Express + TypeScript + Prisma backend built using clean architecture.

## Tech Stack
- **Framework**: Express.js
- **Language**: TypeScript
- **Database ORM**: Prisma with PostgreSQL
- **Payments**: Razorpay
- **Storage**: Cloudinary
- **Logging**: Winston
- **Validation**: Zod

## Clean Architecture Structure
```
backend/
├── prisma/               # Database schemas, migrations, and seeds
├── src/
│   ├── config/           # Safe env loading, singletons (database, cloudinary, razorpay)
│   ├── constants/        # Enums, roles, status values, static messages
│   ├── controllers/      # Parsing HTTP requests and delegating to services
│   ├── dto/              # Data Transfer Objects for serialization
│   ├── jobs/             # Asynchronous tasks and workers
│   ├── middlewares/      # Authentication, rate limiting, validation, errors
│   ├── repositories/     # Database queries, decoupling ORM from services
│   ├── routes/           # Mounting endpoints to controllers
│   ├── services/         # Core business logic
│   ├── types/            # App-wide types and Express type expansions
│   ├── utils/            # Shared utilities (cryptography, uploaders, order number generator)
│   ├── validators/       # Zod validation schemas
│   ├── app.ts            # App initialization, global middlewares
│   └── server.ts         # Bootstrapping the application
├── uploads/              # Local disk storage for temp/custom files
└── docs/                 # Swagger, Postman collections, architecture writeups
```

## Setup & Running Locally

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment**:
   - Copy `.env.example` to `.env` and fill in the values.

3. **Database Migration & Seed**:
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

4. **Run in Development**:
   ```bash
   npm run dev
   ```

5. **Build for Production**:
   ```bash
   npm run build
   ```

6. **Start Production Server**:
   ```bash
   npm start
   ```
# skull1
