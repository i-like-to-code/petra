# Petra Cements - Complete Backend REST API System

Production-ready REST API backend for Petra Cements application built with Node.js, Express, TypeScript, MongoDB, Mongoose ORM, JWT, and bcrypt.

---

## 🛠️ Required npm Packages

### Production Dependencies
- **`express`**: Web framework for Node.js REST APIs.
- **`mongoose`**: MongoDB object modeling and schema validation.
- **`bcryptjs`**: Password hashing.
- **`jsonwebtoken`**: JWT authentication.
- **`dotenv`**: Environment variable management.
- **`cors`**: Cross-Origin Resource Sharing.

---

## 📦 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.ts          # Mongoose MongoDB connection setup
│   ├── controllers/
│   │   ├── auth.controller.ts   # Signup, Login, and Me request handlers
│   │   ├── home.controller.ts   # Home screen, Banners, Categories handlers
│   │   ├── product.controller.ts# Public & Admin Product management handlers
│   │   ├── cart.controller.ts   # Cart management handlers
│   │   ├── order.controller.ts  # Checkout, Order history & Admin Order handlers
│   │   └── profile.controller.ts# Profile updates & Address Book handlers
│   ├── middleware/
│   │   ├── auth.middleware.ts   # JWT authentication & Admin authorization middleware
│   │   └── error.middleware.ts  # Centralized error handler
│   ├── models/
│   │   ├── user.model.ts        # Mongoose User Schema
│   │   ├── banner.model.ts      # Mongoose Banner Schema
│   │   ├── category.model.ts    # Mongoose Category Schema
│   │   ├── product.model.ts     # Mongoose Product Schema
│   │   ├── cart.model.ts        # Mongoose Cart Schema
│   │   ├── order.model.ts       # Mongoose Order Schema
│   │   └── address.model.ts     # Mongoose Address Schema
│   ├── routes/
│   │   ├── auth.routes.ts       # Auth API endpoints
│   │   ├── home.routes.ts       # Home API endpoints
│   │   ├── product.routes.ts    # Product API endpoints
│   │   ├── cart.routes.ts       # Cart API endpoints
│   │   ├── order.routes.ts      # Order API endpoints
│   │   └── profile.routes.ts    # Profile & Address API endpoints
│   ├── services/
│   │   ├── auth.service.ts      # User DB queries & password hashing
│   │   ├── home.service.ts      # Home dashboard queries
│   │   ├── product.service.ts   # Product CRUD & search queries
│   │   ├── cart.service.ts      # Cart CRUD, stock check & totals logic
│   │   ├── order.service.ts     # Checkout, stock deduction, order cancellation & status logic
│   │   └── profile.service.ts   # Profile update, password change & address book logic
│   ├── types/
│   │   ├── auth.types.ts
│   │   ├── home.types.ts
│   │   ├── product.types.ts
│   │   ├── cart.types.ts
│   │   ├── order.types.ts
│   │   └── profile.types.ts
│   ├── app.ts                   # Express application setup
│   └── server.ts                # Server bootstrapper & listener
├── .env                         # Local environment variables
├── .env.example                 # Environment variables template
├── .gitignore                   # Git ignore rules
├── package.json                 # Dependencies and scripts
└── tsconfig.json                # TypeScript compiler settings
```

---

## 📡 Complete REST API Endpoint Directory

### 1. Authentication (`/api/auth`)
- `POST /api/auth/signup` - Register user account
- `POST /api/auth/login` - Authenticate user & receive JWT token
- `GET /api/auth/me` - Get logged-in user profile *(JWT)*

### 2. Home Dashboard (`/api/home`)
- `GET /api/home` - Aggregated dashboard payload *(JWT)*
- `GET /api/home/banners` - Fetch active promotional banners
- `GET /api/home/categories` - Fetch active categories

### 3. Products (`/api/products` & `/api/admin/products`)
- `GET /api/products` - List active products with search, pagination & filters
- `GET /api/products/:id` - Get product details
- `GET /api/products/search?q=query` - Product search
- `GET /api/products/categories` - List product categories
- `GET /api/admin/products` - Admin: List all products *(Admin JWT)*
- `POST /api/admin/products` - Admin: Create new product *(Admin JWT)*
- `PUT /api/admin/products/:id` - Admin: Update product *(Admin JWT)*
- `DELETE /api/admin/products/:id` - Admin: Deactivate/Delete product *(Admin JWT)*

### 4. Cart (`/api/cart`) *(JWT Protected)*
- `GET /api/cart` - View user cart with calculated subtotals
- `POST /api/cart/items` - Add product to cart (stock verified)
- `PUT /api/cart/items/:itemId` - Update cart item quantity
- `DELETE /api/cart/items/:itemId` - Remove item from cart
- `DELETE /api/cart` - Clear all cart items

### 5. Checkout & Orders (`/api/orders` & `/api/admin/orders`) *(JWT Protected)*
- `POST /api/orders` - Place order from current cart (deducts stock, clears cart)
- `GET /api/orders` - User order history
- `GET /api/orders/:id` - View order details
- `PUT /api/orders/:id/cancel` - Cancel pending order (restores product stock)
- `GET /api/admin/orders` - Admin: View all system orders *(Admin JWT)*
- `PUT /api/admin/orders/:id/status` - Admin: Update order status (`pending` -> `processing` -> `dispatched` -> `delivered`) *(Admin JWT)*

### 6. Profile & Address Book (`/api/profile`) *(JWT Protected)*
- `GET /api/profile` - Get profile details
- `PUT /api/profile` - Update name and phone
- `PUT /api/profile/change-password` - Change password
- `GET /api/profile/addresses` - List saved delivery addresses
- `POST /api/profile/addresses` - Add new delivery address
- `PUT /api/profile/addresses/:id` - Update saved address
- `DELETE /api/profile/addresses/:id` - Delete saved address

---

## 🚀 How to Run

```bash
cd backend

# 1. Start development server
npm run dev

# 2. Build production bundle
npm run build
npm start
```
