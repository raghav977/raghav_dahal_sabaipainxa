"use client"
import React, { useState } from 'react';

export default function AdvancedQuestionPaperGenerator() {
  const [activeTab, setActiveTab] = useState('header');

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

  return (
    <div className="min-h-screen bg-slate-50 text-gray-800 font-serif">
      <style>{`
        @page {
          size: A4 ${layout.orientation};
          margin: 20mm;
        }
        @media print {
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="max-w-7xl mx-auto py-8 px-4 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="no-print w-full lg:w-1/5 bg-white rounded-2xl shadow-sm border border-slate-100 p-5 h-fit">
            <h2 className="text-sm font-semibold text-slate-500 mb-4 tracking-wide">CONFIGURE</h2>
            <nav className="flex flex-col gap-2">
              {['header', 'groups', 'layout'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`w-full text-left px-4 py-3 rounded-xl font-semibold transition ${
                    activeTab === tab
                      ? 'bg-emerald-100 text-emerald-900'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {tab === 'header' && 'Header'}
                  {tab === 'groups' && 'Groups & Questions'}
                  {tab === 'layout' && 'Layout'}
                </button>
              ))}
            </nav>
            <button
              onClick={() => window.print()}
              className="mt-6 w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-3 font-semibold transition"
            >
              Print Paper
            </button>
          </aside>

          {/* Form area */}
          <section className="no-print w-full lg:w-2/5 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 max-h-[80vh] overflow-y-auto">
            {activeTab === 'header' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-700">Header Settings</h2>
                  <p className="text-sm text-slate-500">Update institute details, exam meta and marking scheme.</p>
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
                  <h2 className="text-lg font-semibold text-slate-700">Groups & Questions</h2>
                  <p className="text-sm text-slate-500">Manage weightage, question text, MCQ options and media.</p>
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
                  <h2 className="text-lg font-semibold text-slate-700">Layout Settings</h2>
                  <p className="text-sm text-slate-500">Control orientation, typography and column count.</p>
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
            className="flex-1 bg-white rounded-2xl shadow-md border border-slate-100 p-8"
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
                <ol className="list-decimal ml-5 mt-3 space-y-2" style={{ columnCount: layout.columns }}>
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
