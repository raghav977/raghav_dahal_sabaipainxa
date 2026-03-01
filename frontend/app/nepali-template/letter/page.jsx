"use client"
import { useState } from "react";

export default function LetterPage() {
  const [form, setForm] = useState({
    senderAddress: "",
    date: "",
    receiverName: "",
    receiverOffice: "",
    subject: "",
    purpose: "जानकारी",
    mainContent: "",
    closingType: "भवदीय",
    senderName: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Smart Intro Generator
  const generateIntro = () => {
    switch (form.purpose) {
      case "जानकारी":
        return "सविनय निवेदन छ कि";
      case "अनुरोध":
        return "विनम्र अनुरोध छ कि";
      case "स्पष्टीकरण":
        return "यस पत्रमार्फत जानकारी गराउन चाहन्छु कि";
      case "धन्यवाद":
        return "हजुरको सहयोगप्रति हार्दिक धन्यवाद व्यक्त गर्दै";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex flex-col lg:flex-row gap-6">

      {/* FORM SECTION */}
      <div className="bg-white p-6 rounded-2xl shadow w-full lg:w-1/2">
        <h2 className="text-lg font-semibold mb-4">Letter Generator</h2>

        <textarea
          className="input"
          placeholder="पठाउनेको ठेगाना"
          name="senderAddress"
          onChange={handleChange}
        />

        <input
          type="date"
          className="input mt-3"
          name="date"
          onChange={handleChange}
        />

        <input
          className="input mt-3"
          placeholder="प्राप्तकर्ताको नाम/पद"
          name="receiverName"
          onChange={handleChange}
        />

        <input
          className="input mt-3"
          placeholder="कार्यालय नाम"
          name="receiverOffice"
          onChange={handleChange}
        />

        <input
          className="input mt-3"
          placeholder="विषय"
          name="subject"
          onChange={handleChange}
        />

        <select
          className="input mt-3"
          name="purpose"
          onChange={handleChange}
        >
          <option>जानकारी</option>
          <option>अनुरोध</option>
          <option>स्पष्टीकरण</option>
          <option>धन्यवाद</option>
        </select>

        <textarea
          className="input mt-3"
          placeholder="मुख्य विवरण लेख्नुहोस्"
          name="mainContent"
          rows={4}
          onChange={handleChange}
        />

        <select
          className="input mt-3"
          name="closingType"
          onChange={handleChange}
        >
          <option>भवदीय</option>
          <option>धन्यवाद सहित</option>
          <option>निवेदक</option>
        </select>

        <input
          className="input mt-3"
          placeholder="पठाउनेको नाम"
          name="senderName"
          onChange={handleChange}
        />
      </div>

      {/* PREVIEW SECTION */}
      <div className="bg-white p-10 rounded-2xl shadow w-full lg:w-1/2 print:shadow-none">
        
        {/* Sender Address */}
        <div className="text-left whitespace-pre-line">
          {form.senderAddress}
        </div>

        {/* Date */}
        <div className="text-right mt-2">
          मिति: {form.date}
        </div>

        {/* Receiver */}
        <div className="mt-6">
          <p>{form.receiverName}</p>
          <p>{form.receiverOffice}</p>
        </div>

        {/* Subject */}
        {form.subject && (
          <div className="mt-4">
            <strong>विषय:</strong> {form.subject}
          </div>
        )}

        {/* Salutation */}
        <div className="mt-6">
          <p>महोदय,</p>
        </div>

        {/* Body */}
        <div className="mt-3 leading-8 text-justify whitespace-pre-line">
          {generateIntro()} {form.mainContent}

          {"\n\n"}अत: आवश्यक कार्यवाही गरिदिनुहुन अनुरोध गर्दछु।
        </div>

        {/* Closing */}
        <div className="mt-10">
          <p>{form.closingType},</p>
          <p className="mt-6">{form.senderName}</p>
        </div>
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 8px;
          outline: none;
        }
        .input:focus {
          border-color: black;
        }
      `}</style>
    </div>
  );
}