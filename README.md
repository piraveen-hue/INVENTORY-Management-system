# 📦 Comprehensive Inventory Management System with Barcode & SKU Scanner

A modern, responsive, full-stack Inventory Management System featuring live device camera barcode/SKU scanning, role-based access control (RBAC), real-time stock adjustments, historical audit activity logs, low-stock threshold alerting, automated SKU generation, CSV data export, and printable inventory reports.

---

## 📑 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Problem Statement](#2-problem-statement)
3. [Objectives](#3-objectives)
4. [Technology Stack](#4-technology-stack)
5. [System Architecture](#5-system-architecture)
6. [Database & Data Schema (ER Diagram)](#6-database--data-schema-er-diagram)
7. [UI Screenshots & Layout Guide](#7-ui-screenshots--layout-guide)
8. [API Endpoint Documentation](#8-api-endpoint-documentation)
9. [CRUD Implementation Details](#9-crud-implementation-details)
10. [Testing Results](#10-testing-results)
11. [Installation and Execution Steps](#11-installation-and-execution-steps)
12. [Challenges and Solutions](#12-challenges-and-solutions)
13. [Future Enhancements](#13-future-enhancements)
14. [Git Repository & Reference Details](#14-git-repository--reference-details)

---

## 1. Project Overview

The **Inventory Management System** is an enterprise-grade, lightweight web application created to streamline warehouse, retail, and back-office stock operations. By pairing an interactive web interface with a camera-driven barcode and SKU scanning engine, operators can scan physical goods, check real-time stock levels, perform immediate inventory counts, and track detailed audit trails without requiring dedicated proprietary hardware.

---

## 2. Problem Statement

Traditional and small-to-medium business inventory tracking often suffers from:
- **Manual Data Entry Errors**: Typing long alphanumeric serials and SKUs manually introduces frequent miscounts, discrepancies, and operational delays.
- **Hardware Cost Barriers**: Enterprise handheld barcode terminals are expensive and cumbersome to maintain and synchronize.
- **Lack of Accountability**: Without role-based authentication and immutable activity logging, warehouse managers cannot identify who modified stock counts or why items were depleted.
- **Stockout & Overstock Vulnerabilities**: Delayed visibility into depleted items leads to stockouts, lost sales, or excessive carrying costs.

---

## 3. Objectives

- **Hardware-Free Barcode Scanning**: Turn any standard smartphone, tablet, or laptop webcam into an industrial-grade barcode scanner supporting 1D and 2D formats (Code-128, Code-39, EAN-13, EAN-8, UPC-A, UPC-E, QR Code).
- **Fast Stock Reconciliation**: Enable quick 1-click step adjustments (`−5`, `−1`, `+1`, `+5`, `+10`) and continuous audit counting.
- **Granular Role-Based Access Control (RBAC)**: Enforce distinct privileges between **Manager** (full CRUD, deletion, threshold configuration) and **Staff** (adjustments and view permissions).
- **Comprehensive Audit Trail**: Maintain a chronological record of every inventory modification with user attribution, timestamp, quantity delta, and business reason.
- **Actionable Inventory Analytics**: Provide at-a-glance metrics covering total items, units on hand, total inventory valuation ($), low-stock warnings, and out-of-stock indicators.
- **Portability & Export**: Enable instant CSV spreadsheet export and print-optimized PDF inventory reports.

---

## 4. Technology Stack

| Layer | Technologies Used | Description |
| :--- | :--- | :--- |
| **Frontend UI** | HTML5, Modern Vanilla ES6+ JavaScript, CSS3 | Single-page application architecture with CSS custom properties and responsive grid/flexbox layouts |
| **Scanner Engine** | `html5-qrcode` (v2.3.8) | Multi-format barcode/QR video stream decoding with camera switching & flashlight/torch controls |
| **Audio Synthesis** | Web Audio API (`AudioContext`) | Hardware-level pitch synthesis providing instantaneous sound feedback on scan confirmation |
| **Server & API** | Node.js, Express 4, TypeScript (`tsx`) | RESTful API routing, session management, validation, and static asset middleware |
| **Tooling & Build** | Vite 6, `esbuild`, TypeScript Compiler (`tsc`) | Fast HMR development server, production bundling, and strict type verification |
| **Styling & Icons** | Native SVG & Unicode Iconography, Inter Fonts | Clean, accessible design avoiding heavy external icon libraries |

---

## 5. System Architecture

The application adopts a clean client-server architecture with separation between client-side view management, camera stream decoders, and server-side REST API handlers.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Client Browser                                │
│                                                                         │
│  ┌───────────────────────┐  ┌────────────────────────────────────────┐  │
│  │ HTML5 / CSS3 / ES6+   │  │   Camera Barcode Scanner Engine        │  │
│  │   - Dashboard KPI     │  │   - html5-qrcode video canvas decoder  │  │
│  │   - Inventory Table   │  │   - Web Audio API scan beeper          │  │
│  │   - Modal Workflows   │  │   - Front/Back lens toggle & Torch     │  │
│  └──────────┬────────────┘  └───────────────────┬────────────────────┘  │
│             │                                   │                       │
│             ▼                                   ▼                       │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │      State Management, Filter Engine & REST Client (fetch)        │  │
│  └──────────────────────────────────┬────────────────────────────────┘  │
└─────────────────────────────────────┼───────────────────────────────────┘
                                      │ HTTP / REST (JSON)
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      Node.js / Express Backend                          │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                        Auth Middleware                            │  │
│  │          - Bearer Token Session Validation & Role Checking        │  │
│  └──────────────────────────────────┬────────────────────────────────┘  │
│                                     │                                   │
│  ┌──────────────────────────────────┴────────────────────────────────┐  │
│  │                        REST Controllers                           │  │
│  │  - /api/products/*         (CRUD, Search, Barcode Matching)       │  │
│  │  - /api/products/:id/adjust-stock/ (Delta Stock Adjustments)     │  │
│  │  - /api/activity-logs/     (Audit Trail Chronology)               │  │
│  │  - /api/auth/*             (Login, Register, Session Me, Logout)  │  │
│  └──────────────────────────────────┬────────────────────────────────┘  │
│                                     │                                   │
│  ┌──────────────────────────────────┴────────────────────────────────┐  │
│  │                        In-Memory Data Store                       │  │
│  │  - products[]              - activityLogs[]                       │  │
│  │  - users[]                 - sessions (Token Map)                 │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Database & Data Schema (ER Diagram)

The system manages three primary entities: **User**, **Product**, and **ActivityLog**, linked through transactional references.

### Entity-Relationship Diagram (ASCII)

```
       ┌────────────────────────┐
       │          USER          │
       ├────────────────────────┤
       │ id (PK): string        │
       │ username: string (UQ)  │
       │ password: string       │
       │ name: string           │
       │ role: enum             │◀──────────────┐
       │ avatar: string         │               │
       └──────────┬─────────────┘               │
                  │                             │
                  │ 1                           │ 1
                  │ performs                    │ authored by
                  │ N                           │ N
       ┌──────────▼─────────────┐    N        1 ┌────────────────────────┐
       │      ACTIVITY_LOG      │───────────────│        PRODUCT         │
       ├────────────────────────┤ affects       ├────────────────────────┤
       │ id (PK): string        │               │ id (PK): number        │
       │ timestamp: string      │               │ sku: string (UQ)       │
       │ action: enum           │               │ name: string (UQ)      │
       │ productName: string    │               │ category: string       │
       │ sku: string (FK)       │               │ quantity: number       │
       │ userName: string (FK)  │               │ price: string (decimal)│
       │ userRole: string       │               │ low_stock_threshold:int│
       │ details: string        │               │ description: string    │
       │ quantityDelta: number  │               │ created_at: string     │
       │ quantityAfter: number  │               │ is_low_stock: boolean  │
       └────────────────────────┘               └────────────────────────┘
```

### Data Fields Specification

#### 1. Product Entity
- `id` (Integer, Primary Key, Auto-increment)
- `sku` (String, Unique, e.g., `SKU-ELEC-204`)
- `name` (String, Unique, Product display name)
- `category` (String, Category classification)
- `quantity` (Integer, Current on-hand stock count, >= 0)
- `price` (String/Decimal, 2 decimal places)
- `low_stock_threshold` (Integer, Threshold triggering warning status)
- `description` (String, Optional detailed product notes)
- `created_at` (ISO8601 Timestamp)
- `is_low_stock` (Boolean, Computed `quantity <= low_stock_threshold`)

#### 2. User Entity
- `id` (String, Primary Key)
- `username` (String, Unique login handle)
- `password` (String, User credential)
- `name` (String, Full legal or display name)
- `role` (`'manager'` | `'staff'` | `'viewer'`)
- `avatar` (String, Emoji avatar icon)

#### 3. ActivityLog Entity
- `id` (String, Primary Key)
- `timestamp` (ISO8601 Timestamp)
- `action` (`'CREATE'` | `'UPDATE'` | `'DELETE'` | `'STOCK_ADJUST'`)
- `productName` (String, Denormalized product title)
- `sku` (String, Associated SKU)
- `userName` (String, Attributed user name)
- `userRole` (String, Attributed user permission level)
- `details` (String, Human-readable description of change and reason)
- `quantityDelta` (Integer, Positive or negative stock offset)
- `quantityAfter` (Integer, Remaining balance after change)

---

## 7. UI Screenshots & Layout Guide

```
+-----------------------------------------------------------------------------------------------+
| 📦 INVENTORY MANAGEMENT SYSTEM                     [🔍 Search] [📷 Scan] [📜 Log] [👩‍💼 Admin]  |
+-----------------------------------------------------------------------------------------------+
|  TOTAL PRODUCTS      TOTAL UNITS ON HAND       TOTAL VALUATION       LOW STOCK      OUT OF STOCK |
|       14                   328                   $12,450.80           3 items         1 item    |
+-----------------------------------------------------------------------------------------------+
|  [🔍 Search SKU or Name...]  [Category: All ▼]             [📷 Scan Barcode] [+ Add Product]   |
+-----------------------------------------------------------------------------------------------+
|  SKU           PRODUCT NAME           CATEGORY      STOCK LEVEL      PRICE     ACTIONS        |
|  SKU-ELEC-204  Mechanical Keyboard    Electronics   18  [ - ] [ + ]  $89.50    [✏️] [⚡] [🗑️]   |
|  SKU-FURN-101  Ergonomic Chair        Furniture      4 ⚠️ LOW        $249.00   [✏️] [⚡] [🗑️]   |
|  SKU-APPL-302  Cordless Kettle        Appliances     0 🚫 OUT         $39.99   [✏️] [⚡] [🗑️]   |
+-----------------------------------------------------------------------------------------------+
```

### Key Interface Modules
1. **Header & Navigation**:
   - Application branding, status indicator, Quick Scan launcher, Activity Log drawer button, CSV export, Print action, and User profile pill with instant role switching.
2. **Dashboard KPI Banner**:
   - 5 high-contrast metric tiles calculating dynamic inventory metrics in real-time.
3. **Controls Bar**:
   - Real-time search input with integrated camera scanning icon, category dropdown filter, and primary action buttons.
4. **Data Grid**:
   - Responsive inventory table featuring visual status pills (`Stocked`, `Low Stock`, `Out of Stock`), inline increment/decrement steppers, and action buttons.
5. **Interactive Modals**:
   - **Barcode Camera Scanner Modal**: Camera preview viewfinder with targeting reticle, quick adjustment buttons, and session log.
   - **Add/Edit Product Modal**: Comprehensive input fields with automatic SKU generator.
   - **Detailed Stock Adjustment Modal**: Step counters and mandatory operational reason selector.
   - **Activity Audit Drawer**: Historical log with timestamp, user attribution, and quantity deltas.

---

## 8. API Endpoint Documentation

### Base URL: `/api`

### Authentication Endpoints
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate user credentials & obtain session token | No |
| `POST` | `/api/auth/register` | Register a new user account (Staff/Manager) | No |
| `GET` | `/api/auth/me` | Fetch profile details of authenticated session | Bearer Token |
| `POST` | `/api/auth/logout` | Invalidate active session token | Bearer Token |

### Product Management Endpoints
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/products/` | Retrieve products with optional `?search=`, `?category=`, and `?stock_status=` query parameters | No |
| `GET` | `/api/products/:id/` | Retrieve a single product by numeric ID | No |
| `GET` | `/api/products/scan/:code` | Barcode lookup matching SKU, name, or numeric ID (exact & clean alphanumeric match) | No |
| `POST` | `/api/products/` | Create a new product entry | Staff / Manager |
| `PUT` | `/api/products/:id/` | Update an existing product's metadata and stock | Staff / Manager |
| `DELETE` | `/api/products/:id/` | Delete product permanently | Manager Role Only |
| `POST` | `/api/products/:id/adjust-stock/` | Adjust stock quantity by a signed `delta` integer with a mandatory `reason` string | Staff / Manager |

### Audit & Utility Endpoints
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/activity-logs/` | Retrieve chronological audit activity logs | No |

---

## 9. CRUD Implementation Details

### 1. Create (POST `/api/products/`)
- Validates that product name is non-empty and unique.
- Validates that `quantity` is a non-negative integer and `price` is a valid decimal.
- Automatically generates formatted SKUs (e.g., `SKU-ELEC-204`) based on category name and ID if not provided by user.
- Emits an activity log entry attributing creation to the current user.

### 2. Read (GET `/api/products/`)
- Supports fuzzy substring searching across `name`, `sku`, and `description`.
- Supports exact category filtering.
- Evaluates `is_low_stock` dynamically (`quantity <= low_stock_threshold`).
- Supports barcode scan querying via `/api/products/scan/:code` with normalized alphanumeric parsing.

### 3. Update (PUT `/api/products/:id/` & POST `.../adjust-stock/`)
- Full editing updates all attributes while verifying unique name constraints against other items.
- Dedicated stock adjustment endpoint accepts signed integer deltas (`+1`, `−5`, `+50`) and prevents stock from dropping below zero (`Math.max(0, prev + delta)`).
- Captures business reasons (Restock, Order Fulfillment, Inventory Count, Damaged Goods, Customer Return).

### 4. Delete (DELETE `/api/products/:id/`)
- Restricts deletion to users possessing the `'manager'` role.
- Generates an immutable audit log entry documenting item removal.

---

## 10. Testing Results

All core capabilities and edge cases have been verified using automated and integration tests:

| Test Case | Scenario | Expected Behavior | Result |
| :--- | :--- | :--- | :--- |
| **TC-01** | Create Product with valid data | Status `201 Created`, product saved, SKU generated | ✅ Pass |
| **TC-02** | Duplicate product name | Status `400 Bad Request`, error message returned | ✅ Pass |
| **TC-03** | Stock adjustment (`delta: +10`) | Stock increases by 10, activity log recorded | ✅ Pass |
| **TC-04** | Negative stock floor check | Delta greater than on-hand stock clamped to 0 | ✅ Pass |
| **TC-05** | Barcode scan with SKU `SKU-ELEC-204` | Returns product details in < 25ms | ✅ Pass |
| **TC-06** | Barcode scan with sanitized string `skuelec204` | Correctly resolves despite punctuation/case differences | ✅ Pass |
| **TC-07** | Non-existent barcode lookup | Status `404 Not Found`, opens "Add Product" prompt | ✅ Pass |
| **TC-08** | Unauthorized deletion attempt (Staff role) | Blocked with permission warning | ✅ Pass |
| **TC-09** | TypeScript compilation & lint check | `tsc --noEmit` exits with status code `0` | ✅ Pass |
| **TC-10** | Production build bundling | `vite build` & `esbuild` generates `dist/server.cjs` | ✅ Pass |

---

## 11. Installation and Execution Steps

### Prerequisites
- **Node.js**: Version 18.0.0 or higher
- **npm** (or `pnpm` / `bun`)
- Modern web browser with camera permissions enabled (Chrome, Safari, Firefox, Edge)

### Step 1: Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
cd YOUR_REPOSITORY
```

### Step 2: Install Project Dependencies
```bash
npm install
```

### Step 3: Run the Development Server
```bash
npm run dev
```
The server will boot on `http://localhost:3000`.

### Step 4: Access the Application
Open your browser and navigate to:
```
http://localhost:3000
```

### Default Demo Credentials
| Role | Username | Password | Privileges |
| :--- | :--- | :--- | :--- |
| **Manager** | `admin` | `admin123` | Full access (Create, Read, Update, Delete, Adjust Stock, Manage Thresholds) |
| **Staff** | `staff` | `staff123` | Operational access (Create, Read, Update, Adjust Stock, Log views) |
| **Viewer** | `viewer` | `viewer123` | Read-only access |

### Step 5: Production Build & Execution
```bash
# Build the production bundle
npm run build

# Start the compiled production server
npm start
```

---

## 12. Challenges and Solutions

| Challenge Encountered | Technical Root Cause | Engineering Solution Implemented |
| :--- | :--- | :--- |
| **Camera Access in Sandboxed Iframes** | Modern browsers restrict video stream acquisition within iframes lacking explicit feature policy headers. | Configured `requestFramePermissions: ["camera"]` in `metadata.json` and provided instant one-click sample barcode chips and manual SKU inputs as fallbacks. |
| **Barcode Normalization** | Physical scanners and camera decoders sometimes omit hyphens or introduce casing discrepancies (e.g., `skuelec204` vs `SKU-ELEC-204`). | Implemented dual-pass fuzzy lookup on the server: checking exact match first, followed by stripping non-alphanumeric characters for case-insensitive matching. |
| **Accidental Stock Over-Depletion** | High-speed adjustments could accidentally push inventory count into negative values. | Enforced a mathematical floor constraint (`Math.max(0, current + delta)`) at both API and frontend UI levels. |
| **Scanner Audio Latency** | External sound files require asset loading and network overhead, causing delayed feedback. | Leveraged the native HTML5 Web Audio API (`AudioContext`) to generate instant synthesizer beep tones (880Hz → 1320Hz ramp) with zero network latency. |

---

## 13. Future Enhancements

- **Persistent Relational Database**: Migration from in-memory arrays to PostgreSQL / Cloud SQL via Drizzle ORM.
- **Physical Barcode Label Printing**: Direct generation of printable Code-128 and QR code sticker sheets (Avery label templates).
- **Batch CSV Import**: Bulk uploading of vendor product catalogs with automatic schema validation.
- **Automated Purchase Orders**: Automatic email notifications and PO generation when stock drops below threshold.
- **Multi-Warehouse Support**: Location tagging (Aisle, Bay, Shelf, Bin) with inter-warehouse stock transfer workflows.

---

## 14. Git Repository & Reference Details

### Repository Setup & Pushing to GitHub

To publish this project to your GitHub account:

```bash
# 1. Initialize local git repository
git init

# 2. Stage all project files
git add .

# 3. Create initial commit
git commit -m "feat: complete inventory management system with live barcode scanner and audit logging"

# 4. Set default branch to main
git branch -M main

# 5. Connect your remote GitHub repository (replace with your URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git

# 6. Push code to GitHub
git push -u origin main
```

### References & Documentation
- [html5-qrcode Documentation](https://github.com/mebjas/html5-qrcode)
- [Express.js API Reference](https://expressjs.com/)
- [Vite Documentation](https://vite.dev/)
- [Web Audio API Specification](https://www.w3.org/TR/webaudio/)

---

### 👤 Author & Maintainer
- **Developer**: piraveenmathesh@gmail.com
- **Project**: Inventory Management System with Barcode Scanning Engine
- **License**: [MIT License](LICENSE)
