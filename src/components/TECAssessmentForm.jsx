"use client";
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, FileDown, Save, Send } from 'lucide-react';

export default function TECAssessmentForm() {
  const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [otherSelections, setOtherSelections] = useState({});
    const [saveStatus, setSaveStatus] = useState('');
    const [email, setEmail] = useState('');
    const [submissionId, setSubmissionId] = useState('');
    const [submissionStatus, setSubmissionStatus] = useState('draft');
    const totalSteps = 17;

    const reviewingDepartmentStepMap = {
      EMD: 6,
      'Safety & Emergency': 7,
      MITS: 8,
      'Human Res Mgt Div': 9,
      BDO: 10,
      CPO: 12,
      BURSARY: 13,
      'Campus Security Office': 14,
      'Office - Planning & Inst Research': 15,
      'Campus Legal Office': 16,
      Secretariat: 17,
    };

    const handleReviewingDepartmentChange = (department) => {
      updateField('reviewingDepartment', department);
      setCurrentStep(reviewingDepartmentStepMap[department] || 5);
    };

  const setOtherSelection = (fieldName, isSelected, nestedKey) => {
    setOtherSelections((prev) => {
      if (!nestedKey) {
        return {
          ...prev,
          [fieldName]: isSelected,
        };
      }

      const currentGroup = typeof prev[fieldName] === 'object' && prev[fieldName] !== null
        ? prev[fieldName]
        : {};

      return {
        ...prev,
        [fieldName]: {
          ...currentGroup,
          [nestedKey]: isSelected,
        },
      };
    });
  };

  const isOtherSelected = (fieldName) => {
    const selection = otherSelections[fieldName];

    if (typeof selection === 'object' && selection !== null) {
      return Object.values(selection).some(Boolean);
    }

    return Boolean(selection);
  };

  const renderOtherTextInput = (fieldName, placeholder = 'Please specify') => {
    if (!isOtherSelected(fieldName)) {
      return null;
    }

    return (
      <div className="mt-3">
        <input
          type="text"
          value={formData[`${fieldName}Other`] || ''}
          onChange={(e) => updateField(`${fieldName}Other`, e.target.value)}
          placeholder={placeholder}
          className="w-full p-2 border rounded"
        />
      </div>
    );
  };

    const formatFieldLabel = (fieldName) => {
        if (fieldName.startsWith('deptReview_')) {
          const parts = fieldName.split('_');
          const departmentSlug = parts[1] || 'department';
          const fieldSlug = parts.slice(2).join('_') || 'response';
          const department = departmentSlug
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (char) => char.toUpperCase());
          const field = fieldSlug
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (char) => char.toUpperCase());

          return `${department} Review: ${field}`;
        }

        return fieldName
            .replace(/([A-Z])/g, ' $1')
            .replace(/[-_]/g, ' ')
            .replace(/^./, (char) => char.toUpperCase())
            .trim();
    };

    const buildExportMarkup = () => {
        const summaryEntries = [
            ['Email', email],
            ...Object.entries(formData).map(([field, value]) => [formatFieldLabel(field), value])
        ].filter(([, value]) => value !== undefined && value !== null && value !== '');

        const rows = summaryEntries.length > 0
            ? summaryEntries.map(([label, value]) => {
                const displayValue = typeof value === 'object'
                    ? JSON.stringify(value)
                    : String(value);

                return `
                    <tr>
                      <th>${label}</th>
                      <td>${displayValue}</td>
                    </tr>
                `;
            }).join('')
            : `
                <tr>
                  <td colspan="2">No saved submission data is available yet.</td>
                </tr>
            `;

        return `
          <!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="UTF-8" />
              <title>TEC Assessment Submission</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  margin: 40px;
                  color: #0f172a;
                }
                h1 {
                  margin-bottom: 8px;
                }
                p {
                  margin-top: 0;
                  color: #475569;
                }
                table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-top: 24px;
                }
                th, td {
                  border: 1px solid #cbd5e1;
                  padding: 12px;
                  vertical-align: top;
                  text-align: left;
                }
                th {
                  width: 35%;
                  background: #f8fafc;
                }
              </style>
            </head>
            <body>
              <h1>TEC Proposal Assessment Form</h1>
              <p>Export generated ${new Date().toLocaleString()}</p>
              <table>
                <tbody>${rows}</tbody>
              </table>
            </body>
          </html>
        `;
    };

    // Load saved form data on mount
    useEffect(() => {
        const loadFormData = async () => {
            const editSubmissionId = new URLSearchParams(window.location.search).get('editSubmissionId');
            if (editSubmissionId) {
                try {
                    const response = await fetch(`/tec/api/submissions?id=${encodeURIComponent(editSubmissionId)}`, {
                        cache: 'no-store',
                    });
                    if (response.ok) {
                        const submission = await response.json();
                        setSubmissionId(submission.id);
                        setSubmissionStatus(submission.status || 'draft');
                        setEmail(submission.email || '');
                        setFormData(submission.formData || {});
                        setSaveStatus('Editing existing submission');
                        setTimeout(() => setSaveStatus(''), 2000);
                    } else {
                        setSaveStatus('Unable to load submission for editing');
                    }
                } catch (error) {
                    console.error('Error loading submission for editing:', error);
                    setSaveStatus('Error loading submission for editing');
                }
                return;
            }

            const savedEmail = localStorage.getItem('tecFormEmail');
            if (savedEmail) {
                setEmail(savedEmail);
                try {
                    const response = await fetch(`/tec/api/submissions?email=${encodeURIComponent(savedEmail)}`);
                    if (response.ok) {
                        const submission = await response.json();
                        setSubmissionId(submission.id || '');
                        setSubmissionStatus(submission.status || 'draft');
                        setFormData(submission.formData || {});
                        setSaveStatus('Form loaded from database');
                        setTimeout(() => setSaveStatus(''), 2000);
                    }
                } catch (error) {
                    console.error('Error loading form data:', error);
                }
            }
        };
        loadFormData();
    }, []);

    const getMissingRequiredFields = ({ requireReviewingDepartment = true } = {}) => {
        const missing = [];

        if (!email || !String(email).trim()) {
            missing.push('Email');
        }

        if (requireReviewingDepartment && (!formData.reviewingDepartment || !String(formData.reviewingDepartment).trim())) {
            missing.push('Reviewing Department');
        }

        return missing;
    };

    const validateRequiredFields = (actionLabel = 'submit', options = {}) => {
        const missing = getMissingRequiredFields(options);

        if (missing.length > 0) {
            const message = `Please complete the required field${missing.length > 1 ? 's' : ''} before ${actionLabel}: ${missing.join(', ')}.`;
            setSaveStatus(message);
            return false;
        }

        return true;
    };

    // Save form data to database
    const saveFormData = async ({ status, redirectToThankYou = false, validate = true } = {}) => {
        const nextStatus = status || (submissionId ? submissionStatus : 'draft');

        if (validate && !validateRequiredFields(nextStatus === 'submitted' && redirectToThankYou ? 'submitting the form' : 'saving the form')) {
        return false;
        }

        setIsSaving(true);
        try {
            const response = await fetch('/tec/api/submissions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: submissionId || undefined,
                    email,
                  formData,
                  status: nextStatus,
                })
            });

            if (response.ok) {
                const submission = await response.json();
                setSubmissionId(submission.id || submissionId);
                setSubmissionStatus(submission.status || nextStatus);

                if (status === 'submitted') {
                  localStorage.removeItem('tecFormEmail');
                  setSaveStatus('Form submitted successfully');
                  if (redirectToThankYou) {
                    router.push('/thank-you');
                  }
                } else {
                  localStorage.setItem('tecFormEmail', email);
                  setSaveStatus(submissionId ? 'Form changes saved successfully' : 'Form saved successfully');
                  setTimeout(() => setSaveStatus(''), 2000);
                }
                return true;
            } else {
                setSaveStatus(status === 'submitted' ? 'Error submitting form' : 'Error saving form');
            }
        } catch (error) {
            console.error('Error saving form:', error);
              setSaveStatus(status === 'submitted' ? 'Error submitting form' : 'Error saving form');
        } finally {
            setIsSaving(false);
        }

            return false;
    };

    // Update form field
    const updateField = (fieldName, value) => {
        setFormData(prev => ({
            ...prev,
            [fieldName]: value
        }));
    };

    const isDepartmentStep = currentStep >= 6 && currentStep <= totalSteps;

    const slugify = (value = '') => value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    const getDepartmentForCurrentStep = () => {
      const mappedDepartment = Object.keys(reviewingDepartmentStepMap).find(
        (department) => reviewingDepartmentStepMap[department] === currentStep
      );

      return mappedDepartment || formData.reviewingDepartment || 'department';
    };

    const buildDepartmentReviewKey = (rawFieldName) => {
      const departmentSlug = slugify(getDepartmentForCurrentStep()) || 'department';
      const fieldSlug = slugify(rawFieldName) || 'response';
      return `deptReview_${departmentSlug}_${fieldSlug}`;
    };

    const handleDepartmentFieldChange = (event) => {
      if (!isDepartmentStep) {
        return;
      }

      const target = event.target;
      const tagName = target?.tagName?.toLowerCase();

      if (!['input', 'select', 'textarea'].includes(tagName)) {
        return;
      }

      if (tagName === 'input' && ['button', 'submit', 'reset'].includes(target.type)) {
        return;
      }

      if (target.type === 'radio' && !target.checked) {
        return;
      }

      const formElements = Array.from(event.currentTarget.querySelectorAll('input, select, textarea'));
      const elementIndex = formElements.indexOf(target) + 1;

      const fallbackName = `field_${tagName}_${elementIndex}`;
      const rawFieldName = target.name || target.id || target.getAttribute('data-field') || fallbackName;
      const storageKey = buildDepartmentReviewKey(rawFieldName);

      let value;

      if (target.type === 'checkbox') {
        if (target.name) {
          const checkedValues = Array.from(
            event.currentTarget.querySelectorAll(`input[type="checkbox"][name="${target.name}"]:checked`)
          ).map((input) => input.value || 'checked');
          value = checkedValues;
        } else {
          value = target.checked;
        }
      } else {
        value = target.value;
      }

      updateField(storageKey, value);
    };

    const nextStep = () => {
        if (currentStep < totalSteps) {
            const requireReviewingDepartment = currentStep >= 4;

            if (!validateRequiredFields('continuing', { requireReviewingDepartment })) {
                return;
            }

            if (formData.reviewingDepartment === 'MITS' && currentStep === reviewingDepartmentStepMap['MITS']) {
                submitForm();
            } else {
                setCurrentStep(currentStep + 1);
                saveFormData({ validate: requireReviewingDepartment });
            }
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
        if (currentStep >= 6 && currentStep <= 17) {
          setCurrentStep(4);
          return;
        }

            setCurrentStep(currentStep - 1);
        }
    };

    const submitForm = async () => {
      if (!validateRequiredFields('submitting the form')) {
        return;
      }

      await saveFormData({ status: 'submitted', redirectToThankYou: true });
    };

    const exportAsPdf = async () => {
      // Open the window synchronously to avoid pop-up blockers
      const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700');
      setIsExportingPdf(true);

      if (!printWindow) {
        setSaveStatus('Unable to open PDF preview. Please allow pop-ups and try again.');
        setIsExportingPdf(false);
        return;
      }

      try {
        const saved = await saveFormData();

        if (!saved) {
          printWindow.close();
          return;
        }

        printWindow.document.open();
        printWindow.document.write(buildExportMarkup());
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
      } finally {
        setIsExportingPdf(false);
      }
    };

    const renderSection = () => {
      switch(currentStep) {
        case 1:
            return (
              <div className="space-y-6">
                <section className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-xl font-semibold mb-4">A. GENERAL PROJECT BACKGROUND</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block mb-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-2 border rounded"
                        placeholder="Valid email"
                      />
                    </div>
                  </div>
                </section>

                <section className="bg-white p-6 rounded-lg shadow">
                  <div>
                    <label className="block mb-1">PROJECT NAME:</label>
                    <input 
                      type="text"
                      value={formData.projectName || ''}
                      onChange={(e) => updateField('projectName', e.target.value)}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                </section>

                <section className="bg-white p-6 rounded-lg shadow">
                  <div>
                    <label className="block mb-1">
                      CLIENT (Department/Unit/Office)
                      <span className="text-red-500"> *</span>
                    </label>
                    <input 
                      type="text"
                      required
                      value={formData.client || ''}
                      onChange={(e) => updateField('client', e.target.value)}
                      placeholder="Department/Unit/Office"
                      className="w-full p-2 border rounded"
                    />
                  </div>
                </section>

                <section className="bg-white p-6 rounded-lg shadow">
                  <div>
                    <label className="block mb-1">
                      Contact Name: <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text"
                      required
                      value={formData.contactName || ''}
                      onChange={(e) => updateField('contactName', e.target.value)}
                      placeholder="Contact Name"
                      className="w-full p-2 border rounded"
                    />
                  </div>
                </section>

                <section className="bg-white p-6 rounded-lg shadow">
                  <div>
                    <label className="block mb-1">
                      Contact Telephone: <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.contactTelephone || ''}
                      onChange={(e) => updateField('contactTelephone', e.target.value)}
                      placeholder="Contact Telephone"
                      className="w-full p-2 border rounded"
                    />
                  </div>
                </section>

                <section className="bg-white p-6 rounded-lg shadow">
                  <div>
                    <label className="block mb-1">
                      DATE <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="date"
                      required
                      value={formData.date || ''}
                      onChange={(e) => updateField('date', e.target.value)}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                </section>

                <section className="bg-white p-6 rounded-lg shadow">
                  <div>
                    <label className="block mb-1">Title:</label>
                    <div className="space-y-2">
                      {['Mr', 'Mrs', 'Ms.', 'Dr', 'Professor', 'Other'].map((title) => (
                        <label key={title} className="flex items-center space-x-2">
                          <input 
                            type="radio" 
                            name="title" 
                            value={title}
                            checked={formData.title === title}
                            onChange={(e) => {
                              updateField('title', e.target.value);
                              setOtherSelection('title', e.target.value === 'Other');
                            }}
                          />
                          <span>{title}</span>
                        </label>
                      ))}
                      {formData.title === 'Other' && (
                        <div className="mt-3">
                          <input
                            type="text"
                            value={formData.titleOther || ''}
                            onChange={(e) => updateField('titleOther', e.target.value)}
                            placeholder="Enter title"
                            className="w-full p-2 border rounded"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                <section className="bg-white p-6 rounded-lg shadow">
                  <div>
                    <label className="block mb-1">
                      Project Type: <span className="text-red-500">*</span>
                    </label>
                    <div>
                      <select 
                        required
                        value={formData.projectType || ''}
                        onChange={(e) => {
                          updateField('projectType', e.target.value);
                          setOtherSelection('projectType', e.target.value === 'other');
                        }}
                        className="w-full p-2 border rounded"
                      >
                        <option value="">Select a project type</option>
                        <option value="renovation">Renovation</option>
                        <option value="refurbishment">Refurbishment</option>
                        <option value="demolition">Demolition</option>
                        <option value="addition">Addition</option>
                        <option value="reinstatement">Reinstatement</option>
                        <option value="infrastructure">Infrastructure Upgrade</option>
                        <option value="other">Other</option>
                      </select>
                      {formData.projectType === 'other' && (
                        <div className="mt-3">
                          <input
                            type="text"
                            value={formData.projectTypeOther || ''}
                            onChange={(e) => updateField('projectTypeOther', e.target.value)}
                            placeholder="Enter project type"
                            className="w-full p-2 border rounded"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                <section className="bg-white p-6 rounded-lg shadow mt-6">
                  <h2 className="text-xl font-semibold mb-4">Approvals & Recommendations</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr>
                          <th className="text-left p-2"></th>
                          <th className="text-center p-2">Stage 1</th>
                          <th className="text-center p-2">Stage 2</th>
                          <th className="text-center p-2">Stage 3</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          'Finance & General Purpose',
                          'Grounds, Buildings & Premises',
                          'Technical & Environmental',
                          'Tender Committee',
                          'Board of the Applicant',
                          'Other'
                        ].flatMap((row) => {
                          const rows = [
                            <tr key={row}>
                                <td className="p-2">{row}</td>
                                <td className="text-center p-2">
                                    <input
                                      type="checkbox"
                                      className="h-4 w-4"
                                      onChange={(e) => {
                                        if (row === 'Other') {
                                          setOtherSelection('approvalsRecommendations', e.target.checked, 'stage1');
                                        }
                                      }}
                                    />
                                </td>
                                <td className="text-center p-2">
                                    <input
                                      type="checkbox"
                                      className="h-4 w-4"
                                      onChange={(e) => {
                                        if (row === 'Other') {
                                          setOtherSelection('approvalsRecommendations', e.target.checked, 'stage2');
                                        }
                                      }}
                                    />
                                </td>
                                <td className="text-center p-2">
                                    <input
                                      type="checkbox"
                                      className="h-4 w-4"
                                      onChange={(e) => {
                                        if (row === 'Other') {
                                          setOtherSelection('approvalsRecommendations', e.target.checked, 'stage3');
                                        }
                                      }}
                                    />
                                </td>
                            </tr>
                          ];

                          if (row === 'Other' && isOtherSelected('approvalsRecommendations')) {
                            rows.push(
                              <tr key={`${row}-details`}>
                                <td colSpan={4} className="p-2">
                                  <input
                                    type="text"
                                    value={formData.approvalsRecommendationsOther || ''}
                                    onChange={(e) => updateField('approvalsRecommendationsOther', e.target.value)}
                                    placeholder="Enter other approval or recommendation"
                                    className="w-full p-2 border rounded"
                                  />
                                </td>
                              </tr>
                            );
                          }

                          return rows;
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            );
        case 2:
          return (
            <div className="space-y-6"> 
              <section className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-xl font-semibold mb-4">B. TECHNICAL</h2>
                  <div className="space-y-4">
                    <div>
                      <input 
                        type="text" 
                        required
                        className="w-full p-2 border rounded"
                        placeholder="Description (optional)"
                      />
                    </div>
                  </div>
                </section>

              <section className="bg-white p-6 rounded-lg shadow">
                <div className="space-y-4">
                  <div>
                    <label className="block mb-1">
                      LOCATION METRICS
                    </label>
                    <input 
                      type="text" 
                      required
                      className="w-full p-2 border rounded"
                      placeholder="Description (optional)"
                    />
                  </div>
                </div>
              </section>

              <section className="bg-white p-6 rounded-lg shadow">
                <div className="space-y-4">
                  <div>
                    <label className="block mb-1">
                      Precise loaction of building (Include GPS coordinates)
                    </label>
                    <input 
                      type="text" 
                      required
                      className="w-full p-2 border rounded"
                    />
                  </div>
                </div>
              </section>

              <section className="bg-white p-6 rounded-lg shadow">
                <div className="space-y-4">
                  <div>
                    <label className="block mb-1">
                       Existing Building Area:
                      </label>
                      <input 
                        type="text" 
                        required
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block mb-1">
                      Proposed Building Area:
                    </label>
                    <input 
                      type="text" 
                      required
                      className="w-full p-2 border rounded"
                    />
                  </div>
                </div>
              </section>
                
              <section className="bg-white p-6 rounded-lg shadow">
                <div className="space-y-4">
                  <div>
                    <label className="block mb-1">
                      SITE ANALYSIS
                    </label>
                    <input 
                      type="text" 
                      required
                      className="w-full p-2 border rounded"
                      placeholder="Description (optional)"
                    />
                  </div>
                </div>
              </section>

              <section className="bg-white p-6 rounded-lg shadow">
                <div>
                  <label className="block mb-1">
                    Topography:
                  </label>
                  <div>
                    <select 
                      required
                      className="w-full p-2 border rounded"
                    >
                      <option value="">Select a Topography</option>
                      <option value="gentlySloping">Gently Sloping</option>
                      <option value="relativelyFlat">Relatively Flat</option>
                      <option value="sleep">Sleep</option>
                      <option value="moderatelySloping">Moderately Sloping</option>
                    </select>
                  </div>
                </div>
              </section>

              <section className="bg-white p-6 rounded-lg shadow">
                <div>
                  <label className="block mb-1">
                    Building functions:
                  </label>
                  <div>
                    <select required className="w-full p-2 border rounded">
                      <option value="">Select a Building Function</option>
                      <option value="Academic">Academic</option>
                      <option value="Administrative">Administrative</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Circulation">Circulation</option>
                      <option value="Student Services">Student Services</option>
                      <option value="Housing & Accommodation">Housing & Accommodation</option>
                      <option value="Utility Service">Utility Service</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </section>

              <section className="bg-white p-6 rounded-lg shadow">
              <label className="block mb-1">
                    Appropriate Utilities Include:
                  </label>
                <div className="space-y-3">
                  {[
                    'Water Supply',
                    'Emergency Water Supply (Fire-Fighting)',
                    'Special Utilities (Oxygen, LPG, etc.)',
                    'Electrical',
                    'Sewage',
                    'Data',
                    'Fibre (ICT)',
                    'Telephone',
                    'Other'
                  ].map((utility) => (
                    <label key={utility} className="flex items-center space-x-3">
                      <input 
                        type="checkbox" 
                        name="utilities" 
                        value={utility}
                        onChange={(e) => {
                          if (utility === 'Other') {
                            setOtherSelection('utilities', e.target.checked);
                          }
                        }}
                        className="h-5 w-5 border-gray-300 rounded"
                      />
                      <span className="text-gray-700">{utility}</span>
                    </label>
                  ))}
                  {renderOtherTextInput('utilities', 'Enter other utility')}
                </div>
              </section>
              
              <section className="bg-white p-6 rounded-lg shadow">
                <div>
                  <label className="block mb-1">
                  The utility charges will be undertaken by the Campus or the external entity.:
                  </label>
                  <div>
                    <select 
                      required
                      className="w-full p-2 border rounded"
                    >
                      <option value="">Select</option>
                      <option value="campus">Campus</option>
                      <option value="externalEntity">External entity</option>
                    </select>
                  </div>
                </div>
              </section>

              <section className="bg-white p-6 rounded-lg shadow">
                <label className="block mb-1">
                  Electrical & Mechanical:
                </label>
                <div className="space-y-3">
                  {[
                    'Electrical',
                    'Lightning Protection',
                    'Power Rating',
                    'Standby Generator',
                    'Alternate Energy (Solar, wind etc.)',
                    'Air conditioning',
                    'Elevator',
                    'Other'
                  ].map((item) => (
                    <label key={item} className="flex items-center space-x-3">
                      <input 
                        type="checkbox" 
                        name="electrical_mechanical" 
                        value={item}
                        onChange={(e) => {
                          if (item === 'Other') {
                            setOtherSelection('electricalMechanical', e.target.checked);
                          }
                        }}
                        className="h-5 w-5 border-gray-300 rounded"
                      />
                      <span className="text-gray-700">{item}</span>
                    </label>
                  ))}
                  {renderOtherTextInput('electricalMechanical', 'Enter other electrical or mechanical item')}
                </div>
              </section>

              <section className="bg-white p-6 rounded-lg shadow">
                <label> Fire Detection & Suppression Systems:</label>
                <div className="space-y-3">
                  {[
                    'Automatic Fire Detection & Alarm',
                    'Sprinkler',
                    'Hydrants',
                    'Vents',
                    'Automatic Suppression System',
                    'Fire Extinguisher',
                    'Other'
                  ].map((item) => (
                    <label key={item} className="flex items-center space-x-3">
                      <input 
                        type="checkbox" 
                        name="fire_detection" 
                        value={item}
                        onChange={(e) => {
                          if (item === 'Other') {
                            setOtherSelection('fireDetection', e.target.checked);
                          }
                        }}
                        className="h-5 w-5 border-gray-300 rounded"
                      />
                      <span className="text-gray-700">{item}</span>
                    </label>
                  ))}
                  {renderOtherTextInput('fireDetection', 'Enter other fire detection or suppression system')}
                </div>
              </section>

              <section className="bg-white p-6 rounded-lg shadow">
                <label>Infrastructure: Analysis of existing infrastructure to support new construction:</label>
                <div className="space-y-3">
                  {[
                    'Electrical',
                    'Fiber/ Data',
                    'Storm Water (Collection, Transportation, Deposit, drainage)',
                    'Sewer connection',
                    'Impediments e.g. large trees',
                      'Other'
                  ].map((item) => (
                    <label key={item} className="flex items-center space-x-3">
                      <input 
                        type="checkbox" 
                        name="infrastructure" 
                        value={item}
                        onChange={(e) => {
                          if (item === 'Other') {
                            setOtherSelection('infrastructure', e.target.checked);
                          }
                        }}
                        className="h-5 w-5 border-gray-300 rounded"
                      />
                      <span className="text-gray-700">{item}</span>
                    </label>
                  ))}
                  {renderOtherTextInput('infrastructure', 'Enter other infrastructure item')}
                </div>
              </section>

            </div>
          );
        case 3:
          return (
            <section>
              <h2 className="text-xl font-semibold mb-4">Assessment & Evaluation</h2>
              <div>
                <p>
                Assess the proposal for : completeness with Documentation,
                meet the Technical and Environmental standards, demonstrates 
                financial soundness, and is Socially conscious to improve the 
                Triple Bottom Line sustainable thrust of the University.  
                </p>
              </div>
              
            </section>
          );
        case 5:
          return (
            <div>
              <section className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-xl font-semibold mb-4">REQUIRED DOCUMENTATION</h2>
                  <div className="space-y-4">
                    <div>
                      <input 
                        type="text" 
                        required
                        className="w-full p-2 border rounded"
                        placeholder="Description (optional)"
                      />
                    </div>
                  </div>
              </section>

              <section className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">DOCUMENTATION</h2>
                <div className="space-y-4">
                  <p className="mb-4">
                    Required Information
                  </p>
                  <p className="mb-4">
                    Stakeholders will be responsible for providing the following 
                    information which will be used by the Technical Committee as outlined
                    in their Terms of Reference (Appendix 1)
                  </p>
                  <p>
                    To facilitate the capital development process the following 
                    "package" of documents is to be developed  
                  </p>
                </div>
            </section>

            <section className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg mb-4">
                Clear, written description of project objectives and rationale
                <span className="text-red-500 ml-1">*</span>
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Strongly Disagree</span>
                <div className="flex items-center justify-center gap-8 flex-grow mx-8">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <div key={value} className="flex flex-col items-center">
                      <input
                        type="radio"
                        id={`objectives-${value}`}
                        name="objectives"
                        value={value}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <label
                        htmlFor={`objectives-${value}`}
                        className="mt-2 text-sm text-gray-600"
                      >
                        {value}
                      </label>
                    </div>
                  ))}
                </div>
                <span className="text-sm text-gray-600">Strongly Agree</span>
              </div>
            </section>

            <section className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg mb-4">
                For new construction – Precise identification of site, evaluation of site-specific issues, notes on municipal needs (Impact assessments, etc.)
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Strongly Disagree</span>
                <div className="flex items-center justify-center gap-8 flex-grow mx-8">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <div key={value} className="flex flex-col items-center">
                      <input
                        type="radio"
                        id={`construction-${value}`}
                        name="construction"
                        value={value}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <label
                        htmlFor={`construction-${value}`}
                        className="mt-2 text-sm text-gray-600"
                      >
                        {value}
                      </label>
                    </div>
                  ))}
                </div>
                <span className="text-sm text-gray-600">Strongly Agree</span>
              </div>
            </section>

            <section className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg mb-4">
                For renovation/refurbishment – identification of problems with existing structure, stewardship of the facility, any significance of structure (historic)
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Strongly Disagree</span>
                <div className="flex items-center justify-center gap-8 flex-grow mx-8">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <div key={value} className="flex flex-col items-center">
                      <input
                        type="radio"
                        id={`renovation-${value}`}
                        name="renovation"
                        value={value}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <label
                        htmlFor={`renovation-${value}`}
                        className="mt-2 text-sm text-gray-600"
                      >
                        {value}
                      </label>
                    </div>
                  ))}
                </div>
                <span className="text-sm text-gray-600">Strongly Agree</span>
              </div>
            </section>

            <section className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg mb-4">
                DOCUMENTATION (Overall Provision Rating %)
                <span className="text-red-500 ml-1">*</span>
              </h3>
              <div className="flex items-center justify-center space-x-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                  <div key={value} className="flex flex-col items-center">
                    <input
                      type="radio"
                      id={`documentation-rating-${value}`}
                      name="documentation-rating"
                      value={value}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <label
                      htmlFor={`documentation-rating-${value}`}
                      className="mt-2 text-sm text-gray-600"
                    >
                      {value}
                    </label>
                  </div>
                ))}
              </div>
            </section>

            {/* Technical & Environmental Assessment Section */}
            <section className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg mb-4">TECHNICAL & ENVIRONMENTAL ASSESSMENT RATING</h3>
              <div>
                <input 
                  type="text"
                  placeholder="Description (optional)"
                  className="w-full p-2 border rounded text-gray-600"
                />
              </div>
            </section>
          </div>
          );
        case 4:
          return (
            <div>
              <section className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-xl font-semibold mb-4">REVIEWING DEPARTMENT</h2>
                  <div className="space-y-4">
                    <div>
                      <input 
                        type="text" 
                        required
                        className="w-full p-2 border rounded"
                        placeholder="Description (optional)"
                      />
                    </div>
                  </div>
              </section>

              <section className="bg-white p-6 rounded-lg shadow">
                <label>
                  REVIEWING DEPARTMENT <span className="text-red-500">*</span>
                </label>
                <div className="space-y-3">
                  {[
                    'EMD',
                    'CPO',
                    'BURSARY',
                    'BDO',
                    'MITS',
                    'Safety & Emergency',
                    'Human Res Mgt Div',
                    'Campus Security Office',
                    'Office - Planning & Inst Research',
                    'Campus Legal Office',
                    'Secretariat'
                  ].map((dept) => (
                    <label key={dept} className="flex items-center space-x-3">
                      <input 
                        type="radio" 
                        name="reviewing_department" 
                        value={dept}
                        required
                        checked={formData.reviewingDepartment === dept}
                        onChange={(e) => handleReviewingDepartmentChange(e.target.value)}
                        className="h-5 w-5 border-gray-300"
                      />
                      <span className="text-gray-700">{dept}</span>
                    </label>
                  ))}
                </div>
            </section>

            </div>
          );
        case 6:
          return (
            <div>
              <section className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-xl font-semibold mb-4">EMD</h2>
                  <div className="space-y-4">
                    <div>
                      <input 
                        type="text" 
                        required
                        className="w-full p-2 border rounded"
                        placeholder="Estate Management Department"
                        readOnly
                      />
                    </div>
                  </div>
              </section>

              <section className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4">Exterior Works - EMD</h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="text-left p-2"></th>
                        <th className="text-center p-2">Adequate</th>
                        <th className="text-center p-2">Non Existing</th>
                        <th className="text-center p-2">Requires improvement</th>
                        <th className="text-center p-2">Urgently required</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        'Parking',
                        'Parking for Physically Challenged',
                        'Sidewalks',
                        'Landscaping',
                        'Perimeter Fencing',
                        'Road Access',
                        'Appropriate Utilities',
                        'Electrical & Mechanical',
                        'Sanitation',
                        'Stormwater Design',
                        'EMD Report attached'
                      ].map((item) => (
                        <tr key={item} className="border-t">
                          <td className="p-2">{item}</td>
                          {['adequate', 'non-existing', 'requires-improvement', 'urgently-required'].map((status) => (
                            <td key={status} className="text-center p-2">
                              <input
                                type="radio"
                                name={item.toLowerCase().replace(/\s+/g, '-')}
                                value={status}
                                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
              
              <section className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4">Other Features</h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="text-left p-2"></th>
                        <th className="text-center p-2">Adequate</th>
                        <th className="text-center p-2">Non Existing</th>
                        <th className="text-center p-2">Requires improvement</th>
                        <th className="text-center p-2">Urgently required</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        'Historic features & Cultural Significance',
                        'Persons with Disabilities Requirements',
                        'Service/delivery access',
                        'Emergency Vehicle Access'
                      ].map((item) => (
                        <tr key={item} className="border-t">
                          <td className="p-2">{item}</td>
                          {['adequate', 'non-existing', 'requires-improvement', 'urgently-required'].map((status) => (
                            <td key={status} className="text-center p-2">
                              <input
                                type="radio"
                                name={item.toLowerCase().replace(/\s+/g, '-')}
                                value={status}
                                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* EMD's Rating Section */}
              <section className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4">
                  EMD's rating of the Proposal
                  <span className="text-red-500 ml-1">*</span>
                </h3>
                <div className="flex items-center justify-center space-x-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                    <div key={value} className="flex flex-col items-center">
                      <input
                        type="radio"
                        id={`emd-rating-${value}`}
                        name="emd-rating"
                        value={value}
                        required
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <label
                        htmlFor={`emd-rating-${value}`}
                        className="mt-2 text-sm text-gray-600"
                      >
                        {value}
                      </label>
                    </div>
                  ))}
                </div>
              </section>

              {/* Comments Section */}
              <section className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4">
                  Comments
                  <span className="text-red-500 ml-1">*</span>
                </h3>
                <div>
                  <textarea
                    name="comments"
                    required
                    rows={4}
                    placeholder="Long answer text"
                    className="w-full p-2 border rounded resize-y"
                  />
                </div>
              </section>
            </div>
          );
        case 7:
          return (
            <div>
              <section className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-xl font-semibold mb-4">Safety & Emergency</h2>
                  <div className="space-y-4">
                  </div>
              </section>

              <section className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4">Safety & Emergency: The following have been addressed:</h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="text-left p-2"></th>
                        <th className="text-center p-2">Adequate</th>
                        <th className="text-center p-2">Non Existing</th>
                        <th className="text-center p-2">Requires improvement</th>
                        <th className="text-center p-2">Urgently required</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        'Waste Management Plan',
                        'Waste Management: Special Provisions',
                        'Pest Management',
                        'Hurricane Protection',
                        'Seismic Rating',
                        'Fire Safety System',
                        'Emergency Exits',
                        'Aircraft lighting (beacons)',
                        'Back-up Power Supply',
                        'Back-up Water Supply',
                        'Elevators (3 stories or more)',
                        'Elevator capacity size'
                      ].map((item) => (
                        <tr key={item} className="border-t">
                          <td className="p-2">{item}</td>
                          {['adequate', 'non-existing', 'requires-improvement', 'urgently-required'].map((status) => (
                            <td key={status} className="text-center p-2">
                              <input
                                type="radio"
                                name={item.toLowerCase().replace(/\s+/g, '-')}
                                value={status}
                                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
                    
              <section className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4">
                  Safety & Emergency's rating of the Proposal
                  <span className="text-red-500 ml-1">*</span>
                </h3>
                <div className="flex items-center justify-center space-x-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                    <div key={value} className="flex flex-col items-center">
                      <input
                        type="radio"
                        id={`safety-rating-${value}`}
                        name="safety-rating"
                        value={value}
                        required
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <label
                        htmlFor={`safety-rating-${value}`}
                        className="mt-2 text-sm text-gray-600"
                      >
                        {value}
                      </label>
                    </div>
                  ))}
                </div>
              </section>

              {/* Comments Section */}
              <section className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4">
                  Comments
                  <span className="text-red-500 ml-1">*</span>
                </h3>
                <div>
                  <textarea
                    name="comments"
                    required
                    rows={4}
                    placeholder="Long answer text"
                    className="w-full p-2 border rounded resize-y"
                  />
                </div>
              </section>

            </div>
          );
          case 8:
            return (
              <div>
              <section className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-xl font-semibold mb-4">MITS</h2>
                  <div className="space-y-4">
                    <div>
                      <input 
                        type="text" 
                        required
                        className="w-full p-2 border rounded"
                        placeholder="Mona Information Technology Services"
                        readOnly
                      />
                    </div>
                  </div>
              </section>

              {/* ICT/MIS Requirements Table Section */}
              <section className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4">ICT/MIS Requirements</h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="text-left p-2"></th>
                        <th className="text-center p-2">Adequate</th>
                        <th className="text-center p-2">Non Existing</th>
                        <th className="text-center p-2">Requires improvement</th>
                        <th className="text-center p-2">Urgently required</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        'Data',
                        'VOIP',
                        'Multimedia',
                        'Access Control',
                        'UPS',
                        'Networking',
                        'Building Intelligence',
                        'MITS Report attached'
                      ].map((item) => (
                        <tr key={item} className="border-t">
                          <td className="p-2">{item}</td>
                          {['adequate', 'non-existing', 'requires-improvement', 'urgently-required'].map((status) => (
                            <td key={status} className="text-center p-2">
                              <input
                                type="radio"
                                name={item.toLowerCase().replace(/\s+/g, '-')}
                                value={status}
                                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* MITS Rating Section */}
              <section className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4">
                  MITS' rating of the Proposal
                  <span className="text-red-500 ml-1">*</span>
                </h3>
                <div className="flex items-center justify-center space-x-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                    <div key={value} className="flex flex-col items-center">
                      <input
                        type="radio"
                        id={`mits-rating-${value}`}
                        name="mits-rating"
                        value={value}
                        required
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <label
                        htmlFor={`mits-rating-${value}`}
                        className="mt-2 text-sm text-gray-600"
                      >
                        {value}
                      </label>
                    </div>
                  ))}
                </div>
              </section>

              {/* Comments Section */}
              <section className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4">
                  Comments
                  <span className="text-red-500 ml-1">*</span>
                </h3>
                <div>
                  <textarea
                    name="comments"
                    required
                    rows={4}
                    placeholder="Long answer text"
                    className="w-full p-2 border rounded resize-y"
                  />
                </div>
              </section>
              
              

              </div>
            );
        case 9:
          return (
            <div>
              <section className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-xl font-semibold mb-4">Human Res Mgt Div</h2>
              </section>

              <section className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4">Compliance: Nature and Extent of Compliance/Standard Requirements</h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="text-left p-2"></th>
                        <th className="text-center p-2">Adequate</th>
                        <th className="text-center p-2">Non Existing</th>
                        <th className="text-center p-2">Requires improvement</th>
                        <th className="text-center p-2">Urgently required</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        'Safety Standards',
                        'Lighting',
                        'Ventilation (Exhaust)',
                        'Environmental Standards',
                        'Master Plan',
                        'Maintenance Policy',
                        'Renewable Energy',
                        'National Building Code',
                        'Factories Act',
                        'OSHA',
                        'ADA'
                      ].map((item) => (
                        <tr key={item} className="border-t">
                          <td className="p-2">{item}</td>
                          {['adequate', 'non-existing', 'requires-improvement', 'urgently-required'].map((status) => (
                            <td key={status} className="text-center p-2">
                              <input
                                type="radio"
                                name={item.toLowerCase().replace(/\s+/g, '-')}
                                value={status}
                                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Human Resources Management Division Rating Section */}
              <section className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4">
                  Human Res Mgt Div
                  <span className="text-red-500 ml-1">*</span>
                </h3>
                <div className="flex items-center justify-center space-x-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                    <div key={value} className="flex flex-col items-center">
                      <input
                        type="radio"
                        id={`hr-rating-${value}`}
                        name="hr-rating"
                        value={value}
                        required
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <label
                        htmlFor={`hr-rating-${value}`}
                        className="mt-2 text-sm text-gray-600"
                      >
                        {value}
                      </label>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4">
                  Comments
                  <span className="text-red-500 ml-1">*</span>
                </h3>
                <div>
                  <textarea
                    name="comments"
                    required
                    rows={4}
                    placeholder="Long answer text"
                    className="w-full p-2 border rounded resize-y"
                  />
                </div>
              </section>

            </div>
          );
        case 10:
          return(
            <div>
              <section className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-xl font-semibold mb-4">BDO</h2>
                  <div className="space-y-4">
                    <div>
                      <input 
                        type="text" 
                        required
                        className="w-full p-2 border rounded"
                        placeholder="Business Development Office"
                        readOnly
                      />
                    </div>
                  </div>
              </section>

              <section className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-xl font-semibold mb-4">BUDGET</h2>
                  <div className="space-y-4">
                    <div>
                      <input 
                        type="text" 
                        required
                        className="w-full p-2 border rounded"
                        placeholder="The following budget line items are included to Standard Rates or below:"
                        readOnly
                      />
                    </div>
                  </div>
              </section>

              {/* Financial Metrics Table Section */}
              <section className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4">Financial Metrics</h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="text-left p-2"></th>
                        <th className="text-center p-2">low risk</th>
                        <th className="text-center p-2">adequate</th>
                        <th className="text-center p-2">healthy</th>
                        <th className="text-center p-2">high risk</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        'Return on Investment',
                        'Return On Assets',
                        'Maintainability',
                        'Financial justification'
                      ].map((item) => (
                        <tr key={item} className="border-t">
                          <td className="p-2">{item}</td>
                          {['low-risk', 'adequate', 'healthy', 'high-risk'].map((status) => (
                            <td key={status} className="text-center p-2">
                              <input
                                type="radio"
                                name={item.toLowerCase().replace(/\s+/g, '-')}
                                value={status}
                                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Capital Expenditure Section */}
              <section className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4">
                  State the estimated Capital Expenditure of the Project ( JMD$ or USD$)
                  <span className="text-red-500 ml-1">*</span>
                </h3>
                <div>
                  <input 
                    type="text"
                    required
                    placeholder="Short answer text"
                    className="w-full p-2 border rounded"
                  />
                </div>
              </section>

              {/* Market Demand Section */}
              <section className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4">
                  Evidence of market demand and/or inadequate supply of service/product? State briefly.
                </h3>
                <div>
                  <input 
                    type="text"
                    placeholder="Short answer text"
                    className="w-full p-2 border rounded"
                  />
                </div>
              </section>

              {/* Cost/Benefit Description Section */}
              <section className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4">
                  Is there a description (cost/benefit of dollar terms (JMD $ or USD $) of the Project for the campus?
                  <span className="text-red-500 ml-1">*</span>
                </h3>
                <div className="space-y-2">
                  {['Yes', 'No'].map((option) => (
                    <label key={option} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="cost-benefit"
                        value={option.toLowerCase()}
                        required
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </section>

              {/* BDO Rating Section */}
              <section className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4">
                  BDO's RATING of the PROPOSAL
                  <span className="text-red-500 ml-1">*</span>
                </h3>
                <div className="flex items-center justify-center space-x-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                    <div key={value} className="flex flex-col items-center">
                      <input
                        type="radio"
                        id={`bdo-rating-${value}`}
                        name="bdo-rating"
                        value={value}
                        required
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <label
                        htmlFor={`bdo-rating-${value}`}
                        className="mt-2 text-sm text-gray-600"
                      >
                        {value}
                      </label>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4">
                  Comments
                  <span className="text-red-500 ml-1">*</span>
                </h3>
                <div>
                  <textarea
                    name="comments"
                    required
                    rows={4}
                    placeholder="Long answer text"
                    className="w-full p-2 border rounded resize-y"
                  />
                </div>
              </section>
            </div>
          );
        case 11:
          return(
            <div>
              <section className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-xl font-semibold mb-4">Cost/ Benefit to the UWI</h2>
              </section>

              <section className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4">State briefly cost/benefit to the UWI.</h3>
                <div>
                  <input 
                    type="text"
                    placeholder="Short answer text"
                    className="w-full p-2 border rounded"
                  />
                </div>
              </section>

              {/* Cost/Benefit Document Attachment Section */}
              <section className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4">
                  Also, please state if cost/benefit description was attached with project documents
                </h3>
                <div>
                  <select 
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Select an option</option>
                    <option value="yes">1. Yes</option>
                    <option value="to-be-added">2. No (To be added)</option>
                    <option value="not-available">3. No (not currently available)</option>
                  </select>
                </div>
              </section>

              {/* Reason if No Section */}
              <section className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4">If No, please state reason(s).</h3>
                <div>
                  <textarea
                    placeholder="Long answer text"
                    rows={4}
                    className="w-full p-2 border rounded resize-y"
                  />
                </div>
              </section>
            </div>
          );
        case 12:
          return (
            <div>
              <section className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">CP</h2>
                    <div className="space-y-4">
                      <div>
                        <input 
                          type="text" 
                          required
                          className="w-full p-2 border rounded"
                          placeholder="Campus Project Office"
                          readOnly
                        />
                      </div>
                    </div>
              </section>

              {/* Project Preparation Details Section */}
              <section className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4">
                  Details of the nature of the project preparation
                  <span className="text-red-500 ml-1">*</span>
                </h3>
                <div className="space-y-3">
                  {[
                    'Project Business Case',
                    'Project Charter',
                    'Project Brief',
                    'project scope',
                    'RACI Matrix charts who is Responsible, who is Accountable, who is Consulted, and who is Informed',
                    'project programme or schedule',
                    'Work Breakdown Structure (WBS)',
                    'Risks Analysis',
                    'Stakeholder Analysis',
                    'Approval notification',
                    'Project Status Form'
                  ].map((item) => (
                    <label key={item} className="flex items-center space-x-3">
                      <input 
                        type="checkbox" 
                        name="project_preparation" 
                        value={item.toLowerCase().replace(/\s+/g, '-')}
                        className="h-5 w-5 border-gray-300 rounded"
                      />
                      <span className="text-gray-700">{item}</span>
                    </label>
                  ))}
                </div>
              </section>

              {/* Consultants Fees Section */}
              <section className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4">
                  Consultants Fees : Standard Rates - Architects: 4 – 6% Q.S.:2.5 – 4% CEng: 1.5% MEP: 1.5%
                </h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="text-left p-2"></th>
                        <th className="text-center p-2">Adequate</th>
                        <th className="text-center p-2">Non Required</th>
                        <th className="text-center p-2">Slightly overpriced</th>
                        <th className="text-center p-2">HIGH: Urgently review</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        'Architects',
                        'Quantity Surveyor',
                        'Civil / Structural',
                        'MEP Engineer',
                        'Special Consultant',
                        'Internal Assessment',
                        'External Assessment'
                      ].map((item) => (
                        <tr key={item} className="border-t">
                          <td className="p-2">{item}</td>
                          {['adequate', 'non-required', 'slightly-overpriced', 'high-urgent-review'].map((status) => (
                            <td key={status} className="text-center p-2">
                              <input
                                type="radio"
                                name={item.toLowerCase().replace(/\s+/g, '-')}
                                value={status}
                                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Construction Large Projects Section */}
              <section className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4">
                  Construction – Large Projects : Standard - Labour : 27.5%; Material : 55% Plant & Equipment: 4.5% Overheads & Profit: 10%
                </h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="text-left p-2"></th>
                        <th className="text-center p-2">Adequate</th>
                        <th className="text-center p-2">Non Required</th>
                        <th className="text-center p-2">Slightly overpriced</th>
                        <th className="text-center p-2">HIGH: Urgently review</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        'Labour',
                        'Material',
                        'Plant & Equipment',
                        'Overheads & Profit'
                      ].map((item) => (
                        <tr key={item} className="border-t">
                          <td className="p-2">{item}</td>
                          {['adequate', 'non-required', 'slightly-overpriced', 'high-urgent-review'].map((status) => (
                            <td key={status} className="text-center p-2">
                              <input
                                type="radio"
                                name={item.toLowerCase().replace(/\s+/g, '-')}
                                value={status}
                                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* CPO Rating Section */}
              <section className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4">
                  CPO's RATING of the PROPOSAL
                  <span className="text-red-500 ml-1">*</span>
                </h3>
                <div className="flex items-center justify-center space-x-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                    <div key={value} className="flex flex-col items-center">
                      <input
                        type="radio"
                        id={`cpo-rating-${value}`}
                        name="cpo-rating"
                        value={value}
                        required
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <label
                        htmlFor={`cpo-rating-${value}`}
                        className="mt-2 text-sm text-gray-600"
                      >
                        {value}
                      </label>
                    </div>
                  ))}
                </div>
              </section>

              {/* Comments Section */}
              <section className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4">
                  Comments
                  <span className="text-red-500 ml-1">*</span>
                </h3>
                <div>
                  <textarea
                    name="comments"
                    required
                    rows={4}
                    placeholder="Long answer text"
                    className="w-full p-2 border rounded resize-y"
                  />
                </div>
              </section>
            </div>
          );
        case 13:
          return (
            <div>
                <div>
                <section className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">Bursary</h2>
                </section>
                </div>

                {/* Financial Provision Section */}
                <section className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-xl font-semibold mb-4">Financial Provision</h3>
                  <div>
                    <input 
                      type="text"
                      placeholder="Short answer text"
                      className="w-full p-2 border rounded"
                    />
                  </div>
                </section>

                {/* Campus Funding Percentage Section */}
                <section className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-xl font-semibold mb-4">
                    What percentage of the funding will be handled by The Campus?
                    <span className="text-red-500 ml-1">*</span>
                  </h3>
                  <div>
                    <input 
                      type="text"
                      required
                      placeholder="Short answer text"
                      className="w-full p-2 border rounded"
                    />
                  </div>
                </section>

                {/* Financial Metrics Table Section */}
                <section className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-xl font-semibold mb-4">Financial Metrics</h3>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr>
                          <th className="text-left p-2"></th>
                          <th className="text-center p-2">low risk</th>
                          <th className="text-center p-2">adequate</th>
                          <th className="text-center p-2">healthy</th>
                          <th className="text-center p-2">high risk</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          'Return on Investment',
                          'Return On Assets',
                          'Maintainability',
                          'Financial justification'
                        ].map((item) => (
                          <tr key={item} className="border-t">
                            <td className="p-2">{item}</td>
                            {['low-risk', 'adequate', 'healthy', 'high-risk'].map((status) => (
                              <td key={status} className="text-center p-2">
                                <input
                                  type="radio"
                                  name={item.toLowerCase().replace(/\s+/g, '-')}
                                  value={status}
                                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Bursary's Rating Section */}
                <section className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-xl font-semibold mb-4">
                    BURSARY's RATING of the PROPOSAL
                    <span className="text-red-500 ml-1">*</span>
                  </h3>
                  <div className="flex items-center justify-center space-x-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                      <div key={value} className="flex flex-col items-center">
                        <input
                          type="radio"
                          id={`bursary-rating-${value}`}
                          name="bursary-rating"
                          value={value}
                          required
                          className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <label
                          htmlFor={`bursary-rating-${value}`}
                          className="mt-2 text-sm text-gray-600"
                        >
                          {value}
                        </label>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Comments Section */}
                <section className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-xl font-semibold mb-4">
                    Comments
                    <span className="text-red-500 ml-1">*</span>
                  </h3>
                  <div>
                    <textarea
                      name="comments"
                      required
                      rows={4}
                      placeholder="Long answer text"
                      className="w-full p-2 border rounded resize-y"
                    />
                  </div>
                </section>
            </div>
          );
        case 14:
          return (
            <div>
                <section className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">Campus Security Office</h2>
                </section>

                {/* Physical Security Section */}
                <section className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-xl font-semibold mb-4">Physical Security</h3>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr>
                          <th className="text-left p-2"></th>
                          <th className="text-center p-2">low risk</th>
                          <th className="text-center p-2">adequate</th>
                          <th className="text-center p-2">healthy</th>
                          <th className="text-center p-2">high risk</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          'Electronic System',
                          'Cameras',
                          'Access Control',
                          'Emergency Response',
                          'Pedestrian',
                          'Vehicular'
                        ].map((item) => (
                          <tr key={item} className="border-t">
                            <td className="p-2">{item}</td>
                            {['low-risk', 'adequate', 'healthy', 'high-risk'].map((status) => (
                              <td key={status} className="text-center p-2">
                                <input
                                  type="radio"
                                  name={item.toLowerCase().replace(/\s+/g, '-')}
                                  value={status}
                                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Outside Contractors Section */}
                <section className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-xl font-semibold mb-4">
                    Will the project be done by outside contractors?
                    <span className="text-red-500 ml-1">*</span>
                  </h3>
                  <div className="space-y-2">
                    {['Yes', 'No', 'Maybe'].map((option) => (
                      <label key={option} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="outside-contractors"
                          value={option.toLowerCase()}
                          required
                          className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </section>

                {/* Hiring on Site Section */}
                <section className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-xl font-semibold mb-4">
                    Will there be hiring on site?
                    <span className="text-red-500 ml-1">*</span>
                  </h3>
                  <div className="space-y-2">
                    {['Yes', 'No', 'Maybe'].map((option) => (
                      <label key={option} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="hiring-on-site"
                          value={option.toLowerCase()}
                          required
                          className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </section>

                {/* Security Risk Assessment Section */}
                <section className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-xl font-semibold mb-4">Security risk assessment</h3>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr>
                          <th className="text-left p-2"></th>
                          <th className="text-center p-2">low risk</th>
                          <th className="text-center p-2">adequate</th>
                          <th className="text-center p-2">healthy</th>
                          <th className="text-center p-2">high risk</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t">
                          <td className="p-2">OVERALL security rating</td>
                          {['low-risk', 'adequate', 'healthy', 'high-risk'].map((status) => (
                            <td key={status} className="text-center p-2">
                              <input
                                type="radio"
                                name="overall-security"
                                value={status}
                                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                              />
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* CSO Rating Section */}
                <section className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-xl font-semibold mb-4">
                    CSO's RATING of the PROPOSAL
                    <span className="text-red-500 ml-1">*</span>
                  </h3>
                  <div className="flex items-center justify-center space-x-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                      <div key={value} className="flex flex-col items-center">
                        <input
                          type="radio"
                          id={`cso-rating-${value}`}
                          name="cso-rating"
                          value={value}
                          required
                          className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <label
                          htmlFor={`cso-rating-${value}`}
                          className="mt-2 text-sm text-gray-600"
                        >
                          {value}
                        </label>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Comments Section */}
                <section className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-xl font-semibold mb-4">
                    Comments
                    <span className="text-red-500 ml-1">*</span>
                  </h3>
                  <div>
                    <textarea
                      name="comments"
                      required
                      rows={4}
                      placeholder="Long answer text"
                      className="w-full p-2 border rounded resize-y"
                    />
                  </div>
                </section>
              </div>
          );
        case 15:
          return(
            <div>
              <section className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Office - Planning & Inst Research</h2>
              </section>

              {/* Project Partner Type Section */}
              <section className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4">
                  1. Is the project with a partner vs commercial entity?
                  <span className="text-red-500 ml-1">*</span>
                </h3>
                <div className="space-y-2">
                  {['Partner', 'Commercial entity', 'Other...'].map((option) => (
                    <label key={option} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="partner-type"
                        value={option.toLowerCase()}
                        required
                        onChange={(e) => setOtherSelection('partnerType', e.target.value.includes('other'))}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                  {renderOtherTextInput('partnerType', 'Enter partner type')}
                </div>
              </section>

              {/* Partners/Investors Section */}
              <section className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4">
                  2. Who are the Partners/ Investors/ commercial entity?
                  <span className="text-red-500 ml-1">*</span>
                </h3>
                <div>
                  <input 
                    type="text"
                    required
                    placeholder="Short answer text"
                    className="w-full p-2 border rounded"
                  />
                </div>
              </section>

              {/* Agreement Type Section */}
              <section className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4">
                  3. What type of agreement is will be in place? Contract vs Letter of understanding vs MOU.
                  <span className="text-red-500 ml-1">*</span>
                </h3>
                <div className="space-y-2">
                  {['Contract', 'Letter of Understanding', 'MOU', 'Other...'].map((option) => (
                    <label key={option} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="agreement-type"
                        value={option.toLowerCase()}
                        required
                        onChange={(e) => setOtherSelection('agreementTypePlanning', e.target.value.includes('other'))}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                  {renderOtherTextInput('agreementTypePlanning', 'Enter agreement type')}
                </div>
              </section>

              {/* Funding Source Section */}
              <section className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4">
                  4. What is the source and terms of Funding?
                  <span className="text-red-500 ml-1">*</span>
                </h3>
                <div>
                  <textarea
                    name="comments"
                    required
                    rows={4}
                    placeholder="Long answer text"
                    className="w-full p-2 border rounded resize-y"
                  />
                </div>
              </section>

              {/* Campus Funding Percentage Section */}
              <section className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4">
                  5. What percentage Funding will be handled by The Campus?
                  <span className="text-red-500 ml-1">*</span>
                </h3>
                <div>
                  <input 
                    type="text"
                    required
                    placeholder="Short answer text"
                    className="w-full p-2 border rounded"
                  />
                </div>
              </section>

              {/* Sponsors Declaration Section */}
              <section className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4">6. Declaration of all Sponsors.</h3>
                <div>
                  <textarea
                    rows={4}
                    placeholder="Long answer text"
                    className="w-full p-2 border rounded resize-y"
                  />
                </div>
              </section>

              {/* Project Source Section */}
              <section className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4">7. Project Source- Solicited vs Unsolicited?</h3>
                <div className="space-y-2">
                  {['Solicited', 'Unsolicited', 'Other...'].map((option) => (
                    <label key={option} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="project-source"
                        value={option.toLowerCase()}
                        onChange={(e) => setOtherSelection('projectSource', e.target.value.includes('other'))}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                  {renderOtherTextInput('projectSource', 'Enter project source')}
                </div>
              </section>

              {/* Utilities Provider Section */}
              <section className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4">8. Who provides utilities for project during each phase?</h3>
                <div>
                  <input 
                    type="text"
                    placeholder="Short answer text"
                    className="w-full p-2 border rounded"
                  />
                </div>
              </section>

              {/* Guarantees/SLA Section */}
              <section className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4">9. Does the project come with Guarantees/SLA?</h3>
                <div className="space-y-2">
                  {['Yes', 'No', 'Maybe'].map((option) => (
                    <label key={option} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="guarantees-sla"
                        value={option.toLowerCase()}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </section>

              {/* Guarantees Details Section */}
              <section className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4">9a. If yes, state below.</h3>
                <div>
                  <textarea
                    rows={4}
                    placeholder="Long answer text"
                    className="w-full p-2 border rounded resize-y"
                  />
                </div>
              </section>

              {/* Maintenance Services Section */}
              <section className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4">10. Who provides maintenance services?</h3>
                <div className="space-y-2">
                  {['Option 1'].map((option) => (
                    <label key={option} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="maintenance-services"
                        value={option.toLowerCase()}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </section>

              {/* Operations Management Section */}
              <section className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4">11. Who manages operations?</h3>
                <div>
                  <input 
                    type="text"
                    placeholder="Short answer text"
                    className="w-full p-2 border rounded"
                  />
                </div>
              </section>

              {/* Planning & Research Rating Section */}
              <section className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4">
                  Campus Legal Office rating of the proposal.
                  <span className="text-red-500 ml-1">*</span>
                </h3>
                <div className="flex items-center justify-center space-x-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                    <div key={value} className="flex flex-col items-center">
                      <input
                        type="radio"
                        id={`planning-rating-${value}`}
                        name="planning-rating"
                        value={value}
                        required
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <label
                        htmlFor={`planning-rating-${value}`}
                        className="mt-2 text-sm text-gray-600"
                      >
                        {value}
                      </label>
                    </div>
                  ))}
                </div>
              </section>

              {/* Comments Section */}
              <section className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4">
                  Comments
                  <span className="text-red-500 ml-1">*</span>
                </h3>
                <div>
                  <textarea
                    name="comments"
                    required
                    rows={4}
                    placeholder="Long answer text"
                    className="w-full p-2 border rounded resize-y"
                  />
                </div>
              </section>
            </div>
          );

        case 16:
          return(
            <div>
              <section className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Campus Legal Office</h2>
              </section>

              {/* Agreement Type Section */}
              <section className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4">
                  What type of agreement is will be in place? Contract vs Letter of understanding vs MOU.
                  <span className="text-red-500 ml-1">*</span>
                </h3>
                <div className="space-y-2">
                  {['Contract', 'Letter of Understanding', 'MOU', 'Other...'].map((option) => (
                    <label key={option} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="agreement-type"
                        value={option.toLowerCase()}
                        required
                        onChange={(e) => setOtherSelection('agreementTypeClo', e.target.value.includes('other'))}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                  {renderOtherTextInput('agreementTypeClo', 'Enter agreement type')}
                </div>
              </section>

              {/* CLO Rating Section */}
              <section className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4">
                  CLO's RATING of the PROPOSAL
                  <span className="text-red-500 ml-1">*</span>
                </h3>
                <div className="flex items-center justify-center space-x-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                    <div key={value} className="flex flex-col items-center">
                      <input
                        type="radio"
                        id={`clo-rating-${value}`}
                        name="clo-rating"
                        value={value}
                        required
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <label
                        htmlFor={`clo-rating-${value}`}
                        className="mt-2 text-sm text-gray-600"
                      >
                        {value}
                      </label>
                    </div>
                  ))}
                </div>
              </section>

              {/* Comments Section */}
              <section className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4">
                  Comments
                  <span className="text-red-500 ml-1">*</span>
                </h3>
                <div>
                  <textarea
                    name="comments"
                    required
                    rows={4}
                    placeholder="Long answer text"
                    className="w-full p-2 border rounded resize-y"
                  />
                </div>
              </section>
            </div>
          );

        case 17:
          return (
            <div>
              <section className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Secretariat</h2>
              </section>
              
              {/* Weighted Average Section */}
              <section className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4">Weighted Average from DEPARTMENTS</h3>
                <div className="flex items-center justify-center space-x-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                    <div key={value} className="flex flex-col items-center">
                      <input
                        type="radio"
                        id={`weighted-avg-${value}`}
                        name="weighted-average"
                        value={value}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <label
                        htmlFor={`weighted-avg-${value}`}
                        className="mt-2 text-sm text-gray-600"
                      >
                        {value}
                      </label>
                    </div>
                  ))}
                </div>
              </section>

              {/* Overall Proposal Score Section */}
              <section className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4">Overall Proposal Score (Chair & Secretariat)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="text-left p-2"></th>
                        <th className="text-center p-2">Approved ({'>'}70%)</th>
                        <th className="text-center p-2">Tentatively Accepted: Requires minor improvement (55-69)</th>
                        <th className="text-center p-2">Tentatively Accepted: Requires further presentation (41-54%)</th>
                        <th className="text-center p-2">Rejected ({'<'}40%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-2">The Proposal is</td>
                        {['approved', 'tentatively-accepted-1', 'tentatively-accepted-2', 'rejected'].map((status) => (
                          <td key={status} className="text-center p-2">
                            <input
                              type="radio"
                              name="proposal-score"
                              value={status}
                              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Comments Section */}
              <section className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4">
                  Comments
                  <span className="text-red-500 ml-1">*</span>
                </h3>
                <div>
                  <textarea
                    name="comments"
                    required
                    rows={4}
                    placeholder="Long answer text"
                    className="w-full p-2 border rounded resize-y"
                  />
                </div>
              </section>

            </div>
          );
        default:
          return null;
      }
    };

    return (
      <div className="tec-content-wrap mx-auto max-w-[1120px] space-y-6">
        <div className="rounded-2xl border border-[#d9d5cd] bg-white px-5 py-4 shadow-[0_6px_24px_rgba(24,39,75,0.08)] sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-xl border border-[#ddd8d1] bg-[#f8f6f3] p-2">
                {/* <Image
                  src="/uwi-logo.png"
                  alt="The University of the West Indies logo"
                  width={48}
                  height={48}
                  priority
                  className="h-12 w-auto object-contain"
                /> */}
              </div>
              <div>
                {/* <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9a2a25]">Audit Workspace</p> */}
                <h1 className="text-xl font-bold text-[#1f2a44] sm:text-2xl">TEC Proposal Assessment Form</h1>
              </div>
            </div>
            <div className="rounded-xl border border-[#ddd8d1] bg-[#f6f4f1] px-4 py-3 text-sm text-[#58647a]">
              <span className="font-semibold text-[#2a3550]">Step {currentStep}</span> of {totalSteps}
            </div>
          </div>

          {/* Progress indicator */}
          <div className="mt-4 flex items-center gap-4">
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#e5e2db]">
              <div
                className="h-full rounded-full bg-[#991b1e] transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              ></div>
            </div>
            <div className="text-xs font-semibold text-[#6a7388]">
              {Math.round((currentStep / totalSteps) * 100)}% complete
            </div>
          </div>
        </div>

        <form className="tec-form space-y-6" onSubmit={(e) => e.preventDefault()} onChange={handleDepartmentFieldChange}>
          {renderSection()}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#d9d5cd] bg-white px-4 py-4 shadow-[0_4px_18px_rgba(24,39,75,0.06)]">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="inline-flex items-center gap-2 rounded-xl border border-[#c8c2b8] bg-white px-4 py-2.5 text-sm font-semibold text-[#2f3a54] transition hover:border-[#9a2a25] hover:text-[#9a2a25]"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
            )}

            <button
              type="button"
              onClick={saveFormData}
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-xl border border-[#d6d2ca] bg-[#f4f2ef] px-4 py-2.5 text-sm font-semibold text-[#2f3a54] transition hover:border-[#9a2a25] hover:text-[#9a2a25] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </button>

            {currentStep === totalSteps && (
              <button
                type="button"
                onClick={exportAsPdf}
                disabled={isSaving || isExportingPdf}
                className="inline-flex items-center gap-2 rounded-xl border border-[#d6d2ca] bg-white px-4 py-2.5 text-sm font-semibold text-[#2f3a54] transition hover:border-[#9a2a25] hover:text-[#9a2a25] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FileDown className="h-4 w-4" />
                {isExportingPdf ? 'Preparing PDF...' : 'Export PDF'}
              </button>
            )}

            {/* Show 'Next' only on steps 1–5; show 'Submit & Save' on department/Secretariat steps (6–17) */}
            {currentStep <= 5 && (
              <button
                type="button"
                onClick={nextStep}
                className={`${currentStep === 1 ? 'ml-auto' : ''} inline-flex items-center gap-2 rounded-xl bg-[#991b1e] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#7f1719]`}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
            {currentStep >= 6 && currentStep <= totalSteps && (
              <button
                type="button"
                onClick={submitForm}
                className="inline-flex items-center gap-2 rounded-xl bg-[#991b1e] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#7f1719]"
              >
                <Send className="h-4 w-4" />
                 Save & Submit
              </button>
            )}
          </div>

          {saveStatus && (
            <div className={`rounded-xl border p-3 text-sm font-medium ${saveStatus.includes('successfully') ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
              {saveStatus}
            </div>
          )}
        </form>
      </div>
    );
}
