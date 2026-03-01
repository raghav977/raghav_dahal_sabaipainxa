"use client"
import { useState } from "react";

export default function CV() {
  const [form, setForm] = useState({
    name: "",
    title: "",
    phone: "",
    email: "",
    address: "",
    summary: "",
    education: [
      { degree: "", institution: "", year: "" }
    ],
    experience: [
      { position: "", company: "", duration: "", description: "" }
    ],
    skills: [
      { name: "", level: 3 }
    ]
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // EDUCATION
  const handleEducationChange = (index, e) => {
    const updated = [...form.education];
    updated[index][e.target.name] = e.target.value;
    setForm({ ...form, education: updated });
  };

  const addEducation = () => {
    setForm({
      ...form,
      education: [...form.education, { degree: "", institution: "", year: "" }]
    });
  };

  // EXPERIENCE
  const handleExperienceChange = (index, e) => {
    const updated = [...form.experience];
    updated[index][e.target.name] = e.target.value;
    setForm({ ...form, experience: updated });
  };

  const addExperience = () => {
    setForm({
      ...form,
      experience: [
        ...form.experience,
        { position: "", company: "", duration: "", description: "" }
      ]
    });
  };

  // SKILLS
  const handleSkillChange = (index, e) => {
    const updated = [...form.skills];
    updated[index][e.target.name] = e.target.value;
    setForm({ ...form, skills: updated });
  };

  const addSkill = () => {
    setForm({
      ...form,
      skills: [...form.skills, { name: "", level: 3 }]
    });
  };

  const renderStars = (level) => {
    return "★".repeat(level) + "☆".repeat(5 - level);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex flex-col lg:flex-row gap-6">

      {/* ================= FORM ================= */}
      <div className="bg-white p-6 rounded-2xl shadow w-full lg:w-1/2 overflow-y-auto max-h-screen">
        <h2 className="text-lg font-semibold mb-4">Professional CV Builder</h2>

        <input className="input" placeholder="Full Name" name="name" onChange={handleChange} />
        <input className="input mt-2" placeholder="Professional Title" name="title" onChange={handleChange} />
        <input className="input mt-2" placeholder="Phone" name="phone" onChange={handleChange} />
        <input className="input mt-2" placeholder="Email" name="email" onChange={handleChange} />
        <input className="input mt-2" placeholder="Address" name="address" onChange={handleChange} />
        <textarea className="input mt-2" placeholder="Professional Summary" name="summary" onChange={handleChange} />

        {/* EDUCATION */}
        <h3 className="mt-4 font-semibold">Education</h3>
        {form.education.map((edu, index) => (
          <div key={index} className="border p-3 mt-2 rounded">
            <input className="input" placeholder="Degree" name="degree" onChange={(e) => handleEducationChange(index, e)} />
            <input className="input mt-2" placeholder="Institution" name="institution" onChange={(e) => handleEducationChange(index, e)} />
            <input className="input mt-2" placeholder="Year" name="year" onChange={(e) => handleEducationChange(index, e)} />
          </div>
        ))}
        <button onClick={addEducation} className="btn mt-2">+ Add Education</button>

        {/* EXPERIENCE */}
        <h3 className="mt-4 font-semibold">Experience</h3>
        {form.experience.map((exp, index) => (
          <div key={index} className="border p-3 mt-2 rounded">
            <input className="input" placeholder="Position" name="position" onChange={(e) => handleExperienceChange(index, e)} />
            <input className="input mt-2" placeholder="Company" name="company" onChange={(e) => handleExperienceChange(index, e)} />
            <input className="input mt-2" placeholder="Duration" name="duration" onChange={(e) => handleExperienceChange(index, e)} />
            <textarea className="input mt-2" placeholder="Description" name="description" onChange={(e) => handleExperienceChange(index, e)} />
          </div>
        ))}
        <button onClick={addExperience} className="btn mt-2">+ Add Experience</button>

        {/* SKILLS */}
        <h3 className="mt-4 font-semibold">Skills</h3>
        {form.skills.map((skill, index) => (
          <div key={index} className="border p-3 mt-2 rounded">
            <input className="input" placeholder="Skill Name" name="name" onChange={(e) => handleSkillChange(index, e)} />
            <select className="input mt-2" name="level" onChange={(e) => handleSkillChange(index, e)}>
              <option value="1">1 Star</option>
              <option value="2">2 Stars</option>
              <option value="3">3 Stars</option>
              <option value="4">4 Stars</option>
              <option value="5">5 Stars</option>
            </select>
          </div>
        ))}
        <button onClick={addSkill} className="btn mt-2">+ Add Skill</button>
      </div>

      {/* ================= PREVIEW ================= */}
      <div className="bg-white p-10 rounded-2xl shadow w-full lg:w-1/2">
        <h1 className="text-3xl font-bold">{form.name}</h1>
        <p className="text-gray-600">{form.title}</p>
        <p className="mt-2 text-sm">{form.phone} | {form.email} | {form.address}</p>

        <hr className="my-6" />

        {form.summary && (
          <>
            <h2 className="section-title">Professional Summary</h2>
            <p className="mb-4">{form.summary}</p>
          </>
        )}

        <h2 className="section-title">Education</h2>
        {form.education.map((edu, index) => (
          <div key={index} className="mb-3">
            <p className="font-semibold">{edu.degree}</p>
            <p>{edu.institution} | {edu.year}</p>
          </div>
        ))}

        <h2 className="section-title mt-4">Experience</h2>
        {form.experience.map((exp, index) => (
          <div key={index} className="mb-3">
            <p className="font-semibold">{exp.position}</p>
            <p>{exp.company} | {exp.duration}</p>
            <p className="text-sm">{exp.description}</p>
          </div>
        ))}

        <h2 className="section-title mt-4">Skills</h2>
        {form.skills.map((skill, index) => (
          <p key={index}>
            {skill.name} — {renderStars(Number(skill.level))}
          </p>
        ))}
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 6px;
          outline: none;
        }
        .input:focus {
          border-color: black;
        }
        .btn {
          background: black;
          color: white;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 14px;
        }
        .section-title {
          font-weight: 600;
          margin-bottom: 6px;
        }
      `}</style>
    </div>
  );
}