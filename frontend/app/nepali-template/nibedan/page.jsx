"use client"

import { useState } from "react";

export default function NibedanPage() {
  const [form, setForm] = useState({
    office: "",
    address: "",
    purpose: "नागरिकता प्रतिलिपि",
    name: "",
    addressUser: "",
    citizenship: "",
    phone: "",
    date: "",
    reason: "",
    details: "",
    customPurpose: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 🎯 Subject Generator
  const generatedSubject =
    form.purpose === "अन्य"
      ? `${form.customPurpose} सम्बन्धमा`
      : `${form.purpose} सम्बन्धमा`;

  // 🧠 Smart Body Generator
  const generateBody = () => {
    switch (form.purpose) {
      case "नागरिकता प्रतिलिपि":
        return `
म विनम्रतापूर्वक निवेदन गर्दछु कि मेरो नागरिकता प्रमाणपत्र ${
          form.reason || "हराएको"
        } हुँदा हाल अत्यन्त आवश्यक कार्यमा समस्या परेको छ।
        
${form.details ? form.details : ""}

अत: आवश्यक प्रक्रिया पूरा गरी नागरिकता प्रतिलिपि उपलब्ध गराइदिनुहुन हार्दिक अनुरोध गर्दछु।
`;

      case "आर्थिक सहायता":
        return `
म आर्थिक रूपमा कमजोर अवस्थाको व्यक्ति हुँ।
${form.reason ? form.reason : ""}

${form.details ? form.details : ""}

अत: मलाई आर्थिक सहायता उपलब्ध गराइदिनुहुन हार्दिक अनुरोध गर्दछु।
`;

      case "सिफारिस":
        return `
${form.reason ? form.reason : ""}

${form.details ? form.details : ""}

अत: आवश्यक सिफारिस उपलब्ध गराइदिनुहुन हार्दिक अनुरोध गर्दछु।
`;

      case "अन्य":
        return `
${form.details}

अत: आवश्यक प्रक्रिया पूरा गरी ${form.customPurpose} गरिदिनुहुन हार्दिक अनुरोध गर्दछु।
`;

      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex flex-col lg:flex-row gap-6">
      
      {/* FORM */}
      <div className="bg-white p-6 rounded-2xl shadow w-full lg:w-1/2">
        <h2 className="text-lg font-semibold mb-4">Nibedan Generator</h2>

        <input className="input" placeholder="कार्यालय नाम" name="office" onChange={handleChange} />
        <input className="input mt-3" placeholder="कार्यालय ठेगाना" name="address" onChange={handleChange} />

        <select className="input mt-3" name="purpose" onChange={handleChange}>
          <option>नागरिकता प्रतिलिपि</option>
          <option>आर्थिक सहायता</option>
          <option>सिफारिस</option>
          <option>अन्य</option>
        </select>

        {form.purpose === "अन्य" && (
          <input
            className="input mt-3"
            placeholder="Custom Purpose Title"
            name="customPurpose"
            onChange={handleChange}
          />
        )}

        <textarea
          className="input mt-3"
          placeholder="कारण (जस्तै: बाढीका कारण हराएको, आगलागी भएको...)"
          name="reason"
          onChange={handleChange}
        />

        <textarea
          className="input mt-3"
          placeholder="थप विवरण (optional)"
          name="details"
          onChange={handleChange}
        />

        <input className="input mt-3" placeholder="निवेदक नाम" name="name" onChange={handleChange} />
        <input className="input mt-3" placeholder="ठेगाना" name="addressUser" onChange={handleChange} />
        <input className="input mt-3" placeholder="नागरिकता नं." name="citizenship" onChange={handleChange} />
        <input className="input mt-3" placeholder="सम्पर्क नं." name="phone" onChange={handleChange} />
        <input type="date" className="input mt-3" name="date" onChange={handleChange} />
      </div>

      {/* PREVIEW */}
      <div className="bg-white p-10 rounded-2xl shadow w-full lg:w-1/2">
        <h1 className="text-center text-xl font-semibold mb-6">निवेदन</h1>

        <p>श्रीमान् {form.office}</p>
        <p>{form.address}</p>

        <p className="mt-4">
          <strong>विषय:</strong> {generatedSubject}
        </p>

        <p className="mt-6">महोदय,</p>

        <p className="mt-3 leading-8 whitespace-pre-line text-justify">
          {generateBody()}
        </p>

        <p className="mt-4">धन्यवाद।</p>

        <div className="mt-10">
          <p>निवेदक: {form.name}</p>
          <p>ठेगाना: {form.addressUser}</p>
          <p>नागरिकता नं.: {form.citizenship}</p>
          <p>सम्पर्क नं.: {form.phone}</p>
          <p>मिति: {form.date}</p>
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