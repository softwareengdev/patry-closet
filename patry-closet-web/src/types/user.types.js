/**
 * User & Auth type definitions (JSDoc for IDE support without TypeScript)
 * These serve as documentation + enable IDE autocomplete
 */

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} email
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} [avatar] - URL to profile image
 * @property {string} [phone]
 * @property {string} [dateOfBirth] - ISO date string
 * @property {'female'|'male'|'non-binary'|'prefer-not-to-say'} [gender]
 * @property {boolean} emailVerified
 * @property {boolean} twoFactorEnabled
 * @property {string} createdAt - ISO date string
 * @property {UserPreferences} [preferences]
 * @property {Address[]} [addresses]
 * @property {string} [memberSince] - Formatted display string
 */

/**
 * @typedef {Object} UserPreferences
 * @property {string[]} favoriteSizes - e.g. ['S', 'M']
 * @property {string[]} favoriteColors - e.g. ['black', 'white']
 * @property {string[]} favoriteBrands
 * @property {string[]} favoriteCategories - e.g. ['dresses', 'shoes']
 * @property {string[]} stylePreferences - e.g. ['minimal', 'streetwear', 'elegant']
 * @property {NotificationPreferences} notifications
 */

/**
 * @typedef {Object} NotificationPreferences
 * @property {boolean} orderUpdates
 * @property {boolean} promotions
 * @property {boolean} stockAlerts
 * @property {boolean} newArrivals
 * @property {boolean} priceDrops
 * @property {boolean} pushEnabled
 * @property {boolean} emailEnabled
 */

/**
 * @typedef {Object} Address
 * @property {string} id
 * @property {string} label - e.g. 'Home', 'Work'
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} street
 * @property {string} [apartment]
 * @property {string} city
 * @property {string} state
 * @property {string} postalCode
 * @property {string} country
 * @property {string} [phone]
 * @property {boolean} isDefault
 * @property {number} [lat]
 * @property {number} [lng]
 */

/**
 * @typedef {Object} Order
 * @property {string} id
 * @property {string} orderNumber - e.g. 'PC-A1B2C3'
 * @property {'pending'|'processing'|'shipped'|'delivered'|'cancelled'|'returned'} status
 * @property {OrderItem[]} items
 * @property {number} subtotal
 * @property {number} discount
 * @property {number} shipping
 * @property {number} tax
 * @property {number} total
 * @property {string} createdAt
 * @property {string} [estimatedDelivery]
 * @property {string} [trackingNumber]
 * @property {string} [trackingUrl]
 * @property {Address} shippingAddress
 * @property {PaymentMethodSummary} paymentMethod
 */

/**
 * @typedef {Object} OrderItem
 * @property {string} productId
 * @property {string} name
 * @property {string} image
 * @property {string} size
 * @property {string} color
 * @property {number} quantity
 * @property {number} price
 */

/**
 * @typedef {Object} PaymentMethodSummary
 * @property {string} id
 * @property {'visa'|'mastercard'|'amex'|'discover'|'apple_pay'|'google_pay'} brand
 * @property {string} last4
 * @property {string} [expMonth]
 * @property {string} [expYear]
 * @property {boolean} isDefault
 */

/**
 * @typedef {Object} Session
 * @property {string} id
 * @property {string} device - e.g. 'Chrome on Windows'
 * @property {string} location - e.g. 'Madrid, Spain'
 * @property {string} ip
 * @property {string} lastActive - ISO date string
 * @property {boolean} isCurrent
 */

/**
 * @typedef {Object} Notification
 * @property {string} id
 * @property {'order'|'stock'|'promo'|'price_drop'|'system'} type
 * @property {string} title
 * @property {string} message
 * @property {string} [image]
 * @property {string} [actionUrl]
 * @property {boolean} read
 * @property {string} createdAt
 */

/**
 * @typedef {Object} LoginDTO
 * @property {string} email
 * @property {string} password
 * @property {boolean} [rememberMe]
 */

/**
 * @typedef {Object} RegisterDTO
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} email
 * @property {string} password
 * @property {string} [dateOfBirth]
 * @property {string} [gender]
 * @property {boolean} acceptTerms
 */

/**
 * @typedef {Object} AuthTokens
 * @property {string} accessToken
 * @property {string} refreshToken
 * @property {number} expiresIn - seconds until expiry
 */

/**
 * @typedef {Object} AuthState
 * @property {User|null} user
 * @property {boolean} isAuthenticated
 * @property {boolean} isLoading
 * @property {string|null} error
 */

// Zod validation schemas
export { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema, profileSchema, addressSchema } from '../lib/validationSchemas';
