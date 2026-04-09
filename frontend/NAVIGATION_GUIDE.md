# Frontend Navigation: Worker Profile & Job Search Integration

## Quick Links to Add to Your Navigation/Menu

### For All Users
```jsx
<Link href="/search-workers">
  🔍 Find Workers
</Link>
```

### For Worker/Service Provider Accounts
```jsx
<Link href="/worker-profile/create">
  👤 Create Profile
</Link>

<Link href="/worker-profile/view">
  👁️ View My Profile
</Link>
```

### For Business/Service Requester Accounts
```jsx
<Link href="/search-workers">
  🔍 Find Workers by Skills
</Link>
```

---

## Page URLs and Descriptions

### `/worker-profile/create`
**Purpose**: Create or edit worker profile
**For**: Workers/Service Providers
**Features**:
- Professional title and bio
- Skills management
- Location with GPS option
- Hourly rate
- Experience level
- Photo upload

### `/worker-profile/view`
**Purpose**: View own worker profile
**For**: Workers/Service Providers
**Features**:
- View profile display
- Upload/change photo
- Toggle availability
- View all information
- Edit link to creation page

### `/worker-profile/[id]`
**Purpose**: View any worker's public profile
**For**: Everyone (public)
**Features**:
- Professional presentation
- Skills and certifications
- Portfolio links
- Experience and ratings
- Location information

### `/search-workers`
**Purpose**: Search and discover workers
**For**: Everyone (especially businesses)
**Features**:
- Advanced search filters
- 9 different search options
- Results pagination
- Worker cards with info
- Click through to full profiles

---

## Integration Examples

### In Main Navigation/Header

```jsx
// components/Navigation.jsx
export default function Navigation() {
  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/">Logo</Link>
          </div>

          {/* Main Navigation */}
          <div className="flex items-center space-x-8">
            <Link href="/">Home</Link>
            <Link href="/find-jobs">Find Jobs</Link>
            <Link href="/search-workers">Find Workers</Link>
            
            {/* Worker Profile Links - Show if User is Worker */}
            {isWorker && (
              <>
                <Link href="/worker-profile/create">My Profile</Link>
              </>
            )}

            {/* User Menu */}
            <UserMenu />
          </div>
        </div>
      </div>
    </nav>
  );
}
```

### In User Dashboard

```jsx
// app/dashboard/page.jsx
export default function Dashboard() {
  const user = useUserContext();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Existing Dashboard Items */}

      {/* Worker Features */}
      {user.type === 'worker' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">👤 Worker Profile</h2>
          <p className="text-gray-600 mb-4">
            Build your professional profile to be discovered by businesses
          </p>
          <Link
            href="/worker-profile/view"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded"
          >
            View Profile
          </Link>
        </div>
      )}

      {/* Business Features */}
      {user.type === 'business' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">🔍 Search Workers</h2>
          <p className="text-gray-600 mb-4">
            Find skilled workers by skills, location, and experience
          </p>
          <Link
            href="/search-workers"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded"
          >
            Search Workers
          </Link>
        </div>
      )}
    </div>
  );
}
```

### In Job Detail Page

```jsx
// app/find-jobs/[id]/page.jsx
import JobApplicationForm from "@/components/JobApplicationForm";

export default function JobDetail({ params }) {
  // ... existing job detail code ...

  return (
    <div className="max-w-4xl mx-auto">
      {/* Job Information Section */}
      <div className="bg-white rounded-lg shadow p-8 mb-8">
        <h1 className="text-3xl font-bold mb-4">{job.title}</h1>
        <p className="text-gray-600 mb-4">{job.description}</p>
        {/* More job details */}
      </div>

      {/* Application Section */}
      <div className="bg-white rounded-lg shadow p-8">
        <h2 className="text-2xl font-bold mb-6">Apply for This Job</h2>
        <JobApplicationForm 
          jobId={params.id}
          onSuccess={() => {
            // Show success notification
            // Refresh applications list
          }}
        />
      </div>
    </div>
  );
}
```

### In Home Page Quick Actions

```jsx
// app/page.jsx
export default function Home() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}

      {/* Quick Action Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ActionCard
          icon="🏢"
          title="Post a Job"
          description="Looking for a skilled professional?"
          link="/business-account/post-job"
        />

        <ActionCard
          icon="🔍"
          title="Find Workers"
          description="Browse professionals by skills and location"
          link="/search-workers"
        />

        <ActionCard
          icon="👤"
          title="Create Profile"
          description="Build your professional profile"
          link="/worker-profile/create"
        />
      </section>
    </div>
  );
}

function ActionCard({ icon, title, description, link }) {
  return (
    <Link href={link}>
      <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
        <div className="text-4xl mb-3">{icon}</div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </Link>
  );
}
```

### In User Profile/Settings Menu

```jsx
// components/UserMenu.jsx
export default function UserMenu() {
  const [open, setOpen] = useState(false);
  const user = useUserContext();

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}>
        Menu
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg">
          <Link href="/dashboard" className="block px-4 py-2">
            Dashboard
          </Link>

          {user.isWorker && (
            <>
              <Link href="/worker-profile/view" className="block px-4 py-2">
                👤 My Profile
              </Link>
              <Link href="/worker-profile/create" className="block px-4 py-2">
                ✏️ Edit Profile
              </Link>
            </>
          )}

          {user.isBusiness && (
            <Link href="/search-workers" className="block px-4 py-2">
              🔍 Find Workers
            </Link>
          )}

          <Link href="/settings" className="block px-4 py-2">
            Settings
          </Link>
          <button onClick={logout} className="block w-full text-left px-4 py-2">
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## Recommended Menu Structure

### Desktop Navigation
```
Home | Find Jobs | Find Workers | Dashboard | Profile ▼
                                            ├── My Profile
                                            ├── Edit Profile
                                            ├── Settings
                                            └── Logout
```

### Mobile Navigation (Hamburger Menu)
```
☰ Menu
├── Home
├── Find Jobs
├── Find Workers
├── Dashboard
├── My Profile (if worker)
├── Settings
└── Logout
```

---

## Link Placement Checklist

- [ ] Add "/search-workers" to main navigation
- [ ] Add "/worker-profile/create" to worker menu items
- [ ] Add "/worker-profile/view" to worker profile section
- [ ] Update job detail page with JobApplicationForm component
- [ ] Add quick action cards on home page
- [ ] Update user dropdown menu with profile links
- [ ] Add worker profile link to dashboard
- [ ] Update business account section with worker search

---

## User Type Detection

Determine which links to show:

```javascript
// Helper function
function getUserLinks(user) {
  const links = [
    { label: "Home", href: "/" },
    { label: "Find Jobs", href: "/find-jobs" },
    { label: "Find Workers", href: "/search-workers" }, // Show to everyone
  ];

  if (user?.role === 'worker' || user?.isServiceProvider) {
    links.push(
      { label: "My Profile", href: "/worker-profile/view" },
      { label: "Edit Profile", href: "/worker-profile/create" }
    );
  }

  if (user?.role === 'business' || user?.isBusinessAccount) {
    links.push(
      { label: "Post Job", href: "/business-account/post-job" },
      { label: "My Applications", href: "/business-account/applications" }
    );
  }

  return links;
}
```

---

## Styling Guide

### Link Styling
```jsx
// Standard link styling
<Link className="text-gray-700 hover:text-blue-600 transition">
  Link Text
</Link>

// Button link styling
<Link className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
  Button Link
</Link>
```

### Active Link Styling (for navigation)
```jsx
// Using Next.js usePathname
import { usePathname } from 'next/navigation';

export default function NavLink({ href, label }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={isActive ? "text-blue-600 font-bold" : "text-gray-700"}
    >
      {label}
    </Link>
  );
}
```

---

## Success Indicators

Show these when worker profile is complete:
- ✅ "Profile Complete - 80%"
- 🎯 "Ready to be discovered by businesses"
- ⭐ "Start receiving applications"

---

## Call-to-Action Suggestions

For Workers:
> "Complete your profile to be discovered by thousands of businesses looking for your skills."

For Businesses:
> "Find vetted professionals with the exact skills you need for your project."

For Job Seekers:
> "Apply now with your resume, experience, and portfolio links in one click."

---

## Mobile Optimization

Ensure all pages are mobile-responsive:
- ✅ Touch-friendly buttons (min 44px)
- ✅ Single column layouts on mobile
- ✅ Large form inputs
- ✅ Stacked navigation menu
- ✅ Mobile-optimized cards

---

This guide covers all navigation integration points for the worker profile and job response system.
