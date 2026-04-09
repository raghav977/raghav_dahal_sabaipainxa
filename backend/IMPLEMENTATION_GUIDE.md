# Implementation Guide: Worker Profile & Enhanced Job Response System

## ✅ What's Been Implemented

### Backend Infrastructure
1. **WorkerProfile Model** (`/backend/src/models/WorkerProfile.js`)
   - ✅ Comprehensive schema with skills, location, ratings, portfolio
   - ✅ JSON columns for flexible data storage
   - ✅ Database indexes for search performance

2. **Enhanced JobResponse Model** (`/backend/src/models/JobResponse.js`)
   - ✅ Resume URL field for file uploads
   - ✅ Applicant information fields (years_experience, availability_days, expected_pay)
   - ✅ Portfolio and LinkedIn URLs
   - ✅ Status tracking (pending, accepted, rejected, shortlisted)

3. **Database Relationships** (`/backend/src/database/relation.js`)
   - ✅ User ↔ WorkerProfile (1:1 relationship)
   - ✅ Job ↔ JobResponse (1:M relationship)

4. **WorkerProfile Controller** (`/backend/src/controllers/workerProfile.controller.js`)
   - ✅ `createOrUpdateProfile()` - Create/update profile with skills
   - ✅ `getProfile()` - Get public worker profile
   - ✅ `getMyProfile()` - Get authenticated user's profile
   - ✅ `uploadProfilePhoto()` - Upload and store profile picture
   - ✅ `searchProfiles()` - Search by skills, location, rating, experience
   - ✅ `updateAvailability()` - Change availability status
   - ✅ `addSkill()` - Add new skill
   - ✅ `removeSkill()` - Remove skill
   - ✅ Geographic search using Haversine formula

5. **WorkerProfile Routes** (`/backend/src/routes/workerProfile.routes.js`)
   - ✅ POST `/api/worker-profiles/` - Create/update profile
   - ✅ GET `/api/worker-profiles/my-profile` - Get own profile
   - ✅ GET `/api/worker-profiles/:worker_id` - Get public profile
   - ✅ GET `/api/worker-profiles/search/profiles` - Search workers
   - ✅ POST `/api/worker-profiles/:worker_id/upload-photo` - Upload photo
   - ✅ PUT `/api/worker-profiles/availability/update` - Update availability
   - ✅ POST `/api/worker-profiles/skills/add` - Add skill
   - ✅ DELETE `/api/worker-profiles/skills/:skill_id` - Remove skill

6. **Enhanced Job Controller** (`/backend/src/controllers/job.controller.js`)
   - ✅ `apply()` - Enhanced with file upload and additional fields
   - ✅ Resume upload handling
   - ✅ Applicant information capture

7. **Job Routes with Multer** (`/backend/src/routes/job.routes.js`)
   - ✅ Updated apply endpoint to accept resume files
   - ✅ File validation (PDF, DOC, DOCX)
   - ✅ File size limits (5MB)

8. **App Integration** (`/backend/src/app.js`)
   - ✅ WorkerProfile routes registered
   - ✅ Upload directory configured
   - ✅ Payload limits set to 50MB

---

## 🚀 How to Use

### For Worker Accounts

#### 1. Create Profile
```bash
curl -X POST http://localhost:5000/api/worker-profiles/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Full Stack Developer",
    "bio": "5+ years experience",
    "phone": "9841234567",
    "hourly_rate": 25,
    "location_name": "Kathmandu",
    "latitude": 27.7172,
    "longitude": 85.3240,
    "service_radius": 15,
    "skills": [
      {"name": "JavaScript", "proficiency": "expert"},
      {"name": "React", "proficiency": "advanced"}
    ],
    "years_of_experience": 5,
    "availability_status": "available"
  }'
```

#### 2. Upload Profile Photo
```bash
curl -X POST http://localhost:5000/api/worker-profiles/1/upload-photo \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "profile_photo=@path/to/photo.jpg"
```

#### 3. Update Availability
```bash
curl -X PUT http://localhost:5000/api/worker-profiles/availability/update \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "is_available": true,
    "availability_status": "busy"
  }'
```

#### 4. Add Skills
```bash
curl -X POST http://localhost:5000/api/worker-profiles/skills/add \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "skill_name": "TypeScript",
    "proficiency_level": "advanced"
  }'
```

### For Job Applicants

#### Apply to Job with Resume
```bash
curl -X POST http://localhost:5000/api/jobs/123/apply \
  -F "user_id=5" \
  -F "cover_letter=I am very interested in this role" \
  -F "resume=@path/to/resume.pdf" \
  -F "desired_position=Senior Developer" \
  -F "years_experience=5" \
  -F "availability_days=7" \
  -F "expected_pay=60000" \
  -F "portfolio_url=https://my-portfolio.com" \
  -F "linkedin_url=https://linkedin.com/in/myprofile"
```

### For Business Accounts

#### Search Workers by Skills & Location
```bash
# Search by skills in Kathmandu
curl "http://localhost:5000/api/worker-profiles/search/profiles?title=developer&skills=react&location_name=Kathmandu&min_rating=4"

# Search by location and distance
curl "http://localhost:5000/api/worker-profiles/search/profiles?latitude=27.7172&longitude=85.3240&radius=10&min_experience=3"

# Search by availability
curl "http://localhost:5000/api/worker-profiles/search/profiles?availability_status=available&is_verified=true"

# Combined search with pagination
curl "http://localhost:5000/api/worker-profiles/search/profiles?title=designer&skills=figma&skills=ui&min_rating=4&page=1&limit=20"
```

#### View Worker Profile
```bash
curl http://localhost:5000/api/worker-profiles/1
```

---

## 📁 File Locations

### New Files Created:
- `/backend/src/controllers/workerProfile.controller.js` - Worker profile business logic
- `/backend/src/routes/workerProfile.routes.js` - Worker profile API routes
- `/backend/API_DOCUMENTATION.md` - Comprehensive API documentation

### Modified Files:
- `/backend/src/models/WorkerProfile.js` - New model created
- `/backend/src/models/JobResponse.js` - Enhanced with new fields
- `/backend/src/database/relation.js` - Added WorkerProfile relationships
- `/backend/src/controllers/job.controller.js` - Enhanced apply() method
- `/backend/src/routes/job.routes.js` - Added multer for resume upload
- `/backend/src/app.js` - Registered worker profile routes

### Upload Directories:
- `/backend/uploads/worker-profiles/` - Worker profile photos
- `/backend/uploads/resumes/` - Job application resumes
- Both created automatically on first upload

---

## 🔍 Search Features

### Search Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `title` | string | Filter by profession | "developer" |
| `skills` | string/array | Filter by skill name | "react" or ["react", "node"] |
| `location_name` | string | Filter by city/location | "Kathmandu" |
| `latitude` | number | Center latitude for distance | 27.7172 |
| `longitude` | number | Center longitude for distance | 85.3240 |
| `radius` | number | Search radius in km | 15 |
| `min_rating` | number | Minimum average rating | 4 |
| `is_verified` | boolean | Only verified workers | true |
| `availability_status` | string | Filter by status | "available" |
| `min_experience` | number | Minimum years | 5 |
| `max_hourly_rate` | number | Maximum hourly rate | 100 |
| `page` | number | Page number | 1 |
| `limit` | number | Results per page | 20 |

---

## 📊 Data Models

### WorkerProfile Fields:
- **Basic Info**: title, bio, phone, hourly_rate, profile_photo
- **Location**: location_name, latitude, longitude, service_radius
- **Skills**: skills (JSON array with name, proficiency)
- **Availability**: is_available (boolean), availability_status (enum)
- **Ratings**: average_rating (0-5), total_reviews
- **Portfolio**: portfolio_links (array), certifications (array), years_of_experience
- **Verification**: is_verified (boolean)
- **Categories**: categories (array for filtering)

### JobResponse Fields:
- **Application**: cover_letter, resume_url, status
- **Applicant Info**: desired_position, years_experience, availability_days, expected_pay
- **Social**: portfolio_url, linkedin_url
- **Status**: pending, accepted, rejected, shortlisted
- **Admin**: rejection_reason

---

## 🔒 Authentication & Authorization

- **Public endpoints**: `/api/worker-profiles/search/profiles`, `/api/worker-profiles/:id`, `/api/jobs/:id/apply`
- **Protected endpoints**: All POST/PUT/DELETE require Bearer token
- **Ownership verification**: Users can only modify their own profiles

---

## 📝 Next Steps (Frontend)

1. **Worker Profile Pages**:
   - Create/edit profile form with skills management
   - Profile photo upload component
   - Location picker (with map integration)
   - Availability status selector

2. **Worker Discovery Pages**:
   - Search/filter interface for business accounts
   - Worker profile cards with ratings
   - Map view of workers (if coordinates provided)
   - Saved searches/favorites

3. **Job Application Pages**:
   - Enhanced application form with resume upload
   - Applicant info fields (experience, availability, salary)
   - Portfolio and LinkedIn URL inputs

4. **Business Dashboard Enhancements**:
   - Applicant management table
   - Filter applications by status
   - View/download resumes
   - Communication interface

---

## ⚙️ Configuration

### Upload Settings (in routes):
- **Resume**: PDF, DOC, DOCX | Max 5MB
- **Photos**: JPG, PNG | Max 5MB

### Search Settings (in controller):
- **Default page limit**: 20 results
- **Default service radius**: 10 km
- **Distance calculation**: Haversine formula

---

## 🐛 Troubleshooting

### Resume Upload Failed
- Check file type (must be PDF, DOC, or DOCX)
- Check file size (must be ≤ 5MB)
- Ensure `/uploads/resumes/` directory exists

### Search Returns No Results
- Verify worker profiles have `is_available: true`
- Check skill names match exactly (case-sensitive)
- For location search, ensure latitude/longitude are valid

### Profile Photo Not Updating
- Check file type (must be JPG or PNG)
- Check file size (must be ≤ 5MB)
- Ensure user authentication token is valid

---

## 📞 API Support

For detailed endpoint documentation, see `/backend/API_DOCUMENTATION.md`

All endpoints return consistent response format:
```json
{
  "success": true/false,
  "data": {},
  "message": "Description",
  "error": "Error details (if applicable)"
}
```
