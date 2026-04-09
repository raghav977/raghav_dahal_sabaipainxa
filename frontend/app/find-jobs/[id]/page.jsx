"use client"
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import HeaderNavbar from "@/app/landingpagecomponents/components/HeaderNavbar";
import { AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001";

function parseJWT(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Failed to parse JWT', e);
    return null;
  }
}

function getTokenFromLocalStorage(key = 'token') {
  try {
    return typeof window !== 'undefined' ? localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

export default function JobDetail({params}){
    const {id} = params;
    const router = useRouter();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [applyForm, setApplyForm] = useState({ user_id: null, cover_letter: '' });
    const [applying, setApplying] = useState(false);
    const [applyMsg, setApplyMsg] = useState(null);
    const [applyMsgType, setApplyMsgType] = useState(null);

    useEffect(() => {
      const token = getTokenFromLocalStorage('token');
      if (token) {
        const decoded = parseJWT(token);
        if (decoded?.id) {
          setUserId(decoded.id);
          setIsAuthenticated(true);
          setApplyForm(prev => ({ ...prev, user_id: decoded.id }));
        }
      }
      fetchJob();
    }, [id]);

    const fetchJob = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/jobs/${id}`);
        if (!res.ok) throw new Error('Failed to load job');
        const body = await res.json();
        setJob(body.data || body);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally { setLoading(false); }
    }

    const doApply = async () => {
      if (!userId) {
        setApplyMsg('Please log in to apply');
        setApplyMsgType('error');
        return;
      }
      if (!applyForm.cover_letter.trim()) {
        setApplyMsg('Please write a cover letter');
        setApplyMsgType('error');
        return;
      }

      setApplying(true); 
      setApplyMsg(null);
      try {
        const res = await fetch(`${BASE_URL}/api/jobs/${id}/apply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(applyForm)
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body?.message || 'Failed to apply');
        setApplyMsg('✓ Application submitted successfully!');
        setApplyMsgType('success');
        setApplyForm({ user_id: userId, cover_letter: '' });
      } catch (err) {
        console.error(err);
        setApplyMsg('✗ ' + err.message);
        setApplyMsgType('error');
      } finally { setApplying(false); }
    }

    if (loading) return (
      <div>
        <HeaderNavbar/>
        <div className="mt-20 container mx-auto px-4 py-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
    
    if (error) return (
      <div>
        <HeaderNavbar/>
        <div className="mt-20 container mx-auto px-4 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
            <AlertCircle className="h-6 w-6 mb-2 inline" />
            <p className="font-semibold">{error}</p>
          </div>
        </div>
      </div>
    );
    
    if (!job) return (
      <div>
        <HeaderNavbar/>
        <div className="mt-20 container mx-auto px-4 py-12">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-yellow-700">
            <p className="font-semibold">Job not found</p>
          </div>
        </div>
      </div>
    );

    return (
      <div>
        <HeaderNavbar/>
        <main className="mt-16 container mx-auto px-4 py-8 max-w-4xl">
          {/* Job Details Card */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="mb-6">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 ${
                job.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {job.status === 'open' ? '✓ Open to Applications' : 'Closed'}
              </span>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{job.title}</h1>
              <p className="text-gray-600 text-lg">{job.department || 'General'}</p>
              <p className="text-gray-500 text-sm mt-1">Posted on {new Date(job.createdAt).toLocaleDateString()}</p>
            </div>

            {/* Key Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 pb-8 border-b border-gray-200">
              <div>
                <p className="text-gray-600 text-sm font-semibold mb-1">Salary Range</p>
                <p className="text-2xl font-bold text-gray-900">
                  {job.salary_min && job.salary_max
                    ? `₹${job.salary_min.toLocaleString()} - ₹${job.salary_max.toLocaleString()}`
                    : job.salary_min 
                    ? `₹${job.salary_min.toLocaleString()}+`
                    : job.salary_max
                    ? `Up to ₹${job.salary_max.toLocaleString()}`
                    : 'Not specified'}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm font-semibold mb-1">Employment Type</p>
                <p className="text-lg font-semibold text-gray-900">{job.work_type || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm font-semibold mb-1">Pay Type</p>
                <p className="text-lg font-semibold text-gray-900">{job.pay_type || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm font-semibold mb-1">Application Deadline</p>
                <p className="text-lg font-semibold text-gray-900">
                  {job.application_deadline 
                    ? new Date(job.application_deadline).toLocaleDateString()
                    : 'No deadline'}
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">About the Role</h3>
              <p className="text-gray-700 whitespace-pre-line leading-relaxed">{job.description || 'No description provided'}</p>
            </div>

            {/* Requirements */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Requirements</h3>
              <p className="text-gray-700 whitespace-pre-line leading-relaxed">{job.requirements || 'None specified'}</p>
            </div>

            {/* Benefits */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Benefits</h3>
              <p className="text-gray-700 whitespace-pre-line leading-relaxed">{job.benefits || 'None specified'}</p>
            </div>

            {/* Contact Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h4 className="font-bold text-gray-900 mb-3">Contact Information</h4>
              <div className="space-y-2">
                <p className="text-gray-700"><strong>Email:</strong> {job.contact_email || 'Not provided'}</p>
                <p className="text-gray-700"><strong>Phone:</strong> {job.contact_phone || 'Not provided'}</p>
                {job.application_link && (
                  <a href={job.application_link} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                    Apply via external link →
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Application Card */}
          <div className="bg-white rounded-lg shadow-lg p-8 sticky top-20">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Submit Your Application</h3>
            
            {!isAuthenticated && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-yellow-800 font-semibold">You need to log in to apply</p>
                  <button 
                    onClick={() => router.push('/auth/login')}
                    className="text-yellow-700 hover:underline text-sm mt-1"
                  >
                    Go to login →
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Your Application</label>
                <textarea 
                  value={applyForm.cover_letter} 
                  onChange={(e) => setApplyForm({...applyForm, cover_letter: e.target.value})}
                  placeholder="Write your cover letter here. Tell us why you're interested in this position and what makes you a great fit for the role..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  rows={6}
                  disabled={!isAuthenticated}
                />
              </div>

              {applyMsg && (
                <div className={`flex items-start gap-3 p-4 rounded-lg ${
                  applyMsgType === 'success' 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  {applyMsgType === 'success' ? (
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <p className={applyMsgType === 'success' ? 'text-green-800' : 'text-red-800'}>
                    {applyMsg}
                  </p>
                </div>
              )}

              <button 
                onClick={doApply} 
                disabled={applying || !isAuthenticated}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition ${
                  isAuthenticated
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {applying ? 'Submitting Application...' : 'Submit Application'}
              </button>
            </div>
          </div>
        </main>
      </div>
    )
}