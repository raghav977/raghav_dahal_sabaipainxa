# Quick Reference: Worker Profile & Job Response API

## 🔥 Most Used Endpoints

### Create Worker Profile
```bash
POST /api/worker-profiles/
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "title": "Web Developer",
  "bio": "5+ years experience",
  "phone": "9841234567",
  "hourly_rate": 25,
  "location_name": "Kathmandu",
  "latitude": 27.7172,
  "longitude": 85.3240,
  "skills": [{"name": "React", "proficiency": "expert"}],
  "years_of_experience": 5
}
```

### Search Workers by Skills
```bash
GET /api/worker-profiles/search/profiles?skills=react&skills=node&location_name=Kathmandu&min_rating=4
```

### Search Workers by Location (with Distance)
```bash
GET /api/worker-profiles/search/profiles?latitude=27.7172&longitude=85.3240&radius=15&availability_status=available
```

### Apply to Job with Resume
```bash
POST /api/jobs/123/apply
Content-Type: multipart/form-data

- user_id: 5
- cover_letter: "I'm interested in this role"
- resume: resume.pdf
- desired_position: "Senior Developer"
- years_experience: 5
- expected_pay: 60000
```

### Upload Profile Photo
```bash
POST /api/worker-profiles/1/upload-photo
Authorization: Bearer TOKEN
Content-Type: multipart/form-data

- profile_photo: photo.jpg
```

### Get Worker Profile
```bash
GET /api/worker-profiles/1
```

### Update Availability
```bash
PUT /api/worker-profiles/availability/update
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "is_available": true,
  "availability_status": "available"
}
```

### Add Skill
```bash
POST /api/worker-profiles/skills/add
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "skill_name": "TypeScript",
  "proficiency_level": "advanced"
}
```

---

## 📊 Search Filters Cheat Sheet

| Use Case | Query |
|----------|-------|
| Find React developers | `?title=developer&skills=react` |
| Find nearby workers (10km) | `?latitude=27.7&longitude=85.3&radius=10` |
| Find available workers | `?availability_status=available` |
| Find verified workers | `?is_verified=true` |
| Find by budget | `?max_hourly_rate=50` |
| Find experienced | `?min_experience=5` |
| Find highly rated | `?min_rating=4.5` |
| Combine filters | `?title=designer&skills=figma&location_name=Kathmandu&is_verified=true&page=1` |

---

## 📁 Upload File Types

| What | Allowed Types | Max Size |
|------|--------------|----------|
| Profile Photo | JPG, PNG | 5MB |
| Resume | PDF, DOC, DOCX | 5MB |

---

## 🔐 Authentication

All endpoints with 🔒 require authentication:

```bash
-H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📋 Response Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | GET, PUT, POST (non-creation) |
| 201 | Created | POST (new resource) |
| 400 | Bad Request | Missing required field |
| 401 | Unauthorized | No/invalid token |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Already applied to this job |
| 500 | Server Error | Database error |

---

## 💾 Worker Profile Schema

### Required Fields
- `title` - Job title/profession

### Location Fields
- `latitude`, `longitude` - GPS coordinates (for distance search)
- `location_name` - City name
- `service_radius` - Service area in km

### Skills Format
```json
[
  {
    "id": 1705332600000,
    "name": "React",
    "proficiency": "expert"
  }
]
```

### Certifications Format
```json
[
  {
    "name": "AWS Developer",
    "issuer": "Amazon",
    "date": "2023-01"
  }
]
```

---

## 💾 Job Response Schema

### Required Fields
- `user_id` - Applicant ID
- `job_id` - Job ID

### Optional Fields
- `cover_letter` - Application text
- `resume` - PDF/Word file upload
- `desired_position` - Position seeking
- `years_experience` - Experience count
- `availability_days` - Days to start
- `expected_pay` - Expected salary
- `portfolio_url` - Portfolio website
- `linkedin_url` - LinkedIn profile

### Status Values
- `pending` - Just applied
- `shortlisted` - Selected for interview
- `accepted` - Hired
- `rejected` - Not selected

---

## 🎯 Availability Status Options

| Status | Meaning |
|--------|---------|
| `available` | Ready for new work |
| `busy` | Currently working |
| `offline` | Not available |

---

## 🏆 Rating Scale

- `0` - No rating yet
- `1-2` - Below average
- `3` - Average
- `4` - Good
- `5` - Excellent

---

## 🚀 Common Use Cases

### As a Worker
1. Create profile: POST `/api/worker-profiles/`
2. Upload photo: POST `/api/worker-profiles/1/upload-photo`
3. Add skills: POST `/api/worker-profiles/skills/add` (multiple times)
4. Apply to job: POST `/api/jobs/123/apply` (with resume)
5. Update status: PUT `/api/worker-profiles/availability/update`

### As a Business
1. Search workers: GET `/api/worker-profiles/search/profiles?skills=react`
2. View profile: GET `/api/worker-profiles/1`
3. View applicants: GET `/api/jobs/123` (includes JobResponses)
4. Review resumes: Check `resume_url` in applicant data

---

## 🔍 Example: Search React Developers in Kathmandu

```bash
curl -G http://localhost:5000/api/worker-profiles/search/profiles \
  --data-urlencode "skills=React" \
  --data-urlencode "skills=Node.js" \
  --data-urlencode "location_name=Kathmandu" \
  --data-urlencode "min_rating=4" \
  --data-urlencode "is_verified=true" \
  --data-urlencode "page=1" \
  --data-urlencode "limit=20"
```

---

## 🔍 Example: Location-Based Search

```bash
curl -G http://localhost:5000/api/worker-profiles/search/profiles \
  --data-urlencode "latitude=27.7172" \
  --data-urlencode "longitude=85.3240" \
  --data-urlencode "radius=15" \
  --data-urlencode "title=designer" \
  --data-urlencode "availability_status=available"
```

---

## 📞 Frontend Integration Template

### React: Create Profile
```javascript
const createProfile = async (profileData) => {
  const response = await fetch('/api/worker-profiles/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(profileData)
  });
  return response.json();
};
```

### React: Search Workers
```javascript
const searchWorkers = async (filters) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach(v => params.append(key, v));
    } else {
      params.append(key, value);
    }
  });
  
  const response = await fetch(`/api/worker-profiles/search/profiles?${params}`);
  return response.json();
};
```

### React: Apply with Resume
```javascript
const applyToJob = async (jobId, formData, resumeFile) => {
  const form = new FormData();
  form.append('user_id', formData.userId);
  form.append('cover_letter', formData.coverLetter);
  form.append('desired_position', formData.desiredPosition);
  form.append('years_experience', formData.experience);
  form.append('availability_days', formData.availability);
  form.append('expected_pay', formData.expectedPay);
  form.append('portfolio_url', formData.portfolio);
  form.append('linkedin_url', formData.linkedin);
  
  if (resumeFile) {
    form.append('resume', resumeFile);
  }

  const response = await fetch(`/api/jobs/${jobId}/apply`, {
    method: 'POST',
    body: form
  });
  return response.json();
};
```

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| Resume upload fails | Check file type (PDF/DOC/DOCX) and size (<5MB) |
| Search returns nothing | Verify `is_available: true` and exact skill names |
| Photo not updating | Check file type (JPG/PNG) and size (<5MB) |
| Can't create profile | Verify authentication token is valid |
| Skills not adding | Check API response for error message |
| Duplicate application error | User already applied to this job (prevent reapply) |

---

## 📚 Full Documentation

See `/backend/API_DOCUMENTATION.md` for comprehensive API reference

---

## 🛠 Quick Debug

### Check Worker Profile
```bash
curl -H "Authorization: Bearer TOKEN" http://localhost:5000/api/worker-profiles/my-profile
```

### Check Job Responses
```bash
curl http://localhost:5000/api/jobs/123
```

### Search Logs
```bash
# Terminal where backend runs - errors appear here
```

---

**Last Updated**: January 2025
**Status**: ✅ Ready for Production
