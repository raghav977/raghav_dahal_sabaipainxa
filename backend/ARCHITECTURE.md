# System Architecture: Worker Profile & Job Response

## 🏗️ System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  │  Worker Profile  │  │  Job Application │  │  Worker Search   │
│  │     Creation     │  │   with Resume    │  │    & Discovery   │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘
└───────────┼──────────────────────┼──────────────────────┼────────┘
            │                      │                      │
            ▼                      ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EXPRESS.JS BACKEND                         │
├─────────────────────────────────────────────────────────────────┤
│ ROUTES                                                          │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │  /api/worker-profiles/*      - Worker profile endpoints   │  │
│ │  /api/jobs/:id/apply         - Enhanced job application   │  │
│ └────────────────────────────────────────────────────────────┘  │
│                           │                                      │
│ MIDDLEWARE              │                                      │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │  Authentication Middleware    - Bearer token verification │  │
│ │  Multer File Upload           - Resume & photo handling   │  │
│ │  File Validation              - Type & size checks        │  │
│ └────────────────────────────────────────────────────────────┘  │
│                           │                                      │
│ CONTROLLERS             │                                      │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │  workerProfile.controller.js                              │  │
│ │    ├─ createOrUpdateProfile()                             │  │
│ │    ├─ searchProfiles()           [Multiple Filters]       │  │
│ │    ├─ uploadProfilePhoto()                                │  │
│ │    ├─ updateAvailability()                                │  │
│ │    ├─ addSkill() / removeSkill()                          │  │
│ │    └─ getProfile()                                        │  │
│ │                                                            │  │
│ │  job.controller.js                                        │  │
│ │    └─ apply()  [Enhanced with resume + fields]            │  │
│ └────────────────────────────────────────────────────────────┘  │
│                           │                                      │
│ MODELS                  │                                      │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │  WorkerProfile Model                                       │  │
│ │    ├─ Skills (JSON)                                       │  │
│ │    ├─ Location (lat, lng, radius)                         │  │
│ │    ├─ Portfolio Links (JSON)                              │  │
│ │    ├─ Certifications (JSON)                               │  │
│ │    ├─ Ratings                                             │  │
│ │    └─ Availability Status                                 │  │
│ │                                                            │  │
│ │  JobResponse Model [ENHANCED]                             │  │
│ │    ├─ Resume URL                                          │  │
│ │    ├─ Applicant Fields                                    │  │
│ │    ├─ Portfolio + LinkedIn URLs                           │  │
│ │    └─ Enhanced Status Tracking                            │  │
│ └────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
            │                      │                      │
            ▼                      ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FILE SYSTEM                                │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ /uploads/worker-profiles/     - Profile photos           │ │
│  │ /uploads/resumes/              - Job application resumes  │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
            │                      │
            └──────────┬───────────┘
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MYSQL DATABASE                               │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Users Table                                                │ │
│  │   ├─ id, name, email, phone, is_verified                 │ │
│  │   └─ [1:1] → WorkerProfile                               │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ WorkerProfiles Table                                       │ │
│  │   ├─ user_id (unique FK)                                 │ │
│  │   ├─ Profile: title, bio, phone, hourly_rate             │ │
│  │   ├─ Location: latitude, longitude, location_name        │ │
│  │   ├─ Skills: JSON array                                  │ │
│  │   ├─ Availability: is_available, availability_status     │ │
│  │   ├─ Ratings: average_rating, total_reviews              │ │
│  │   ├─ Portfolio: portfolio_links, certifications          │ │
│  │   ├─ Index: user_id (unique)                             │ │
│  │   ├─ Index: is_available                                 │ │
│  │   ├─ Index: availability_status                          │ │
│  │   └─ Index: is_verified                                  │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Jobs Table                                                 │ │
│  │   ├─ id, title, description                              │ │
│  │   └─ [1:M] → JobResponses                                │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ JobResponses Table [ENHANCED]                             │ │
│  │   ├─ id, job_id (FK), user_id (FK)                       │ │
│  │   ├─ Application: cover_letter, resume_url               │ │
│  │   ├─ Applicant: desired_position, years_experience       │ │
│  │   ├─ Details: availability_days, expected_pay             │ │
│  │   ├─ Social: portfolio_url, linkedin_url                 │ │
│  │   ├─ Status: pending/accepted/rejected/shortlisted       │ │
│  │   ├─ Admin: rejection_reason                             │ │
│  │   ├─ Unique: (job_id, user_id)                           │ │
│  │   ├─ Index: (job_id, status)                             │ │
│  │   └─ Index: user_id                                      │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Flow Diagrams

### Worker Profile Creation Flow
```
┌─────────┐
│ Worker  │
└────┬────┘
     │ POST /api/worker-profiles/
     │ {title, skills, location, ...}
     ▼
┌──────────────────────────┐
│ Authentication Check     │
│ (Bearer Token)           │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Controller:              │
│ createOrUpdateProfile()  │
└────────┬─────────────────┘
         │
         ├─→ [Check: Profile Exists?]
         │     └─→ Yes: Update
         │     └─→ No: Create New
         │
         ▼
┌──────────────────────────┐
│ Save to Database         │
│ WorkerProfile Table      │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Response: 201 Created    │
│ (Full profile object)    │
└──────────────────────────┘
```

### Worker Search Flow
```
┌──────────┐
│ Business │
└────┬─────┘
     │ GET /api/worker-profiles/search/profiles?
     │     skills=react&location=Kathmandu&radius=10
     ▼
┌──────────────────────────┐
│ Parse Query Parameters   │
│ (No auth required)       │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ searchProfiles()         │
│ Build WHERE Clause       │
│ - Skills filter          │
│ - Location filter        │
│ - Availability filter    │
│ - Rating filter          │
│ - Verification filter    │
└────────┬─────────────────┘
         │
         ├─→ [Coordinates Provided?]
         │     ├─→ Yes: Calculate Distance
         │     │       (Haversine formula)
         │     │       Filter by radius
         │     └─→ No: Use location_name
         │
         ▼
┌──────────────────────────┐
│ Database Query           │
│ SELECT * FROM            │
│ WorkerProfiles WHERE ... │
│ ORDER BY rating DESC     │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Apply Pagination         │
│ LIMIT, OFFSET            │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Response: 200 OK         │
│ [{worker1}, {worker2}...]│
│ with pagination info     │
└──────────────────────────┘
```

### Job Application Flow (with Resume)
```
┌──────────┐
│ Applicant│
└────┬─────┘
     │ POST /api/jobs/123/apply
     │ [FormData]
     │ ├─ user_id
     │ ├─ resume (PDF file)
     │ ├─ cover_letter
     │ ├─ years_experience
     │ ├─ expected_pay
     │ └─ portfolio_url
     ▼
┌──────────────────────────┐
│ Multer Middleware        │
│ Validate File            │
│ ├─ Type: PDF/DOC/DOCX    │
│ ├─ Size: <5MB            │
│ └─ Status: OK            │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ job.controller.apply()   │
│ ├─ Check job exists      │
│ ├─ Check duplicate app   │
│ └─ If resume:            │
│    ├─ Save to disk       │
│    └─ Generate URL       │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Save to Database         │
│ JobResponse Table        │
│ ├─ resume_url            │
│ ├─ years_experience      │
│ ├─ expected_pay          │
│ ├─ portfolio_url         │
│ └─ status: pending       │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Response: 201 Created    │
│ {id, job_id, resume_url, │
│  desired_position, ...}  │
└──────────────────────────┘
```

---

## 🔄 Database Relationships

```
┌──────────────────┐
│     Users        │
│   (Accounts)     │
│                  │
│  id (PK)         │
│  name            │
│  email           │
│  is_verified     │
└────────┬─────────┘
         │
         │ 1:1
         │
         ▼
┌──────────────────────────────┐         ┌──────────────────┐
│    WorkerProfiles            │         │  BusinessAccount │
│ (Searchable Worker Profiles) │         │  (Job Posters)   │
│                              │         │                  │
│  id (PK)                     │         │  id (PK)         │
│  user_id (FK, Unique)────────┼────────→│  user_id (FK)    │
│  title                       │         │  company_name    │
│  skills (JSON)               │         │  is_active       │
│  latitude, longitude         │         └──────────────────┘
│  availability_status         │
│  average_rating              │
│  certifications (JSON)       │
│  portfolio_links (JSON)      │
└──────────────────────────────┘


┌──────────────────┐           ┌─────────────────────────────┐
│      Jobs        │ 1:M       │    JobResponses             │
│  (Job Postings)  │──────────→│  (Job Applications)         │
│                  │           │                             │
│  id (PK)         │           │  id (PK)                    │
│  title           │           │  job_id (FK)────────┐       │
│  description     │           │  user_id (FK)       │       │
│  created_by      │           │  resume_url         │       │
│  status          │           │  cover_letter       │       │
└──────────────────┘           │  desired_position   │       │
                               │  years_experience   │       │
                               │  expected_pay       │       │
                               │  availability_days  │       │
                               │  portfolio_url      │       │
                               │  linkedin_url       │       │
                               │  status             │       │
                               │  Unique(job_id,     │       │
                               │         user_id)    │       │
                               └─────────────────────┘
```

---

## 🔐 Security Architecture

```
┌───────────────────────────────────────────────────────────┐
│                   AUTHENTICATION LAYER                    │
├───────────────────────────────────────────────────────────┤
│ • Bearer Token Verification                              │
│ • JWT Validation                                         │
│ • User ID Extraction from Token                          │
└───────────────────────────┬───────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ Public Endpoints │ │ Auth Required    │ │ Ownership Check  │
│                  │ │                  │ │                  │
│ GET /search      │ │ POST / (create)  │ │ PUT (update own) │
│ GET /:id         │ │ GET /my-profile  │ │ DELETE (own)     │
│ POST /apply      │ │ POST /upload     │ │ POST /skills     │
│                  │ │ PUT /availability│ │ DELETE /skills   │
└──────────────────┘ └──────────────────┘ └──────────────────┘


┌───────────────────────────────────────────────────────────┐
│                    FILE UPLOAD LAYER                      │
├───────────────────────────────────────────────────────────┤
│ • MIME Type Validation (JPG/PNG for photos, PDF/DOC)     │
│ • File Size Limits (5MB max)                             │
│ • Secure Filename Generation (timestamp + random)        │
│ • Path Security (no traversal attacks)                   │
│ • Disk Storage (not base64 in database)                  │
└───────────────────────────────────────────────────────────┘


┌───────────────────────────────────────────────────────────┐
│                   DATABASE LAYER                          │
├───────────────────────────────────────────────────────────┤
│ • Foreign Key Constraints                                │
│ • Unique Constraints (worker profiles, applications)     │
│ • Indexes on Search Fields                               │
│ • Prepared Statements (Sequelize ORM)                   │
│ • SQL Injection Prevention                               │
└───────────────────────────────────────────────────────────┘
```

---

## 📈 Search Performance Optimization

```
┌─────────────────────────────────────────────────────────┐
│          SEARCH QUERY OPTIMIZATION STRATEGY              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ 1. DATABASE INDEXES:                                   │
│    ├─ Index on is_available (boolean)                  │
│    ├─ Index on availability_status (enum)              │
│    ├─ Index on is_verified (boolean)                   │
│    └─ Composite index planned: (is_available, status)  │
│                                                          │
│ 2. QUERY FILTERING:                                    │
│    ├─ WHERE is_available = true                        │
│    ├─ WHERE availability_status IN (...)               │
│    ├─ WHERE average_rating >= min_rating               │
│    └─ WHERE years_of_experience >= min_experience      │
│                                                          │
│ 3. JSON FILTERING:                                     │
│    ├─ Application-level skill filtering                │
│    ├─ Future: Native MySQL JSON operators              │
│    └─ Future: Full-text search on skills               │
│                                                          │
│ 4. GEOLOCATION SEARCH:                                 │
│    ├─ Current: Haversine formula (client-side)         │
│    ├─ Future: PostGIS spatial indexes                  │
│    └─ Distance calculation after retrieval             │
│                                                          │
│ 5. PAGINATION:                                         │
│    ├─ Default limit: 20 results per page               │
│    ├─ OFFSET-based pagination                         │
│    ├─ Max results: prevent huge result sets            │
│    └─ Cursor-based: consider for large datasets        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🌐 API Integration Points

```
FRONTEND                  BACKEND                    DATABASE
   │                        │                           │
   ├─ Create Profile ──────→ POST /worker-profiles  ──→ INSERT
   │                        │                           │
   ├─ Upload Photo ────────→ POST /upload-photo    ──→ UPDATE
   │                        │                           │
   ├─ Search Workers ──────→ GET /search/profiles  ──→ SELECT
   │                        │    (Multiple Filters)     │
   │                        │    (Distance Calc)        │
   │                        │    (Sort by Rating)       │
   │                        │    (Paginate)             │
   │                        │                           │
   ├─ View Profile ────────→ GET /:worker_id      ──→ SELECT
   │                        │                           │
   ├─ Apply to Job ────────→ POST /jobs/apply     ──→ INSERT
   │  (with Resume)         │    (File Upload)          │
   │                        │    (7 Fields)             │
   │                        │                           │
   └─ Update Status ──────→ PUT /availability     ──→ UPDATE
                            │                           │
```

---

## 📊 Database Query Examples

### Create Profile
```sql
INSERT INTO WorkerProfiles (user_id, title, skills, latitude, longitude, ...)
VALUES (5, 'Developer', JSON_ARRAY(...), 27.7172, 85.3240, ...)
```

### Search by Skills
```sql
SELECT * FROM WorkerProfiles 
WHERE is_available = true
  AND JSON_CONTAINS(skills, JSON_ARRAY('React'))
ORDER BY average_rating DESC
LIMIT 20 OFFSET 0
```

### Search by Location
```sql
SELECT * FROM WorkerProfiles 
WHERE is_available = true
  AND location_name LIKE '%Kathmandu%'
ORDER BY average_rating DESC
LIMIT 20
```

### Apply to Job
```sql
INSERT INTO JobResponses 
(job_id, user_id, resume_url, desired_position, years_experience, expected_pay, status)
VALUES (123, 5, '/uploads/resumes/...', 'Senior Dev', 5, 60000, 'pending')
```

---

## 🚀 Scalability Considerations

```
Current Architecture:
├─ Single MySQL database
├─ Application-level distance calculation
├─ JSON array filtering
└─ Works well for <100K profiles

Future Upgrades:
├─ PostGIS for geospatial queries
├─ Elasticsearch for full-text search
├─ Redis for caching popular profiles
├─ Database replication for read scaling
├─ Microservices for search service
└─ CDN for file serving
```

---

**Architecture Status**: ✅ Production Ready
**Last Updated**: January 2025
