# Website Builder API Documentation

## Overview
The Website Builder feature allows business accounts to create and manage professional websites without coding. Only authenticated business account owners can access this feature.

## Database Structure

### WebsiteBuilder Table
```sql
- id (INT, PK, AI)
- business_account_id (INT, FK -> BusinessAccounts)
- website_name (VARCHAR 255)
- website_slug (VARCHAR 255, UNIQUE)
- is_published (BOOLEAN, default: false)
- published_at (DATETIME, nullable)
- theme (JSON) - Color scheme, fonts, styling
- pages (JSON) - Array of page definitions
- seo (JSON) - SEO metadata
- analytics_code (TEXT, nullable) - Google Analytics, etc
- custom_domain (VARCHAR 255, UNIQUE, nullable)
- is_custom_domain_verified (BOOLEAN, default: false)
- settings (JSON) - Feature toggles
- createdAt (DATETIME)
- updatedAt (DATETIME)
```

## API Endpoints

### 1. Create Website
**POST** `/api/website-builder`

**Request:**
```json
{
  "website_name": "My Awesome Business",
  "theme": {
    "primaryColor": "#3B82F6",
    "secondaryColor": "#10B981",
    "font": "Inter, sans-serif",
    "style": "modern"
  },
  "pages": []
}
```

**Response:** `201 Created`
```json
{
  "id": 1,
  "business_account_id": 1,
  "website_name": "My Awesome Business",
  "website_slug": "my-awesome-business",
  "is_published": false,
  "theme": { ... },
  "pages": [],
  "createdAt": "2026-04-08T...",
  "updatedAt": "2026-04-08T..."
}
```

---

### 2. Get All Business Websites
**GET** `/api/website-builder`

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "website_name": "My Awesome Business",
      "website_slug": "my-awesome-business",
      "is_published": true,
      "published_at": "2026-04-08T...",
      ...
    }
  ]
}
```

---

### 3. Get Single Website
**GET** `/api/website-builder/:website_id`

**Response:** `200 OK` (returns complete website with all pages/theme)

---

### 4. Update Website (Theme, Pages, SEO, Settings)
**PUT** `/api/website-builder/:website_id`

**Request:**
```json
{
  "theme": {
    "primaryColor": "#FF6B6B",
    "secondaryColor": "#4ECDC4",
    "font": "Poppins, sans-serif",
    "style": "bold"
  },
  "pages": [
    {
      "name": "home",
      "sections": [
        {
          "type": "hero",
          "headline": "Welcome to Our Business",
          "subheadline": "We provide amazing services",
          "cta": {
            "text": "Get Started",
            "action": "contact"
          }
        },
        {
          "type": "about",
          "title": "About Us",
          "content": "We are..."
        }
      ]
    }
  ],
  "seo": {
    "title": "My Awesome Business | Services",
    "description": "We provide top-notch services",
    "keywords": "business, services, quality"
  },
  "settings": {
    "enableComments": true,
    "enableNewsletter": true,
    "enableContactForm": true
  }
}
```

**Response:** `200 OK` (updated website object)

---

### 5. Publish/Unpublish Website
**PATCH** `/api/website-builder/:website_id/publish`

**Request:**
```json
{
  "is_published": true
}
```

**Response:** `200 OK`
```json
{
  "is_published": true,
  "published_at": "2026-04-08T10:30:00.000Z"
}
```

---

### 6. Set Custom Domain
**PATCH** `/api/website-builder/:website_id/domain`

**Request:**
```json
{
  "custom_domain": "mybusiness.com"
}
```

**Response:** `200 OK`
```json
{
  "custom_domain": "mybusiness.com",
  "is_custom_domain_verified": false,
  "message": "Custom domain set. Please verify DNS records."
}
```

---

### 7. Delete Website
**DELETE** `/api/website-builder/:website_id`

**Response:** `200 OK`
```json
{
  "message": "Website deleted successfully"
}
```

---

## Example: Complete Website JSON Structure

```json
{
  "id": 1,
  "business_account_id": 5,
  "website_name": "TechStart Solutions",
  "website_slug": "techstart-solutions",
  "is_published": true,
  "published_at": "2026-04-08T10:00:00.000Z",
  "theme": {
    "primaryColor": "#3B82F6",
    "secondaryColor": "#10B981",
    "font": "Inter, sans-serif",
    "style": "modern"
  },
  "pages": [
    {
      "name": "home",
      "sections": [
        {
          "type": "hero",
          "headline": "Welcome to TechStart Solutions",
          "subheadline": "Innovative IT solutions for your business",
          "cta": {
            "text": "Get Started Today",
            "action": "/contact"
          }
        },
        {
          "type": "about",
          "title": "Who We Are",
          "content": "We are a team of experienced IT professionals dedicated to helping businesses succeed with cutting-edge technology solutions."
        },
        {
          "type": "services",
          "items": [
            {
              "title": "Web Development",
              "description": "Custom websites and web applications tailored to your needs"
            },
            {
              "title": "Cloud Solutions",
              "description": "Secure and scalable cloud infrastructure for your business"
            },
            {
              "title": "IT Consulting",
              "description": "Strategic technology guidance to optimize your operations"
            }
          ]
        },
        {
          "type": "features",
          "items": [
            {
              "title": "24/7 Support",
              "description": "Round-the-clock customer support"
            },
            {
              "title": "Scalable",
              "description": "Grows with your business"
            },
            {
              "title": "Secure",
              "description": "Enterprise-grade security"
            }
          ]
        },
        {
          "type": "testimonials",
          "items": [
            {
              "name": "John Doe",
              "review": "TechStart transformed our business with their innovative solutions. Highly recommended!"
            },
            {
              "name": "Jane Smith",
              "review": "Professional team, excellent service. They really understand what we needed."
            }
          ]
        },
        {
          "type": "cta",
          "headline": "Ready to Transform Your Business?",
          "buttonText": "Start Your Project Today"
        },
        {
          "type": "contact",
          "email": "info@techstart.com",
          "phone": "+977-1-1234567",
          "address": "Kathmandu, Nepal"
        }
      ]
    },
    {
      "name": "services",
      "sections": [
        {
          "type": "hero",
          "headline": "Our Services",
          "subheadline": "Comprehensive IT solutions for your business needs"
        },
        {
          "type": "services",
          "items": [
            {
              "title": "Web Development",
              "description": "From concept to deployment, we build beautiful and functional websites"
            }
          ]
        }
      ]
    }
  ],
  "seo": {
    "title": "TechStart Solutions | IT Services & Consulting",
    "description": "Innovative IT solutions and consulting services for businesses",
    "keywords": "IT services, web development, cloud solutions, consulting"
  },
  "analytics_code": "GA-XXXXXXXXX-X",
  "custom_domain": "techstart.com",
  "is_custom_domain_verified": true,
  "settings": {
    "enableComments": false,
    "enableNewsletter": true,
    "enableContactForm": true
  },
  "createdAt": "2026-04-01T08:00:00.000Z",
  "updatedAt": "2026-04-08T10:00:00.000Z"
}
```

---

## Access Control

- **Authentication Required**: Yes (authMiddleware)
- **Authorization**: User must own the business account that owns the website
- **Rate Limit**: Subject to global rate limiting

---

## Error Handling

| Status | Error | Cause |
|--------|-------|-------|
| 400 | Bad Request | Missing required fields |
| 401 | Unauthorized | No authentication token |
| 403 | Forbidden | User doesn't own this website |
| 404 | Not Found | Website or Business Account not found |
| 409 | Conflict | Duplicate slug or domain |
| 500 | Server Error | Internal error |

---

## Relationships

```
User
  └── BusinessAccount (1:1)
        └── WebsiteBuilder (1:Many)
```

A business account can have multiple websites, but only the owner can manage them.

---

## Frontend Usage Example

```javascript
// Create a new website
const response = await fetch('/api/website-builder', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    website_name: 'My Business',
    theme: {
      primaryColor: '#3B82F6',
      secondaryColor: '#10B981',
      font: 'Inter, sans-serif',
      style: 'modern'
    }
  })
});

// Get all websites
const websites = await fetch('/api/website-builder', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Update website pages
const updated = await fetch('/api/website-builder/1', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    pages: [/* page definitions */]
  })
});

// Publish website
const published = await fetch('/api/website-builder/1/publish', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ is_published: true })
});
```

---

## Notes

- Websites are stored with unique slugs for public URL generation
- Published websites can be accessed via `domain.com` or `website-slug.sabaipainxa.com`
- Custom domains require DNS verification (TXT record)
- SEO metadata can be customized for each website
- Analytics code can be injected for tracking
- Theme changes apply to the entire website
- Pages follow a modular section-based structure for flexibility
