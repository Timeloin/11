# 📦 Multi-User Inventory Management Web App

A production-ready, mobile-first inventory management application built with Next.js (App Router), TypeScript, Tailwind CSS, and MongoDB, tailored for deployment on Vercel and direct use on Android & iPhone browsers.

## 🚀 Key Features

* **Multi-User & Role Permissions (RBAC)**: Admin, Manager, Sales, Inventory, and Viewer with custom member-level override permissions.
* **Multi-Location Inventory**: Manage multiple shop racks, counters, and warehouses with per-location stock levels.
* **Camera Barcode & QR Scanner**: Real-time barcode scanning directly through mobile phone cameras with audio feedback.
* **Atomic Stock Transactions**:
  - Stock In: Increase stock at a selected location
  - Stock Out: Decrease stock for orders/sales
  - Move Stock: Atomic transfer between locations
  - Adjust Stock: Physical stocktaking correction with mandatory reason
* **Fast Search & Low-Stock Alerts**: Real-time filtering, low-stock shortage indicators, and category pills.
* **Purchases & Sales**: Link transactions to suppliers, invoices, customer receipts, and payment methods.
* **Excel & CSV Export**: Export complete stock logs and product spreadsheets with one click.
* **Vercel & MongoDB Atlas Ready**: Serverless Mongoose connection caching with fallback demo data mode.

## 🛠️ Local Development

1. Install dependencies:
   npm install

2. Run development server:
   npm run dev

3. Open http://localhost:3000 in your browser.

## 🚢 Deploying to Vercel

1. Push your code to GitHub / GitLab.
2. Import the repository into Vercel.
3. In your Vercel Project Settings -> Environment Variables, add:
   - MONGODB_URI: Your MongoDB Atlas connection string
   - JWT_SECRET: A random secure key string
4. Click Deploy.
