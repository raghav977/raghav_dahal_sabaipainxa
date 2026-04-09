# Worker Profile & Job Response API Documentation

## Overview
This document covers the new worker profile system and enhanced job response functionality for the Fotnef platform.

---

## Worker Profiles API

### 1. Create or Update Worker Profile
**Endpoint:** `POST /api/worker-profiles/`

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "title": "Full Stack Developer",
  "bio": "Experienced developer with 5+ years",
  "phone": "9841234567",
  "hourly_rate": 25,
  "location_name": "Kathmandu, Nepal",
  "latitude": 27.7172,
  "longitude": 85.3240,
  "service_radius": 10,
  "skills": [
    { "name": "JavaScript", "proficiency": "expert" },
    { "name": "React", "proficiency": "advanced" },
    { "name": "Node.js", "proficiency": "advanced" }
  ],
  "availability_status": "available",
  "years_of_experience": 5,
  "portfolio_links": ["https://portfolio.com", "https://github.com"],
  "certifications": [
    { "name": "AWS Developer", "issuer": "Amazon", "date": "2023-01" }
  ],
  "categories": ["web-development", "frontend"]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": 5,
    "title": "Full Stack Developer",
    "bio": "Experienced developer with 5+ years",
    "profile_photo": null,
    "phone": "9841234567",
    "hourly_rate": 25,
    "location_name": "Kathmandu, Nepal",
    "latitude": 27.7172,
    "longitude": 85.3240,
    "service_radius": 10,
    "skills": [...],
    "total_reviews": 0,
    "average_rating": 0,
    "is_available": true,
    "availability_status": "available",
    "is_verified": false,
    "portfolio_links": [...],
    "certifications": [...],
    "years_of_experience": 5,
    "categories": [...],
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",
    "User": {
      "id": 5,
      "name": "John Doe",
      "email": "john@example.com"
    }
  },
  "message": "Profile saved successfully"
}
```

---

### 2. Get Own Profile
**Endpoint:** `GET /api/worker-profiles/my-profile`

**Authentication:** Required (Bearer token)

**Response (200 OK):**
```json
{
  "success": true,
  "data": { /* Full profile object */ },
  "message": "Your profile"
}
```

---

### 3. Get Worker Profile by ID (Public)
**Endpoint:** `GET /api/worker-profiles/:worker_id`

**Authentication:** Not required

**Response (200 OK):**
```json
{
  "success": true,
  "data": { /* Profile object with public data */ },
  "message": "Profile fetched"
}
```

---

### 4. Search Worker Profiles
**Endpoint:** `GET /api/worker-profiles/search/profiles`

**Authentication:** Not required

**Query Parameters:**
- `skills` (string/array): Filter by skill names
- `location_name` (string): Filter by location name
- `latitude` (number): Center latitude for distance search
- `longitude` (number): Center longitude for distance search
- `radius` (number): Search radius in kilometers (default: 10)
- `title` (string): Filter by profession/title
- `min_rating` (number): Minimum average rating
- `is_verified` (boolean): Filter by KYC verification status
- `availability_status` (string): "available", "busy", or "offline"
- `min_experience` (number): Minimum years of experience
- `max_hourly_rate` (number): Maximum hourly rate
- `page` (number): Page number (default: 1)
- `limit` (number): Results per page (default: 20)

**Example Request:**
```
GET /api/worker-profiles/search/profiles?title=developer&skills=react&min_rating=4&location_name=Kathmandu&page=1&limit=20
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "data": [
      { /* Worker profile object */ },
      { /* Worker profile object */ }
    ]
  },
  "message": "Profiles fetched"
}
```

---

### 5. Upload Profile Photo
**Endpoint:** `POST /api/worker-profiles/:worker_id/upload-photo`

**Authentication:** Required (Bearer token)

**Request Type:** `multipart/form-data`

**Form Data:**
- `profile_photo` (file): Image file (JPG or PNG, max 5MB)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "profile_photo": "/uploads/worker-profiles/5-1705332600000-abc123.jpg"
  },
  "message": "Photo uploaded"
}
```

---

### 6. Update Availability Status
**Endpoint:** `PUT /api/worker-profiles/availability/update`

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "is_available": true,
  "availability_status": "available"
}
```

**Note:** `availability_status` can be: "available", "busy", or "offline"

**Response (200 OK):**
```json
{
  "success": true,
  "data": { /* Updated profile */ },
  "message": "Availability updated"
}
```

---

### 7. Add Skill
**Endpoint:** `POST /api/worker-profiles/skills/add`

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "skill_name": "Python",
  "proficiency_level": "advanced"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": { /* Updated profile with new skill */ },
  "message": "Skill added"
}
```

---

### 8. Remove Skill
**Endpoint:** `DELETE /api/worker-profiles/skills/:skill_id`

**Authentication:** Required (Bearer token)

**Response (200 OK):**
```json
{
  "success": true,
  "data": { /* Updated profile without skill */ },
  "message": "Skill removed"
}
```

---

## Enhanced Job Response API

### 1. Apply to Job with Resume
**Endpoint:** `POST /api/jobs/:id/apply`

**Authentication:** Not required (but recommended)

**Request Type:** `multipart/form-data`

**Form Data:**
- `user_id` (number, required): Applicant user ID
- `cover_letter` (string, optional): Cover letter text
- `resume` (file, optional): Resume file (PDF or Word, max 5MB)
- `desired_position` (string, optional): Position title applicant seeks
- `years_experience` (number, optional): Years of relevant experience
- `availability_days` (number, optional): Days available to start
- `expected_pay` (number, optional): Expected salary/rate
- `portfolio_url` (string, optional): Portfolio website URL
- `linkedin_url` (string, optional): LinkedIn profile URL

**Example cURL:**
```bash
curl -X POST http://localhost:5000/api/jobs/123/apply \
  -F "user_id=5" \
  -F "cover_letter=I am interested in this role" \
  -F "resume=@path/to/resume.pdf" \
  -F "desired_position=Senior Developer" \
  -F "years_experience=5" \
  -F "availability_days=7" \
  -F "expected_pay=50000" \
  -F "portfolio_url=https://portfolio.com" \
  -F "linkedin_url=https://linkedin.com/in/john"
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 15,
    "job_id": 123,
    "user_id": 5,
    "cover_letter": "I am interested in this role",
    "resume_url": "/uploads/resumes/5-123-1705332600000-xyz789.pdf",
    "desired_position": "Senior Developer",
    "years_experience": 5,
    "availability_days": 7,
    "expected_pay": 50000,
    "portfolio_url": "https://portfolio.com",
    "linkedin_url": "https://linkedin.com/in/john",
    "status": "pending",
    "rejection_reason": null,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "message": "Application submitted"
}
```

---

## Database Schema Updates

### WorkerProfile Table
```sql
CREATE TABLE WorkerProfiles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  bio TEXT,
  profile_photo VARCHAR(500),
  phone VARCHAR(20),
  hourly_rate DECIMAL(10, 2),
  location_name VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  service_radius INT DEFAULT 10,
  skills JSON DEFAULT '[]',
  total_reviews INT DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  availability_status ENUM('available', 'busy', 'offline') DEFAULT 'available',
  is_verified BOOLEAN DEFAULT false,
  portfolio_links JSON DEFAULT '[]',
  certifications JSON DEFAULT '[]',
  years_of_experience INT DEFAULT 0,
  categories JSON DEFAULT '[]',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES Users(id),
  INDEX idx_is_available (is_available),
  INDEX idx_availability_status (availability_status),
  INDEX idx_is_verified (is_verified)
);
```

### JobResponse Table (Enhanced)
```sql
CREATE TABLE JobResponses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  job_id INT NOT NULL,
  user_id INT NOT NULL,
  cover_letter TEXT,
  resume_url VARCHAR(500),
  desired_position VARCHAR(255),
  years_experience INT,
  availability_days INT,
  expected_pay DECIMAL(12, 2),
  portfolio_url VARCHAR(500),
  linkedin_url VARCHAR(500),
  status ENUM('pending', 'accepted', 'rejected', 'shortlisted') DEFAULT 'pending',
  rejection_reason TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL,
  UNIQUE KEY unique_application (job_id, user_id),
  FOREIGN KEY (job_id) REFERENCES Jobs(id),
  FOREIGN KEY (user_id) REFERENCES Users(id),
  INDEX idx_job_status (job_id, status),
  INDEX idx_user_id (user_id)
);
```

---

## Frontend Integration Examples

### React - Create/Update Worker Profile
```javascript
const updateProfile = async (profileData) => {
  const response = await fetch('/api/worker-profiles/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(profileData)
  });
  return response.json();
};
```

### React - Search Workers
```javascript
const searchWorkers = async (filters) => {
  const params = new URLSearchParams(filters);
  const response = await fetch(`/api/worker-profiles/search/profiles?${params}`);
  return response.json();
};
```

### React - Upload Resume with Job Application
```javascript
const applyToJob = async (jobId, applicationData, resumeFile) => {
  const formData = new FormData();
  formData.append('user_id', applicationData.user_id);
  formData.append('cover_letter', applicationData.cover_letter);
  if (resumeFile) {
    formData.append('resume', resumeFile);
  }
  formData.append('desired_position', applicationData.desired_position);
  formData.append('years_experience', applicationData.years_experience);
  formData.append('availability_days', applicationData.availability_days);
  formData.append('expected_pay', applicationData.expected_pay);
  formData.append('portfolio_url', applicationData.portfolio_url);
  formData.append('linkedin_url', applicationData.linkedin_url);

  const response = await fetch(`/api/jobs/${jobId}/apply`, {
    method: 'POST',
    body: formData
  });
  return response.json();
};
```

---

## Error Handling

### Common Error Responses

**Unauthorized (401):**
```json
{
  "success": false,
  "message": "Authentication required"
}
```

**Bad Request (400):**
```json
{
  "success": false,
  "error": "Title (profession) is required",
  "message": "Invalid request"
}
```

**Not Found (404):**
```json
{
  "success": false,
  "message": "Profile not found"
}
```

**Conflict (409):**
```json
{
  "success": false,
  "error": "You have already applied to this job",
  "message": "Conflict"
}
```

**Server Error (500):**
```json
{
  "success": false,
  "error": "Error details here",
  "message": "Failed to save profile"
}
```

---

## Notes

1. **File Uploads:**
   - Profile photos: JPG, PNG (max 5MB)
   - Resumes: PDF, DOC, DOCX (max 5MB)
   - Files are stored at `/uploads/` directory
   - URLs are returned in response

2. **Location-Based Search:**
   - Uses Haversine formula for distance calculation
   - Coordinates: latitude (-90 to 90), longitude (-180 to 180)
   - Service radius in kilometers

3. **Skills Management:**
   - Each skill has: id (timestamp), name, proficiency level
   - Proficiency levels: "beginner", "intermediate", "advanced", "expert"

4. **Availability Status:**
   - "available": Ready to take new work
   - "busy": Currently working, may not be available
   - "offline": Not currently available

5. **Rating System:**
   - average_rating: 0-5 scale
   - total_reviews: Count of reviews received
   - Populated from reviews/ratings system

---

## Future Enhancements

1. Geospatial indexes (PostGIS) for better location searches
2. Advanced search filters (certifications, exact skill match)
3. Worker badges and achievements
4. Saved searches for business accounts
5. Batch applicant management and status updates
6. Resume parsing and auto-fill
7. Video profile support
8. Background verification integration
