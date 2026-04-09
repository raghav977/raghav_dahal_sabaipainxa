import HeaderNavbar from "../landingpagecomponents/components/HeaderNavbar";
import JobsListing from "./JobsListing";

export default function FindJob() {
  return (
    <div>
      <HeaderNavbar/>
      <main className="py-12 mt-12 min-h-screen bg-gradient-to-br from-blue-50 to-white">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Find Jobs</h1>
            <p className="text-gray-600">Discover and apply to thousands of job opportunities</p>
          </div>
          <JobsListing />
        </div>
      </main>
    </div>
  )
}
