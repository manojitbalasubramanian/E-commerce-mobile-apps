# Backend (Express)

Simple Express API for products and invoices.

Run:

```powershell
cd backend
npm install
npm start
```

Endpoints:
- `GET /api/products` - list products
- `GET /api/products/:id` - product details
- `POST /api/checkout` - body: `{ cart: [...], customer: {...} }` -> creates invoice
- `GET /api/invoices` - list invoices
