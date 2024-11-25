"use client";
import { useState } from 'react';

export default function TECAssessmentForm() {
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 4; // We'll increase this as we add more steps

    const nextStep = () => {
        setCurrentStep(currentStep + 1);
    };

    const prevStep = () => {
        setCurrentStep(currentStep - 1);
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
                      placeholder="Contact Name"
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
                          <input type="radio" name="title" value={title} />
                          <span>{title}</span>
                        </label>
                      ))}
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
                        ].map((row) => (
                          <tr key={row}>
                              <td className="p-2">{row}</td>
                              <td className="text-center p-2">
                                  <input type="checkbox" className="h-4 w-4"/>
                              </td>
                              <td className="text-center p-2">
                                  <input type="checkbox" className="h-4 w-4"/>
                              </td>
                              <td className="text-center p-2">
                                  <input type="checkbox" className="h-4 w-4"/>
                              </td>
                          </tr>
                        ))}
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
                        className="h-5 w-5 border-gray-300 rounded"
                      />
                      <span className="text-gray-700">{utility}</span>
                    </label>
                  ))}
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
                        className="h-5 w-5 border-gray-300 rounded"
                      />
                      <span className="text-gray-700">{item}</span>
                    </label>
                  ))}
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
                        className="h-5 w-5 border-gray-300 rounded"
                      />
                      <span className="text-gray-700">{item}</span>
                    </label>
                  ))}
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
                        className="h-5 w-5 border-gray-300 rounded"
                      />
                      <span className="text-gray-700">{item}</span>
                    </label>
                  ))}
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

        case 4:
          return (
            <div>
              <section className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-xl font-semibold mb-4">Reviewing Department</h2>
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
                        className="h-5 w-5 border-gray-300"
                      />
                      <span className="text-gray-700">{dept}</span>
                    </label>
                  ))}
                </div>
            </section>

            </div>
          );
        default:
          return null;
      }
    };

    return (
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <h1 className="text-2xl font-bold">TEC PROPOSAL ASSESSMENT FORM</h1>
        
        {/* Progress indicator */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-gray-600">
            Step {currentStep} of {totalSteps}
          </div>
          <div className="w-2/3 h-2 bg-gray-200 rounded-full">
            <div 
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>
        
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          {renderSection()}
          
          <div className="flex justify-between mt-6">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
              >
                Previous
              </button>
            )}
            
            <button
              type="button"
              onClick={currentStep === totalSteps ? () => console.log('Form submitted!') : nextStep}
              className={`${currentStep === 1 ? 'ml-auto' : ''} bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600`}
          >
              {currentStep === totalSteps ? 'Submit' : 'Next'}
            </button>
          </div>
        </form>
      </div>
    );
}