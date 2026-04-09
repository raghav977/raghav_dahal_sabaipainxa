"use client"
import JobsList from "../dashboard/business-account/manage-jobs/JobsList";

export default function FindJobsSection(){
  return (
    <section className="max-w-5xl mx-auto py-8">
      <h2 className="text-2xl font-bold mb-4">Available Jobs</h2>
      <JobsList />
    </section>
  )
}
