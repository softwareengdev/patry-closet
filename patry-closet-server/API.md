# PATRY♡CLOSET — REST API Reference

## 1. Overview

**Base URL:** `http://localhost:5200/api/v1`

All responses are wrapped in a standard `ApiResponse<T>` envelope:

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message",
  "errors": [],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "pageSize": 20,
    "totalCount": 100,
    "hasPrevious": false,
    "hasNext": true
  }
}
```

> The `pagination` field is only present on paginated list endpoints. The `message` and `errors` fields may be omitted when not applicable.

---

## 2. Authentication

All authenticated endpoints require the following header:

```
Authorization: Bearer <token>
```

### POST `/auth/register`

Register a new user account.

**Request Body:**

| Field       | Type   | Required | Description          |
|-------------|--------|----------|----------------------|
| email       | string | Yes      | User email address   |
| password    | string | Yes      | User password        |
| firstName   | string | Yes      | First name           |
| lastName    | string | Yes      | Last name            |

**Response:** `AuthResponse`

```json
{
  "accessToken": "eyJhbGci...",
  "refreshToken": "dGhpcyBpcyBh...",
  "expiresAt": "2025-01-15T12:00:00Z",
  "user": {
    "id": "guid",
    "email": "user@example.com",
    "firstName": "Jane",
    "lastName": "Doe"
  }
}
```

### POST `/auth/login`

Authenticate an existing user.

**Request Body:**

| Field    | Type   | Required | Description        |
|----------|--------|----------|--------------------|
| email    | string | Yes      | User email address |
| password | string | Yes      | User password      |

**Response:** `AuthResponse` (same shape as register)

### POST `/auth/refresh`

Obtain a new access token using a valid refresh token.

**Request Body:**

| Field        | Type   | Required | Description            |
|--------------|--------|----------|------------------------|
| refreshToken | string | Yes      | Current refresh token  |

**Response:** `AuthResponse`

### POST `/auth/logout`

🔒 **Auth required.** Invalidates the current refresh token.

### GET `/auth/profile`

🔒 **Auth required.** Returns the authenticated user's profile.

**Response:** `UserProfileResponse`

```json
{
  "id": "guid",
  "email": "user@example.com",
  "firstName": "Jane",
  "lastName": "Doe",
  "avatarUrl": "https://...",
  "roles": ["User"],
  "createdAt": "2025-01-01T00:00:00Z",
  "lastLoginAt": "2025-01-15T08:30:00Z"
}
```

### PUT `/auth/profile`

🔒 **Auth required.** Update the authenticated user's profile fields.

**Request Body:** Partial object with fields to update (`firstName`, `lastName`, `avatarUrl`).

### POST `/auth/change-password`

🔒 **Auth required.** Change the authenticated user's password.

**Request Body:**

| Field           | Type   | Required | Description       |
|-----------------|--------|----------|-------------------|
| currentPassword | string | Yes      | Current password  |
| newPassword     | string | Yes      | New password      |

### POST `/auth/forgot-password`

Initiate a password reset flow. Sends a reset email to the provided address.

**Request Body:**

| Field | Type   | Required | Description        |
|-------|--------|----------|--------------------|
| email | string | Yes      | User email address |

### POST `/auth/reset-password`

Complete a password reset using the token from the reset email.

**Request Body:**

| Field       | Type   | Required | Description                  |
|-------------|--------|----------|------------------------------|
| token       | string | Yes      | Password reset token         |
| newPassword | string | Yes      | New password                 |

---

## 3. Products

### GET `/products`

Retrieve a paginated, filterable list of products.

**Query Parameters:**

| Parameter     | Type    | Default | Description                              |
|---------------|---------|---------|------------------------------------------|
| search        | string  |         | Full-text search across name/description |
| category      | string  |         | Filter by category slug                  |
| subcategory   | string  |         | Filter by subcategory slug               |
| brand         | string  |         | Filter by brand                          |
| color         | string  |         | Filter by color                          |
| size          | string  |         | Filter by size                           |
| badge         | string  |         | Filter by badge (e.g. `New`, `Sale`)     |
| minPrice      | decimal |         | Minimum price                            |
| maxPrice      | decimal |         | Maximum price                            |
| inStock       | bool    |         | Only show in-stock items                 |
| isFeatured    | bool    |         | Only show featured items                 |
| sortBy        | string  |         | Sort field (e.g. `price`, `name`, `createdAt`) |
| sortDirection | string  | `asc`   | `asc` or `desc`                          |
| page          | int     | 1       | Page number                              |
| pageSize      | int     | 20      | Items per page                           |

**Response:** Paginated list of `ProductListDto`

### GET `/products/featured`

Retrieve featured products.

**Query Parameters:**

| Parameter | Type | Default | Description               |
|-----------|------|---------|---------------------------|
| count     | int  | 12      | Number of items to return |

**Response:** Array of `ProductListDto`

### GET `/products/{slug}`

Retrieve full product details by URL slug.

**Response:** `ProductDetailDto` — includes description, material, variants, reviews, related metadata, etc.

### GET `/products/{id}/related`

Retrieve products related to the given product.

**Query Parameters:**

| Parameter | Type | Default | Description               |
|-----------|------|---------|---------------------------|
| count     | int  | 8       | Number of items to return |

**Response:** Array of `ProductListDto`

---

## 4. Categories

### GET `/categories`

Retrieve the full category tree including nested subcategories.

**Response:**

```json
[
  {
    "id": "guid",
    "name": "Dresses",
    "slug": "dresses",
    "subcategories": [
      { "id": "guid", "name": "Mini Dresses", "slug": "mini-dresses" }
    ]
  }
]
```

---

## 5. Cart

All cart endpoints require authentication.

### GET `/cart`

🔒 **Auth required.** Retrieve the current user's cart with all items.

### POST `/cart/items`

🔒 **Auth required.** Add an item to the cart.

**Request Body:**

| Field             | Type   | Required | Description                    |
|-------------------|--------|----------|--------------------------------|
| productId         | string | Yes      | Product ID                     |
| productVariantId  | string | No       | Specific variant (size/color)  |
| quantity          | int    | Yes      | Quantity to add                |

### PUT `/cart/items/{itemId}`

🔒 **Auth required.** Update the quantity of a cart item.

**Request Body:**

| Field    | Type | Required | Description  |
|----------|------|----------|--------------|
| quantity | int  | Yes      | New quantity |

### DELETE `/cart/items/{itemId}`

🔒 **Auth required.** Remove a specific item from the cart.

### DELETE `/cart`

🔒 **Auth required.** Clear the entire cart.

### POST `/cart/merge`

🔒 **Auth required.** Merge locally stored (anonymous) cart items into the server-side cart. Useful after login.

---

## 6. Wishlist

All wishlist endpoints require authentication.

### GET `/wishlist`

🔒 **Auth required.** Retrieve the user's wishlist.

### POST `/wishlist`

🔒 **Auth required.** Add a product to the wishlist.

**Request Body:**

| Field     | Type   | Required | Description |
|-----------|--------|----------|-------------|
| productId | string | Yes      | Product ID  |

### DELETE `/wishlist/{productId}`

🔒 **Auth required.** Remove a product from the wishlist.

### POST `/wishlist/sync`

🔒 **Auth required.** Synchronize a local wishlist with the server. Useful after login.

**Request Body:**

| Field      | Type     | Required | Description              |
|------------|----------|----------|--------------------------|
| productIds | string[] | Yes      | Array of product IDs     |

---

## 7. Orders

All order endpoints require authentication.

### POST `/orders`

🔒 **Auth required.** Create a new order from the current cart.

### GET `/orders`

🔒 **Auth required.** List the authenticated user's orders.

### GET `/orders/{id}`

🔒 **Auth required.** Retrieve details for a specific order.

---

## 8. Payments

### POST `/payments/checkout`

🔒 **Auth required.** Initiate checkout — creates a Stripe `PaymentIntent` and a pending order.

**Request Body:**

| Field             | Type   | Required | Description                  |
|-------------------|--------|----------|------------------------------|
| shippingAddressId | string | Yes      | Saved address ID             |
| shippingMethod    | string | Yes      | Selected shipping method     |
| couponCode        | string | No       | Discount coupon code         |
| notes             | string | No       | Order notes                  |

**Response:**

```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx",
  "orderId": "guid",
  "orderNumber": "PC-20250115-001",
  "amount": 15990,
  "currency": "usd"
}
```

### POST `/payments/{orderId}/confirm`

🔒 **Auth required.** Confirm a payment after Stripe.js client-side completion.

### GET `/payments/{orderId}/status`

🔒 **Auth required.** Check the payment status for an order.

### POST `/payments/{orderId}/cancel`

🔒 **Auth required.** Cancel a pending payment/order.

### POST `/payments/{orderId}/refund`

🔒 **Admin only.** Issue a refund for a completed payment.

---

## 9. Addresses

All address endpoints require authentication.

### GET `/addresses`

🔒 **Auth required.** List the user's saved addresses.

### POST `/addresses`

🔒 **Auth required.** Create a new address.

### PUT `/addresses/{id}`

🔒 **Auth required.** Update an existing address.

### DELETE `/addresses/{id}`

🔒 **Auth required.** Delete an address.

---

## 10. Admin Endpoints

All admin endpoints require the **Admin** role.

### GET `/admin/dashboard`

🔒 **Admin only.** Retrieve dashboard statistics (revenue, order counts, user counts, etc.).

### GET `/admin/orders`

🔒 **Admin only.** List all orders with filtering and pagination.

### GET `/admin/users`

🔒 **Admin only.** List all users for management purposes.

### PUT `/admin/users/{id}/role`

🔒 **Admin only.** Change a user's role.

---

## 11. Health Checks

These endpoints do **not** require authentication and are intended for infrastructure monitoring.

| Endpoint         | Description                                   |
|------------------|-----------------------------------------------|
| `GET /health`       | Overall application health                 |
| `GET /health/ready`  | Readiness probe (database + Redis connectivity) |
| `GET /health/live`   | Liveness probe (process is running)        |

---

## 12. Rate Limits

Rate limiting is applied per IP address.

| Scope           | Limit                      |
|-----------------|----------------------------|
| General         | 100 requests / minute      |
| Auth endpoints  | 10 requests / minute       |

**Response headers** included on every request:

| Header                  | Description                              |
|-------------------------|------------------------------------------|
| `X-RateLimit-Limit`     | Maximum requests allowed in the window   |
| `X-RateLimit-Remaining` | Requests remaining in the current window |
| `X-RateLimit-Reset`     | UTC epoch time when the window resets    |

When the limit is exceeded, the API returns **`429 Too Many Requests`**.

---

## 13. Error Responses

Error responses follow the standard `ApiResponse` envelope with `success: false`:

```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error 1", "Detailed error 2"]
}
```

### HTTP Status Codes

| Code | Meaning              | Typical Cause                                 |
|------|----------------------|-----------------------------------------------|
| 200  | Success              | Request completed successfully                |
| 201  | Created              | Resource created (e.g. new order, address)    |
| 400  | Bad Request          | Validation errors or malformed request body   |
| 401  | Unauthorized         | Missing or invalid authentication token       |
| 403  | Forbidden            | Insufficient permissions (e.g. non-admin)     |
| 404  | Not Found            | Resource does not exist                       |
| 429  | Too Many Requests    | Rate limit exceeded                           |
| 500  | Internal Server Error| Unexpected server-side failure                |
