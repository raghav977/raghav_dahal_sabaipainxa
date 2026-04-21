"use client"
import React, { useState, useRef } from 'react';

export default function AdvancedQuestionPaperGenerator() {
  const [activeTab, setActiveTab] = useState('header');
  const [printColumn, setPrintColumn] = useState(1);
  const previewRef = useRef(null);

  const [header, setHeader] = useState({
    schoolName: 'Shree Janata Secondary School',
    location: 'Ramchok, Nepal',
    examTitle: 'Second Terminal Examination - 2082',
    subject: 'Computer Science',
    className: '10',
    time: '3 Hours',
    fullMarks: 75,
    passMarks: 30,
  });

  const [layout, setLayout] = useState({
    orientation: 'portrait',
    columns: 1,
    font: 'Times New Roman',
    fontSize: 14,
  });

  const [groups, setGroups] = useState([
    { name: 'Group A', weight: 1, questions: [] },
    { name: 'Group B', weight: 5, questions: [] },
    { name: 'Group C', weight: 10, questions: [] },
  ]);

  const addQuestion = (groupIndex) => {
    const updated = [...groups];
    updated[groupIndex].questions.push({
      text: '',
      type: 'normal',
      options: ['', '', '', ''],
      image: null,
    });
    setGroups(updated);
  };

  const updateQuestion = (groupIndex, qIndex, key, value) => {
    const updated = [...groups];
    updated[groupIndex].questions[qIndex][key] = value;
    setGroups(updated);
  };

  const updateOption = (groupIndex, qIndex, optIndex, value) => {
    const updated = [...groups];
    updated[groupIndex].questions[qIndex].options[optIndex] = value;
    setGroups(updated);
  };

  // Export functions
  const exportToPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      
      const pdf = new jsPDF({
        orientation: layout.orientation,
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const contentWidth = pageWidth - margin * 2;
      let yPosition = margin;
      
      // Set font
      pdf.setFont(layout.font === 'Arial' ? 'helvetica' : 'times');
      
      // Add header
      pdf.setFontSize(18);
      pdf.setTextColor(0, 0, 0);
      pdf.text(header.schoolName, margin, yPosition);
      yPosition += 8;
      
      pdf.setFontSize(10);
      pdf.setTextColor(102, 102, 102);
      pdf.text(header.location, margin, yPosition);
      yPosition += 8;
      
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text(header.examTitle, margin, yPosition);
      yPosition += 8;
      
      pdf.setFontSize(10);
      pdf.text(`Subject: ${header.subject} | Class: ${header.className}`, margin, yPosition);
      yPosition += 6;
      
      pdf.text(`Time: ${header.time} | Full Marks: ${header.fullMarks} | Pass Marks: ${header.passMarks}`, margin, yPosition);
      yPosition += 12;
      
      // Add questions
      pdf.setFontSize(layout.fontSize);
      
      groups.forEach((group) => {
        if (yPosition > pageHeight - margin - 10) {
          pdf.addPage();
          yPosition = margin;
        }
        
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);
        pdf.text(group.name, margin, yPosition);
        yPosition += 6;
        
        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin, yPosition - 2, pageWidth - margin, yPosition - 2);
        yPosition += 6;
        
        pdf.setFontSize(layout.fontSize);
        
        group.questions.forEach((q, index) => {
          if (yPosition > pageHeight - margin - 20) {
            pdf.addPage();
            yPosition = margin;
          }
          
          // Question text with wrapping
          const questionText = `${index + 1}. ${q.text}`;
          const lines = pdf.splitTextToSize(questionText, contentWidth);
          
          lines.forEach((line) => {
            pdf.text(line, margin, yPosition);
            yPosition += 6;
          });
          
          yPosition += 4;
          
          // MCQ options
          if (q.type === 'mcq') {
            pdf.setFontSize(layout.fontSize - 2);
            q.options.forEach((opt) => {
              if (opt.trim()) {
                const optLines = pdf.splitTextToSize(`  • ${opt}`, contentWidth - 5);
                optLines.forEach((line) => {
                  pdf.text(line, margin + 5, yPosition);
                  yPosition += 5;
                });
              }
            });
            pdf.setFontSize(layout.fontSize);
            yPosition += 4;
          }
        });
        
        yPosition += 8;
      });
      
      pdf.save(`${header.examTitle}.pdf`);
    } catch (error) {
      alert('Error exporting PDF. Please try again.');
      console.error('PDF export error:', error);
    }
  };

  const exportToDOCX = async () => {
    try {
      // Dynamically import docx library
      const { Document, Packer, Paragraph, TextRun, AlignmentType } = await import('docx');
      
      const docParagraphs = [
        new Paragraph({
          text: header.schoolName,
          bold: true,
          alignment: AlignmentType.CENTER,
          size: 28,
        }),
        new Paragraph({
          text: header.location,
          alignment: AlignmentType.CENTER,
          size: 22,
        }),
        new Paragraph({
          text: header.examTitle,
          bold: true,
          alignment: AlignmentType.CENTER,
          size: 26,
        }),
        new Paragraph({
          text: `Subject: ${header.subject} | Class: ${header.className}`,
          alignment: AlignmentType.CENTER,
          size: 22,
        }),
        new Paragraph({
          text: `Time: ${header.time} | Full Marks: ${header.fullMarks} | Pass Marks: ${header.passMarks}`,
          alignment: AlignmentType.CENTER,
          size: 20,
        }),
        new Paragraph({ text: '' }), // Space
        ...groups.flatMap((group) => [
          new Paragraph({
            text: group.name,
            bold: true,
            size: 26,
          }),
          ...group.questions.map((q, idx) =>
            new Paragraph({
              text: `${idx + 1}. ${q.text}`,
              size: 22,
              spacing: { line: 240, after: 120 },
            })
          ),
          new Paragraph({ text: '' }), // Space between groups
        ]),
      ];

      const doc = new Document({
        sections: [{
          children: docParagraphs,
        }],
      });

      Packer.toBlob(doc).then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${header.examTitle}.docx`;
        a.click();
        window.URL.revokeObjectURL(url);
      });
    } catch (error) {
      alert('Please install "docx" package to export as DOCX: npm install docx');
      console.error('DOCX export error:', error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-gray-800 font-serif">
      <style>{`
        @page {
          size: A4 ${layout.orientation};
          margin: 20mm;
        }
        @media print {
          .no-print { display: none !important; }
          .print-column-selector { display: none !important; }
          .question-list {
            column-count: ${printColumn} !important;
          }
        }
      `}</style>

      <div className="max-w-7xl mx-auto py-8 px-4 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Form area */}
          <section className="no-print w-full lg:w-2/5 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 max-h-[80vh] overflow-y-auto">
            <div className="mb-6 space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-700">Configure</h2>
                <p className="text-sm text-slate-500">Manage your question paper settings and export options.</p>
              </div>
              
              <nav className="flex flex-wrap gap-2">
                {['header', 'groups', 'layout'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-lg font-semibold transition text-sm ${
                      activeTab === tab
                        ? 'bg-emerald-100 text-emerald-900'
                        : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
                    }`}
                  >
                    {tab === 'header' && 'Header'}
                    {tab === 'groups' && 'Groups & Questions'}
                    {tab === 'layout' && 'Layout'}
                  </button>
                ))}
              </nav>

              {/* Print Column Selection */}
              <div className="space-y-2 pt-2">
                <label className="text-xs uppercase tracking-wide text-slate-500 font-semibold block">
                  Print Layout
                </label>
                <select
                  value={printColumn}
                  onChange={(e) => setPrintColumn(parseInt(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value={1}>Single Column</option>
                  <option value={2}>Two Columns</option>
                  <option value={3}>Three Columns</option>
                </select>
              </div>

              {/* Export Buttons */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                
                <button
                  onClick={exportToPDF}
                  className="rounded-lg bg-red-600 hover:bg-red-700 text-white py-2 font-semibold transition text-xs flex items-center justify-center gap-1"
                  title="Export as PDF"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                  PDF
                </button>
                
                <button
                  onClick={exportToDOCX}
                  className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white py-2 font-semibold transition text-xs flex items-center justify-center gap-1"
                  title="Export as DOCX"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  DOCX
                </button>
              </div>

              <hr className="my-4" />
            </div>
            {activeTab === 'header' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-700">Header Settings</h3>
                  <p className="text-xs text-slate-500">Update institute details, exam meta and marking scheme.</p>
                </div>
                {Object.keys(header).map((key) => (
                  <div key={key} className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                    <input
                      value={header[key]}
                      onChange={(e) => setHeader({ ...header, [key]: e.target.value })}
                      placeholder={key}
                      className="w-full rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 px-3 py-2 text-sm"
                    />
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'groups' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-700">Groups & Questions</h3>
                  <p className="text-xs text-slate-500">Manage weightage, question text, MCQ options and media.</p>
                </div>
                {groups.map((group, gi) => (
                  <div key={gi} className="border border-slate-200 rounded-2xl p-4 space-y-3">
                    <input
                      value={group.name}
                      onChange={(e) => {
                        const updated = [...groups];
                        updated[gi].name = e.target.value;
                        setGroups(updated);
                      }}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"
                    />
                    <div>
                      <label className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                        Weightage per question
                      </label>
                      <input
                        type="number"
                        value={group.weight}
                        onChange={(e) => {
                          const updated = [...groups];
                          updated[gi].weight = e.target.value;
                          setGroups(updated);
                        }}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      />
                    </div>

                    <div className="space-y-3">
                      {group.questions.map((q, qi) => (
                        <div key={qi} className="border border-dashed border-slate-300 rounded-2xl p-3 space-y-2 bg-slate-50/50">
                          <textarea
                            value={q.text}
                            onChange={(e) => updateQuestion(gi, qi, 'text', e.target.value)}
                            placeholder="Question text"
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                          />

                          <select
                            value={q.type}
                            onChange={(e) => updateQuestion(gi, qi, 'type', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                          >
                            <option value="normal">Normal</option>
                            <option value="mcq">MCQ</option>
                          </select>

                          {q.type === 'mcq' && (
                            <div className="grid grid-cols-1 gap-2">
                              {q.options.map((opt, oi) => (
                                <input
                                  key={oi}
                                  value={opt}
                                  onChange={(e) => updateOption(gi, qi, oi, e.target.value)}
                                  placeholder={`Option ${oi + 1}`}
                                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                />
                              ))}
                            </div>
                          )}

                          <input
                            type="file"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              updateQuestion(gi, qi, 'image', URL.createObjectURL(file));
                            }}
                            className="text-sm text-slate-500"
                          />
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => addQuestion(gi)}
                      className="w-full rounded-xl bg-slate-900 text-white py-2 text-sm font-semibold hover:bg-slate-800 transition"
                    >
                      Add Question
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'layout' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-700">Layout Settings</h3>
                  <p className="text-xs text-slate-500">Control orientation, typography and column count.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Orientation</label>
                  <select
                    value={layout.orientation}
                    onChange={(e) => setLayout({ ...layout, orientation: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Columns</label>
                  <select
                    value={layout.columns}
                    onChange={(e) => setLayout({ ...layout, columns: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Font Family</label>
                  <select
                    value={layout.font}
                    onChange={(e) => setLayout({ ...layout, font: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option>Times New Roman</option>
                    <option>Arial</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Font Size</label>
                  <input
                    type="number"
                    value={layout.fontSize}
                    onChange={(e) => setLayout({ ...layout, fontSize: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            )}
          </section>

          {/* Preview */}
          <section
            ref={previewRef}
            className="flex-1 bg-white rounded-2xl shadow-md border border-slate-100 p-8 max-h-[80vh] overflow-y-auto"
            style={{ fontFamily: layout.font, fontSize: layout.fontSize }}
          >
            <div className="text-center space-y-1">
              <h1 className="text-2xl font-bold uppercase tracking-wide">{header.schoolName}</h1>
              <p className="text-sm text-slate-500">{header.location}</p>
              <h2 className="text-xl font-semibold">{header.examTitle}</h2>
              <p className="text-sm">
                Subject: <span className="font-semibold">{header.subject}</span> | Class: <span className="font-semibold">{header.className}</span>
              </p>
              <div className="flex justify-center gap-4 text-sm text-slate-500">
                <span>Time: {header.time}</span>
                <span>Full Marks: {header.fullMarks}</span>
                <span>Pass Marks: {header.passMarks}</span>
              </div>
            </div>

            {groups.map((group, gi) => (
              <div key={gi} className="mt-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-b border-slate-200 pb-2">
                  <h3 className="text-lg font-bold">{group.name}</h3>
                  <p className="text-sm text-slate-500">
                    ({group.weight} × {group.questions.length} = {group.weight * group.questions.length})
                  </p>
                </div>
                <ol className="list-decimal ml-5 mt-3 space-y-2 question-list" style={{ columnCount: layout.columns }}>
                  {group.questions.map((q, qi) => (
                    <li key={qi} className="break-inside-avoid text-justify leading-relaxed">
                      {q.text}
                      {q.image && <img src={q.image} className="max-h-32 my-2 rounded" alt="question" />}
                      {q.type === 'mcq' && (
                        <ul className="list-disc ml-4 text-sm space-y-1">
                          {q.options.map((opt, oi) => (
                            <li key={oi}>{opt}</li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}
