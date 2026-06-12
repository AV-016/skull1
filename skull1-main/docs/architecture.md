# Skulture Backend Architecture

This project is built using a clean-architecture pattern designed to isolate business rules from delivery mechanisms (HTTP/Express) and database structures (Prisma/PostgreSQL).

## Architectural Layers

```
                     ┌─────────────────────────┐
                     │    Client (Frontend)    │
                     └────────────┬────────────┘
                                  │ HTTP Requests
                                  ▼
                     ┌─────────────────────────┐
                     │      Router Layer       │
                     │  (src/routes/*.routes)  │
                     └────────────┬────────────┘
                                  │ Resolves Path, Runs Middlewares
                                  ▼
                     ┌─────────────────────────┐
                     │    Controller Layer     │
                     │ (src/controllers/*.ctrl)│
                     └────────────┬────────────┘
                                  │ Parses Inputs, Extracts Claims
                                  ▼
                     ┌─────────────────────────┐
                     │      Service Layer      │
                     │  (src/services/*.serv)  │
                     └────────────┬────────────┘
                                  │ Business Rules, Transaction Bounds
                                  ▼
                     ┌─────────────────────────┐
                     │    Repository Layer     │
                     │ (src/repositories/*.rep)│
                     └────────────┬────────────┘
                                  │ DB Queries, Data Persistence
                                  ▼
                     ┌─────────────────────────┐
                     │      Prisma Client      │
                     └─────────────────────────┘
```

### 1. Routing Layer (`src/routes/`)
Maps endpoints, runs global rate-limiters, authenticates users (`protect`), checks authorization (`restrictToAdmin`), and executes input Zod validation middleware.

### 2. Controller Layer (`src/controllers/`)
Parses query parameters, headers, route params, and body data. It wraps requests in safe try-catch handlers to delegate errors to Express global middleware, and serializes output using DTOs.

### 3. Service Layer (`src/services/`)
Encapsulates all domain business logic (e.g., inventory verification, discount calculations, Razorpay transaction payloads, file uploading coordination). Serves as transaction boundaries where multiple entities are updated simultaneously.

### 4. Repository Layer (`src/repositories/`)
Abstracts raw database queries. By separating persistence details, we keep services clean of direct Prisma query formatting, making it easy to mock database operations in unit tests.

### 5. Utility & Configuration Layers
- **`src/config/`**: Type-safe loading of variables and SDK client singletons.
- **`src/utils/`**: Helpers for password crypts, token signatures, and external providers integration.
- **`src/dto/`**: Data Transfer Objects to strip out private details (like hashed passwords) before hitting the network.
