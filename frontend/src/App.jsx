import { useEffect, useState } from 'react'
import './App.css'

const API_BASE_URL = 'http://localhost:8000/api'

const navigation = [
  'Dashboard',
  'Surveys',
  'Questionnaires',
  'Data Collection',
  'Households',
  'Respondents',
  'Validation',
  'Data Cleaning',
  'Analysis',
  'Reports',
  'Users',
  'Settings',
]

const metrics = [
  { label: 'Total Surveys', value: '12', note: 'Active surveys' },
  { label: 'Total Households', value: '5,000', note: 'All time' },
  { label: 'Total Respondents', value: '18,420', note: 'All time' },
  { label: 'Completed Interviews', value: '15,230', note: '82.7% completion' },
  { label: 'Data Quality Score', value: '92%', note: 'Good' },
]

const districts = [
  { name: 'Kampala', value: 88 },
  { name: 'Wakiso', value: 72 },
  { name: 'Mukono', value: 49 },
  { name: 'Masaka', value: 39 },
  { name: 'Mbarara', value: 34 },
  { name: 'Gulu', value: 24 },
  { name: 'Others', value: 39 },
]

const dashboardSurveys = [
  ['Household Socio-Economic Survey 2025', '01 May 2025', 'Active'],
  ['ICT Access and Usage Survey', '10 Apr 2025', 'Active'],
  ['Agricultural Practices Survey', '20 Mar 2025', 'Completed'],
  ['Education Statistics Survey 2025', '01 Feb 2025', 'Completed'],
]

const activities = [
  ['Added 150 new respondents', 'Data Collection', 'John Doe', '19 May 2025 10:30 AM'],
  ['Validated 500 records', 'Validation', 'Jane Smith', '19 May 2025 09:45 AM'],
  ['Exported analysis report', 'Reports', 'John Doe', '18 May 2025 04:22 PM'],
  ['Created new questionnaire', 'Questionnaire', 'Mary N.', '18 May 2025 11:05 AM'],
]

const surveyRows = [
  ['Household Socio-Economic Survey 2025', 'Household', '01 May 2025', '30 Jun 2025', 'Active'],
  ['ICT Access and Usage Survey', 'ICT', '10 Apr 2025', '31 May 2025', 'Active'],
  ['Agricultural Practices Survey', 'Agriculture', '20 Mar 2025', '20 Apr 2025', 'Completed'],
  ['Education Statistics Survey 2025', 'Education', '01 Feb 2025', '28 Feb 2025', 'Completed'],
  ['Health Facility Assessment Survey', 'Health', '15 Jan 2025', '15 Feb 2025', 'Completed'],
]

const questionTypes = [
  'Text (Short)',
  'Text (Long)',
  'Number',
  'Single Choice',
  'Multiple Choice',
  'Date',
  'Yes / No',
  'Dropdown',
]

function MetricCard({ label, value, note }) {
  return (
    <article className="metric-card">
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{note}</span>
    </article>
  )
}

function Dashboard() {
  return (
    <>
      <section className="metric-grid" aria-label="Survey summary">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className="dashboard-grid">
        <article className="panel district-panel">
          <h3>Respondents by District</h3>
          <div className="bar-chart">
            {districts.map((district) => (
              <div className="bar-column" key={district.name}>
                <div className="bar-track">
                  <div className="bar" style={{ height: `${district.value}%` }} />
                </div>
                <span>{district.name}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <h3>Gender Distribution</h3>
          <div className="donut-content">
            <div className="donut gender-donut" role="img" aria-label="Female 50.6%, Male 49.4%" />
            <ul className="legend">
              <li><span className="legend-dot male" />Male <strong>9,102 (49.4%)</strong></li>
              <li><span className="legend-dot female" />Female <strong>9,318 (50.6%)</strong></li>
              <li><span className="legend-dot other" />Other <strong>0 (0%)</strong></li>
            </ul>
          </div>
        </article>

        <article className="panel">
          <h3>Interviews by Status</h3>
          <div className="donut-content">
            <div className="donut status-donut" role="img" aria-label="Completed 82.7%, in progress 12%, not started 5.3%" />
            <ul className="legend">
              <li><span className="legend-dot completed" />Completed <strong>15,230 (82.7%)</strong></li>
              <li><span className="legend-dot progress" />In Progress <strong>2,210 (12%)</strong></li>
              <li><span className="legend-dot not-started" />Not Started <strong>980 (5.3%)</strong></li>
            </ul>
          </div>
        </article>

        <article className="panel">
          <h3>Urban / Rural</h3>
          <div className="donut-content">
            <div className="donut area-donut" role="img" aria-label="Urban 51.3%, Rural 48.7%" />
            <ul className="legend">
              <li><span className="legend-dot urban" />Urban <strong>9,450 (51.3%)</strong></li>
              <li><span className="legend-dot rural" />Rural <strong>8,970 (48.7%)</strong></li>
            </ul>
          </div>
        </article>

        <article className="panel recent-surveys">
          <h3>Recent Surveys</h3>
          <table>
            <thead>
              <tr><th>Survey Name</th><th>Start Date</th><th>Status</th></tr>
            </thead>
            <tbody>
              {dashboardSurveys.map(([name, date, status]) => (
                <tr key={name}><td>{name}</td><td>{date}</td><td>{status}</td></tr>
              ))}
            </tbody>
          </table>
          <button className="text-button" type="button">View all surveys →</button>
        </article>

        <article className="panel activity-panel">
          <h3>Recent Activities</h3>
          <div className="table-scroll">
            <table>
              <thead>
                <tr><th>Activity</th><th>Module</th><th>User</th><th>Date &amp; Time</th></tr>
              </thead>
              <tbody>
                {activities.map(([activity, module, user, date]) => (
                  <tr key={activity}>
                    <td>{activity}</td><td>{module}</td><td>{user}</td><td>{date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </>
  )
}

function SurveyManagement() {
  const [search, setSearch] = useState('')
  const [surveys, setSurveys] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [selectedDetails, setSelectedDetails] = useState(null)
  const [form, setForm] = useState({
    name: '',
    survey_type: 'household',
    description: '',
    start_date: '',
    end_date: '',
    status: 'draft',
  })

  function getCsrfToken() {
    const cookie = document.cookie.split('; ').find((item) => item.startsWith('csrftoken='))
    return cookie ? decodeURIComponent(cookie.slice('csrftoken='.length)) : ''
  }

  function formatLabel(value) {
    return value ? value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) : '—'
  }

  function formatDate(value) {
    if (!value) return '—'
    const [year, month, day] = value.split('-')
    return `${day} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][Number(month) - 1]} ${year}`
  }

  async function loadSurveys() {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${API_BASE_URL}/surveys/`, {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || `Could not load surveys (HTTP ${response.status}).`)
      }
      setSurveys(data.map((survey) => ({
        ...survey,
        typeLabel: formatLabel(survey.survey_type),
        statusLabel: formatLabel(survey.status),
        startDateLabel: formatDate(survey.start_date),
        endDateLabel: formatDate(survey.end_date),
      })))
    } catch (requestError) {
      setError(`${requestError.message} Check that Django is running and that CORS is configured.`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSurveys()
  }, [])

  function updateForm(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function openNewSurveyForm() {
    setEditingId(null)
    setForm({ name: '', survey_type: 'household', description: '', start_date: '', end_date: '', status: 'draft' })
    setShowForm(true)
    setMessage('')
  }

  function openEditSurveyForm(survey) {
    setEditingId(survey.id)
    setForm({
      name: survey.name,
      survey_type: survey.survey_type,
      description: survey.description || '',
      start_date: survey.start_date || '',
      end_date: survey.end_date || '',
      status: survey.status,
    })
    setShowForm(true)
    setMessage('')
  }

  async function saveSurvey(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    const method = editingId ? 'PATCH' : 'POST'

    try {
      const response = await fetch(
        editingId ? `${API_BASE_URL}/surveys/${editingId}/` : `${API_BASE_URL}/surveys/`,
        {
          method,
          credentials: 'include',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken(),
          },
          body: JSON.stringify({
            ...form,
            start_date: form.start_date || null,
            end_date: form.end_date || null,
          }),
        },
      )
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || JSON.stringify(data))
      }
      setShowForm(false)
      setEditingId(null)
      setMessage(method === 'POST' ? 'Survey created successfully.' : 'Survey updated successfully.')
      await loadSurveys()
    } catch (requestError) {
      setError(`${requestError.message} Sign in to Django at http://localhost:8000/admin/ and try again.`)
    } finally {
      setSaving(false)
    }
  }

  async function deleteSurvey(survey) {
    if (!window.confirm(`Delete “${survey.name}”?`)) return
    setError('')
    setMessage('')
    try {
      const response = await fetch(`${API_BASE_URL}/surveys/${survey.id}/`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'X-CSRFToken': getCsrfToken() },
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || `Could not delete survey (HTTP ${response.status}).`)
      }
      setMessage('Survey deleted successfully.')
      setSelectedDetails(null)
      await loadSurveys()
    } catch (requestError) {
      setError(`${requestError.message} Sign in to Django at http://localhost:8000/admin/ and try again.`)
    }
  }

  const visibleSurveys = surveys.filter((survey) =>
    `${survey.name} ${survey.typeLabel} ${survey.statusLabel} ${survey.description}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  )

  return (
    <section className="panel survey-management">
      <div className="survey-toolbar">
        <input
          type="search"
          placeholder="Search surveys..."
          aria-label="Search surveys"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <button className="primary-button" type="button" onClick={openNewSurveyForm}>
          + New Survey
        </button>
      </div>

      {error && <p role="alert" style={{ margin: '0 0 12px', color: '#a33b36', fontSize: '12px' }}>{error}</p>}
      {message && <p role="status" style={{ margin: '0 0 12px', color: '#36714a', fontSize: '12px' }}>{message}</p>}

      {showForm && (
        <form onSubmit={saveSurvey} className="panel" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px', marginBottom: '16px', padding: '16px', background: '#f8fafb' }}>
          <label style={{ display: 'grid', gap: '6px', color: '#526169', fontSize: '12px' }}>
            Survey name
            <input name="name" required maxLength="200" value={form.name} onChange={updateForm} />
          </label>
          <label style={{ display: 'grid', gap: '6px', color: '#526169', fontSize: '12px' }}>
            Type
            <select name="survey_type" value={form.survey_type} onChange={updateForm}>
              <option value="household">Household</option><option value="ict">ICT</option>
              <option value="agriculture">Agriculture</option><option value="education">Education</option>
              <option value="health">Health</option><option value="other">Other</option>
            </select>
          </label>
          <label style={{ display: 'grid', gap: '6px', color: '#526169', fontSize: '12px' }}>
            Start date
            <input name="start_date" type="date" value={form.start_date} onChange={updateForm} />
          </label>
          <label style={{ display: 'grid', gap: '6px', color: '#526169', fontSize: '12px' }}>
            End date
            <input name="end_date" type="date" value={form.end_date} onChange={updateForm} />
          </label>
          <label style={{ display: 'grid', gap: '6px', color: '#526169', fontSize: '12px' }}>
            Status
            <select name="status" value={form.status} onChange={updateForm}>
              <option value="draft">Draft</option><option value="active">Active</option>
              <option value="completed">Completed</option><option value="archived">Archived</option>
            </select>
          </label>
          <label style={{ display: 'grid', gap: '6px', color: '#526169', fontSize: '12px', gridColumn: '1 / -1' }}>
            Description
            <textarea name="description" rows="3" value={form.description} onChange={updateForm} />
          </label>
          <div style={{ display: 'flex', gap: '8px', gridColumn: '1 / -1' }}>
            <button className="primary-button" type="submit" disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Survey'}
            </button>
            <button className="secondary-button" type="button" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      <div className="table-scroll">
        <table>
          <thead>
            <tr><th>Survey Name</th><th>Type</th><th>Start Date</th><th>End Date</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="empty-state">Loading surveys...</td></tr>
            ) : visibleSurveys.map((survey) => (
              <tr key={survey.id}>
                <td>{survey.name}</td>
                <td>{survey.typeLabel}</td>
                <td>{survey.startDateLabel}</td>
                <td>{survey.endDateLabel}</td>
                <td><span className={`status-badge ${survey.status}`}>{survey.statusLabel}</span></td>
                <td className="row-actions">
                  <button type="button" aria-label={`Edit ${survey.name}`} onClick={() => openEditSurveyForm(survey)}>✎</button>
                  <button type="button" aria-label={`View ${survey.name}`} onClick={() => setSelectedDetails(survey)}>◉</button>
                  <button type="button" aria-label={`Delete ${survey.name}`} onClick={() => deleteSurvey(survey)}>⌫</button>
                </td>
              </tr>
            ))}
            {!loading && visibleSurveys.length === 0 && (
              <tr><td colSpan="6" className="empty-state">{search ? 'No matching surveys found.' : 'No surveys yet. Create the first one.'}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <span>Showing {visibleSurveys.length} of {surveys.length} surveys</span>
        <button className="text-button" type="button" onClick={loadSurveys}>Refresh</button>
      </div>

      {selectedDetails && (
        <div className="panel" style={{ marginTop: '16px', padding: '16px', background: '#f8fafb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
            <h3 style={{ margin: 0 }}>{selectedDetails.name}</h3>
            <button className="secondary-button" type="button" onClick={() => setSelectedDetails(null)}>Close</button>
          </div>
          <p style={{ marginTop: '10px', color: '#526169', fontSize: '12px' }}>
            {selectedDetails.description || 'No description provided.'}
          </p>
        </div>
      )}
    </section>
  )
}

function QuestionnaireBuilder() {
  const [selectedSurvey, setSelectedSurvey] = useState(surveyRows[0][0])
  const [activeTab, setActiveTab] = useState('Structure')
  const [selectedQuestion, setSelectedQuestion] = useState(0)
  const [questions, setQuestions] = useState([
    { label: 'District', type: 'Dropdown', required: true, options: ['Central', 'Eastern', 'Northern', 'Western'] },
    { label: 'Parish', type: 'Dropdown', required: true, options: [] },
    { label: 'Village / EA', type: 'Text (Short)', required: true, options: [] },
    { label: 'Name of Household Head', type: 'Text (Short)', required: true, options: [] },
    { label: 'Sex', type: 'Single Choice', required: true, options: ['Male', 'Female'] },
  ])

  const currentQuestion = questions[selectedQuestion]

  function addQuestion(type) {
    const newQuestion = {
      label: `New ${type} question`,
      type,
      required: false,
      options: type === 'Single Choice' || type === 'Multiple Choice' || type === 'Dropdown'
        ? ['Option 1', 'Option 2']
        : [],
    }

    setQuestions((current) => [...current, newQuestion])
    setSelectedQuestion(questions.length)
  }

  function updateQuestion(field, value) {
    setQuestions((current) =>
      current.map((question, index) =>
        index === selectedQuestion ? { ...question, [field]: value } : question,
      ),
    )
  }

  function updateOption(optionIndex, value) {
    const updatedOptions = [...currentQuestion.options]
    updatedOptions[optionIndex] = value
    updateQuestion('options', updatedOptions)
  }

  function addOption() {
    updateQuestion('options', [...currentQuestion.options, `Option ${currentQuestion.options.length + 1}`])
  }

  return (
    <section className="questionnaire-builder">
      <div className="builder-toolbar">
        <div className="builder-tabs" role="tablist" aria-label="Builder view">
          {['Structure', 'Preview', 'Settings'].map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              className={activeTab === tab ? 'selected' : ''}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <select
          aria-label="Select survey"
          value={selectedSurvey}
          onChange={(event) => setSelectedSurvey(event.target.value)}
        >
          {surveyRows.map(([name]) => <option key={name}>{name}</option>)}
        </select>

        <button className="primary-button" type="button">Save</button>
      </div>

      {activeTab === 'Structure' && (
        <div className="builder-columns">
          <aside className="question-types panel">
            <h3>Question Types</h3>
            {questionTypes.map((type) => (
              <button
                type="button"
                className="question-type"
                key={type}
                onClick={() => addQuestion(type)}
              >
                + {type}
              </button>
            ))}
          </aside>

          <div className="question-list panel">
            <h3>Section 1: Household Information</h3>
            {questions.map((question, index) => (
              <button
                type="button"
                key={`${question.label}-${index}`}
                className={`question-row ${selectedQuestion === index ? 'selected' : ''}`}
                onClick={() => setSelectedQuestion(index)}
              >
                <span>Q{index + 1}. {question.label}</span>
                <small>{question.type}</small>
              </button>
            ))}
          </div>

          <aside className="question-settings panel">
            <h3>Question Settings</h3>
            {currentQuestion && (
              <>
                <label>
                  Question Label
                  <input
                    value={currentQuestion.label}
                    onChange={(event) => updateQuestion('label', event.target.value)}
                  />
                </label>

                <label>
                  Type
                  <select
                    value={currentQuestion.type}
                    onChange={(event) => updateQuestion('type', event.target.value)}
                  >
                    {questionTypes.map((type) => <option key={type}>{type}</option>)}
                  </select>
                </label>

                <label className="required-setting">
                  <input
                    type="checkbox"
                    checked={currentQuestion.required}
                    onChange={(event) => updateQuestion('required', event.target.checked)}
                  />
                  Required
                </label>

                {currentQuestion.options.length > 0 && (
                  <div className="option-list">
                    <span>Options</span>
                    {currentQuestion.options.map((option, index) => (
                      <input
                        key={`${selectedQuestion}-${index}`}
                        value={option}
                        aria-label={`Option ${index + 1}`}
                        onChange={(event) => updateOption(index, event.target.value)}
                      />
                    ))}
                    <button type="button" className="secondary-button" onClick={addOption}>
                      + Add Option
                    </button>
                  </div>
                )}
              </>
            )}
          </aside>
        </div>
      )}

      {activeTab === 'Preview' && (
        <div className="panel questionnaire-preview">
          <h3>{selectedSurvey}</h3>
          {questions.map((question, index) => (
            <label className="preview-question" key={`${question.label}-${index}`}>
              {question.label}{question.required ? ' *' : ''}
              {question.type === 'Dropdown' || question.type === 'Single Choice' ? (
                <select disabled defaultValue="">
                  <option value="">Select an option</option>
                  {question.options.map((option) => <option key={option}>{option}</option>)}
                </select>
              ) : (
                <input disabled placeholder={question.type} />
              )}
            </label>
          ))}
        </div>
      )}

      {activeTab === 'Settings' && (
        <div className="panel questionnaire-preview">
          <h3>Questionnaire Settings</h3>
          <label className="preview-question">
            Questionnaire title
            <input value={selectedSurvey} readOnly />
          </label>
          <p>Choose a survey above to manage its questionnaire.</p>
        </div>
      )}
    </section>
  )
}

function DataCollection() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({ district: '', parish: '', village: '', region: '' })
  const [saved, setSaved] = useState(false)

  function updateField(event) {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
    setSaved(false)
  }

  function handleNext() {
    setSaved(true)
    setStep((current) => Math.min(current + 1, 4))
  }

  return (
    <section className="panel collection-panel">
      <div className="collection-meta">
        <label>
          Survey
          <select defaultValue={surveyRows[0][0]}>
            {surveyRows.map(([name]) => <option key={name}>{name}</option>)}
          </select>
        </label>
        <label>
          Household ID
          <input value="HH-0001256" readOnly />
        </label>
        <div className="collection-progress">
          <span>Step {step} of 4</span>
          <div><span style={{ width: `${step * 25}%` }} /></div>
        </div>
      </div>

      <div className="collection-section-heading">
        <div>
          <h3>Section 1: Household Information</h3>
          <p>Enter the household location details.</p>
        </div>
        {saved && <span className="saved-message">Progress saved</span>}
      </div>

      <div className="collection-fields">
        <label>
          District <span className="required-mark">*</span>
          <select name="district" value={formData.district} onChange={updateField}>
            <option value="">Select District</option>
            <option>Kampala</option><option>Wakiso</option><option>Mukono</option>
            <option>Masaka</option><option>Mbarara</option><option>Gulu</option>
          </select>
        </label>
        <label>
          Parish <span className="required-mark">*</span>
          <input name="parish" value={formData.parish} onChange={updateField} placeholder="Enter Parish" />
        </label>
        <label>
          Village / EA <span className="required-mark">*</span>
          <input name="village" value={formData.village} onChange={updateField} placeholder="Enter Village / EA" />
        </label>
        <label>
          Region <span className="required-mark">*</span>
          <select name="region" value={formData.region} onChange={updateField}>
            <option value="">Select Region</option>
            <option>Central</option><option>Eastern</option><option>Northern</option><option>Western</option>
          </select>
        </label>
      </div>

      <div className="collection-actions">
        <button className="secondary-button" type="button" disabled={step === 1}
          onClick={() => setStep((current) => Math.max(current - 1, 1))}>
          ‹ Previous
        </button>
        <button className="primary-button" type="button" onClick={handleNext}>
          {step === 4 ? 'Save Interview' : 'Save & Next ›'}
        </button>
      </div>
    </section>
  )
}
function HouseholdManagement() {
  const [search, setSearch] = useState('')
  const [households, setHouseholds] = useState([
    { id: 'HH-0001256', district: 'Kampala', parish: 'Nakawa', village: 'EA 12', members: 5 },
    { id: 'HH-0001257', district: 'Wakiso', parish: 'Kyengera', village: 'EA 05', members: 4 },
    { id: 'HH-0001258', district: 'Mbarara', parish: 'Kakoba', village: 'EA 02', members: 6 },
    { id: 'HH-0001259', district: 'Masaka', parish: 'Masaka TC', village: 'EA 08', members: 3 },
    { id: 'HH-0001260', district: 'Gulu', parish: 'Layibi', village: 'EA 01', members: 7 },
  ])
  const [selectedHouseholdId, setSelectedHouseholdId] = useState('HH-0001256')

  const membersByHousehold = {
    'HH-0001256': [
      ['P-0000461', 'Sebuliba John', 'Male', 45, 'Household Head'],
      ['P-0000462', 'Namatovu Jane', 'Female', 42, 'Spouse'],
      ['P-0000463', 'Sebuliba Peter', 'Male', 18, 'Son'],
    ],
    'HH-0001257': [
      ['P-0000464', 'Nakato Sarah', 'Female', 39, 'Household Head'],
      ['P-0000465', 'Kato James', 'Male', 16, 'Son'],
    ],
  }

  const visibleHouseholds = households.filter((household) =>
    `${household.id} ${household.district} ${household.parish} ${household.village}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  )
  const selectedHousehold = households.find((household) => household.id === selectedHouseholdId)
  const selectedMembers = membersByHousehold[selectedHouseholdId] || []

  function addHousehold() {
    const nextNumber = 1256 + households.length
    const newHousehold = {
      id: `HH-${String(nextNumber).padStart(7, '0')}`,
      district: 'Not set',
      parish: 'Not set',
      village: 'Not set',
      members: 0,
    }
    setHouseholds((current) => [...current, newHousehold])
    setSelectedHouseholdId(newHousehold.id)
  }

  return (
    <div style={{ display: 'grid', gap: '14px' }}>
      <section className="panel survey-management">
        <div className="survey-toolbar">
          <input
            type="search"
            placeholder="Search households..."
            aria-label="Search households"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button className="primary-button" type="button" onClick={addHousehold}>
            + Add Household
          </button>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>HH ID</th><th>District</th><th>Parish</th>
                <th>EA / Village</th><th>Members</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleHouseholds.map((household) => (
                <tr
                  key={household.id}
                  onClick={() => setSelectedHouseholdId(household.id)}
                  style={{
                    cursor: 'pointer',
                    background: selectedHouseholdId === household.id ? '#f2f5f6' : undefined,
                  }}
                >
                  <td>{household.id}</td>
                  <td>{household.district}</td>
                  <td>{household.parish}</td>
                  <td>{household.village}</td>
                  <td>{household.members}</td>
                  <td className="row-actions">
                    <button type="button" aria-label={`Edit ${household.id}`}>✎</button>
                    <button type="button" aria-label={`View ${household.id}`}>◉</button>
                  </td>
                </tr>
              ))}
              {visibleHouseholds.length === 0 && (
                <tr><td colSpan="6" className="empty-state">No matching households found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <span>Showing {visibleHouseholds.length} of {households.length} households</span>
          <div className="pagination" aria-label="Household table pages">
            <button type="button" disabled>‹</button>
            <button type="button" className="current-page">1</button>
            <button type="button">2</button>
            <button type="button">›</button>
          </div>
        </div>
      </section>

      <section className="panel survey-management">
        <h3>Members in {selectedHousehold?.id || 'selected household'}</h3>
        {selectedHousehold ? (
          <>
            <p style={{ margin: '0 0 12px', color: '#718087', fontSize: '12px' }}>
              {selectedHousehold.district} · {selectedHousehold.parish} · {selectedHousehold.village}
            </p>
            {selectedMembers.length > 0 ? (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr><th>Person ID</th><th>Name</th><th>Sex</th><th>Age</th><th>Relationship</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {selectedMembers.map(([id, name, sex, age, relationship]) => (
                      <tr key={id}>
                        <td>{id}</td><td>{name}</td><td>{sex}</td><td>{age}</td><td>{relationship}</td>
                        <td className="row-actions">
                          <button type="button" aria-label={`Edit ${name}`}>✎</button>
                          <button type="button" aria-label={`View ${name}`}>◉</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="empty-state">No member records are available for this household yet.</p>
            )}
          </>
        ) : (
          <p className="empty-state">Select a household to view its members.</p>
        )}
      </section>
    </div>
  )
}
function RespondentManagement() {
  const [search, setSearch] = useState('')
  const [selectedSurvey, setSelectedSurvey] = useState('All surveys')
  const [respondents, setRespondents] = useState([
    { id: 'P-0000461', name: 'Sebuliba John', sex: 'Male', age: 45, district: 'Kampala', household: 'HH-0001256', survey: surveyRows[0][0] },
    { id: 'P-0000462', name: 'Namatovu Jane', sex: 'Female', age: 42, district: 'Kampala', household: 'HH-0001256', survey: surveyRows[0][0] },
    { id: 'P-0000463', name: 'Sebuliba Peter', sex: 'Male', age: 18, district: 'Kampala', household: 'HH-0001256', survey: surveyRows[0][0] },
    { id: 'P-0000464', name: 'Nakato Sarah', sex: 'Female', age: 39, district: 'Wakiso', household: 'HH-0001257', survey: surveyRows[0][0] },
    { id: 'P-0000465', name: 'Kato James', sex: 'Male', age: 16, district: 'Wakiso', household: 'HH-0001257', survey: surveyRows[0][0] },
  ])

  const visibleRespondents = respondents.filter((person) => {
    const matchesSearch = Object.values(person)
      .join(' ')
      .toLowerCase()
      .includes(search.toLowerCase())
    const matchesSurvey = selectedSurvey === 'All surveys' || person.survey === selectedSurvey
    return matchesSearch && matchesSurvey
  })

  function addRespondent() {
    const nextNumber = 461 + respondents.length
    const newRespondent = {
      id: `P-${String(nextNumber).padStart(7, '0')}`,
      name: 'New Respondent',
      sex: 'Not set',
      age: '—',
      district: 'Not set',
      household: 'Not assigned',
      survey: selectedSurvey === 'All surveys' ? surveyRows[0][0] : selectedSurvey,
    }
    setRespondents((current) => [...current, newRespondent])
  }

  return (
    <section className="panel survey-management">
      <div className="survey-toolbar">
        <input
          type="search"
          placeholder="Search respondents..."
          aria-label="Search respondents"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          aria-label="Filter respondents by survey"
          value={selectedSurvey}
          onChange={(event) => setSelectedSurvey(event.target.value)}
          style={{ minHeight: '38px', padding: '0 10px', border: '1px solid #d9e0e4', borderRadius: '5px', background: '#fff' }}
        >
          <option>All surveys</option>
          {surveyRows.map(([name]) => <option key={name}>{name}</option>)}
        </select>
        <button className="primary-button" type="button" onClick={addRespondent}>
          + Add Respondent
        </button>
      </div>

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Person ID</th><th>Name</th><th>Sex</th><th>Age</th>
              <th>District</th><th>Household ID</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleRespondents.map((person) => (
              <tr key={person.id}>
                <td>{person.id}</td>
                <td>{person.name}</td>
                <td>{person.sex}</td>
                <td>{person.age}</td>
                <td>{person.district}</td>
                <td>{person.household}</td>
                <td className="row-actions">
                  <button type="button" aria-label={`Edit ${person.name}`}>✎</button>
                  <button type="button" aria-label={`View ${person.name}`}>◉</button>
                </td>
              </tr>
            ))}
            {visibleRespondents.length === 0 && (
              <tr><td colSpan="7" className="empty-state">No matching respondents found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <span>Showing {visibleRespondents.length} of {respondents.length} respondents</span>
        <div className="pagination" aria-label="Respondent table pages">
          <button type="button" disabled>‹</button>
          <button type="button" className="current-page">1</button>
          <button type="button">2</button>
          <button type="button">3</button>
          <button type="button">›</button>
        </div>
      </div>
    </section>
  )
}
function DataValidation() {
  const [activeSeverity, setActiveSeverity] = useState('All Issues')
  const [search, setSearch] = useState('')
  const [selectedIssue, setSelectedIssue] = useState(null)
  const [selectedModule, setSelectedModule] = useState('All modules')
  const [issues] = useState([
    { id: 'HH-0001256', field: 'Age', issue: 'Age cannot be negative', severity: 'Critical', module: 'Households' },
    { id: 'HH-0001257', field: 'Sex', issue: 'Invalid value selected', severity: 'Critical', module: 'Households' },
    { id: 'HH-0001258', field: 'District', issue: 'District code not found', severity: 'Warning', module: 'Households' },
    { id: 'HH-0001259', field: 'Interview Date', issue: 'Date is in the future', severity: 'Warning', module: 'Data Collection' },
    { id: 'HH-0001260', field: 'Education Level', issue: 'Value missing', severity: 'Info', module: 'Respondents' },
    { id: 'P-0000464', field: 'Household ID', issue: 'Household reference is missing', severity: 'Critical', module: 'Respondents' },
    { id: 'P-0000465', field: 'Age', issue: 'Age is outside expected range', severity: 'Warning', module: 'Respondents' },
  ])

  const severityTabs = ['All Issues', 'Critical', 'Warning', 'Info']
  const severityCounts = severityTabs.reduce((counts, severity) => {
    counts[severity] = severity === 'All Issues'
      ? issues.length
      : issues.filter((issue) => issue.severity === severity).length
    return counts
  }, {})

  const visibleIssues = issues.filter((issue) => {
    const matchesSeverity = activeSeverity === 'All Issues' || issue.severity === activeSeverity
    const matchesModule = selectedModule === 'All modules' || issue.module === selectedModule
    const matchesSearch = `${issue.id} ${issue.field} ${issue.issue} ${issue.module} ${issue.severity}`
      .toLowerCase()
      .includes(search.toLowerCase())
    return matchesSeverity && matchesModule && matchesSearch
  })

  return (
    <section className="panel survey-management">
      <div className="validation-tabs" role="tablist" aria-label="Filter issues by severity">
        {severityTabs.map((severity) => (
          <button
            type="button"
            role="tab"
            aria-selected={activeSeverity === severity}
            className={activeSeverity === severity ? 'selected' : ''}
            key={severity}
            onClick={() => setActiveSeverity(severity)}
          >
            {severity} <span>{severityCounts[severity]}</span>
          </button>
        ))}
      </div>

      <div className="survey-toolbar">
        <input
          type="search"
          placeholder="Search validation issues..."
          aria-label="Search validation issues"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          aria-label="Filter by module"
          value={selectedModule}
          onChange={(event) => setSelectedModule(event.target.value)}
          style={{ minHeight: '38px', padding: '0 10px', border: '1px solid #d9e0e4', borderRadius: '5px', background: '#fff' }}
        >
          <option>All modules</option>
          <option>Households</option>
          <option>Data Collection</option>
          <option>Respondents</option>
        </select>
      </div>

      <div className="table-scroll">
        <table>
          <thead>
            <tr><th>Record ID</th><th>Field</th><th>Issue</th><th>Severity</th><th>Action</th></tr>
          </thead>
          <tbody>
            {visibleIssues.map((issue) => (
              <tr key={`${issue.id}-${issue.field}`}>
                <td>{issue.id}</td>
                <td>{issue.field}</td>
                <td>{issue.issue}</td>
                <td><span className={`status-badge ${issue.severity.toLowerCase()}`}>{issue.severity}</span></td>
                <td>
                  <button className="secondary-button" type="button" onClick={() => setSelectedIssue(issue)}>
                    View
                  </button>
                </td>
              </tr>
            ))}
            {visibleIssues.length === 0 && (
              <tr><td colSpan="5" className="empty-state">No matching validation issues found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <span>Showing {visibleIssues.length} of {issues.length} issues</span>
        <div className="pagination" aria-label="Validation table pages">
          <button type="button" disabled>‹</button>
          <button type="button" className="current-page">1</button>
          <button type="button">2</button>
          <button type="button">3</button>
          <button type="button">›</button>
        </div>
      </div>

      {selectedIssue && (
        <div className="panel" style={{ marginTop: '16px', background: '#f8fafb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Issue details</h3>
            <button className="secondary-button" type="button" onClick={() => setSelectedIssue(null)}>Close</button>
          </div>
          <p style={{ marginTop: '12px', color: '#526169', fontSize: '12px' }}>
            <strong>{selectedIssue.id}</strong> · {selectedIssue.field}: {selectedIssue.issue} ({selectedIssue.severity})
          </p>
          <p style={{ color: '#718087', fontSize: '12px' }}>Module: {selectedIssue.module}</p>
        </div>
      )}
    </section>
  )
}
function DataCleaning() {
  const [activeCategory, setActiveCategory] = useState('All Records')
  const [search, setSearch] = useState('')
  const [records, setRecords] = useState([
    { id: 'CLN-001', record: 'HH-0001256', field: 'Household Head', issue: 'Possible duplicate respondent', category: 'Duplicates', impact: 'High' },
    { id: 'CLN-002', record: 'HH-0001257', field: 'District', issue: 'District value is missing', category: 'Missing Data', impact: 'Medium' },
    { id: 'CLN-003', record: 'P-0000464', field: 'Age', issue: 'Age does not match date of birth', category: 'Inconsistent', impact: 'High' },
    { id: 'CLN-004', record: 'HH-0001259', field: 'Village', issue: 'Possible spelling variation: Masaka / Masaka TC', category: 'Inconsistent', impact: 'Low' },
    { id: 'CLN-005', record: 'P-0000468', field: 'Sex', issue: 'Required response is missing', category: 'Missing Data', impact: 'Medium' },
  ])
  const [message, setMessage] = useState('')
  const categories = ['All Records', 'Duplicates', 'Missing Data', 'Inconsistent']

  const visibleRecords = records.filter((item) => {
    const matchesCategory = activeCategory === 'All Records' || item.category === activeCategory
    const matchesSearch = `${item.id} ${item.record} ${item.field} ${item.issue} ${item.category}`
      .toLowerCase()
      .includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  })

  function removeRecord(id, action) {
    setRecords((current) => current.filter((item) => item.id !== id))
    setMessage(action === 'resolved' ? 'Record marked as resolved.' : 'Record dismissed from this review.')
  }

  return (
    <section className="panel survey-management">
      <div className="validation-tabs" role="tablist" aria-label="Filter cleaning records">
        {categories.map((category) => {
          const count = category === 'All Records'
            ? records.length
            : records.filter((item) => item.category === category).length
          return (
            <button
              type="button"
              role="tab"
              aria-selected={activeCategory === category}
              className={activeCategory === category ? 'selected' : ''}
              key={category}
              onClick={() => setActiveCategory(category)}
            >
              {category} <span>{count}</span>
            </button>
          )
        })}
      </div>

      <div className="survey-toolbar">
        <input
          type="search"
          placeholder="Search records to clean..."
          aria-label="Search records to clean"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <button className="primary-button" type="button" onClick={() => setMessage('Review completed for the visible records.') }>
          Run Review
        </button>
      </div>

      {message && (
        <p role="status" style={{ margin: '0 0 12px', color: '#36714a', fontSize: '12px' }}>
          {message}
        </p>
      )}

      <div className="table-scroll">
        <table>
          <thead>
            <tr><th>Record ID</th><th>Field</th><th>Issue</th><th>Category</th><th>Impact</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {visibleRecords.map((item) => (
              <tr key={item.id}>
                <td>{item.record}</td>
                <td>{item.field}</td>
                <td>{item.issue}</td>
                <td>{item.category}</td>
                <td><span className={`status-badge ${item.impact.toLowerCase()}`}>{item.impact}</span></td>
                <td className="row-actions">
                  <button type="button" onClick={() => removeRecord(item.id, 'resolved')} aria-label={`Resolve ${item.record}`}>
                    Resolve
                  </button>
                  <button type="button" onClick={() => removeRecord(item.id, 'dismissed')} aria-label={`Dismiss ${item.record}`}>
                    Dismiss
                  </button>
                </td>
              </tr>
            ))}
            {visibleRecords.length === 0 && (
              <tr><td colSpan="6" className="empty-state">No records match this review.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <span>Showing {visibleRecords.length} of {records.length} outstanding records</span>
        <div className="pagination" aria-label="Data cleaning pages">
          <button type="button" disabled>‹</button>
          <button type="button" className="current-page">1</button>
          <button type="button">2</button>
          <button type="button">›</button>
        </div>
      </div>
    </section>
  )
}
function DataAnalysis() {
  const [selectedSurvey, setSelectedSurvey] = useState(surveyRows[0][0])
  const [selectedIndicator, setSelectedIndicator] = useState('Education Level Distribution')
  const [appliedIndicator, setAppliedIndicator] = useState('Education Level Distribution')

  const indicatorValues = {
    'Education Level Distribution': ['18,420', '92%', '5,000'],
    'Employment Status': ['18,420', '89%', '5,000'],
    'Household Size': ['5,000', '94%', '5.2'],
  }
  const currentValues = indicatorValues[appliedIndicator]
  const educationLevels = [
    { name: 'No Education', value: 28, count: '2,700' },
    { name: 'Primary', value: 57, count: '5,600' },
    { name: 'Secondary', value: 82, count: '8,100' },
    { name: 'Tertiary', value: 51, count: '5,000' },
    { name: 'Other', value: 16, count: '1,600' },
  ]

  return (
    <div style={{ display: 'grid', gap: '14px' }}>
      <section className="panel survey-management">
        <div className="survey-toolbar">
          <label style={{ flex: 1, display: 'grid', gap: '6px', color: '#526169', fontSize: '12px' }}>
            Survey
            <select
              value={selectedSurvey}
              onChange={(event) => setSelectedSurvey(event.target.value)}
              style={{ minHeight: '38px', padding: '0 10px', border: '1px solid #d9e0e4', borderRadius: '5px', background: '#fff' }}
            >
              {surveyRows.map(([name]) => <option key={name}>{name}</option>)}
            </select>
          </label>
          <label style={{ flex: 1, display: 'grid', gap: '6px', color: '#526169', fontSize: '12px' }}>
            Indicator
            <select
              value={selectedIndicator}
              onChange={(event) => setSelectedIndicator(event.target.value)}
              style={{ minHeight: '38px', padding: '0 10px', border: '1px solid #d9e0e4', borderRadius: '5px', background: '#fff' }}
            >
              {Object.keys(indicatorValues).map((indicator) => <option key={indicator}>{indicator}</option>)}
            </select>
          </label>
          <button className="primary-button" type="button" onClick={() => setAppliedIndicator(selectedIndicator)}>
            Go
          </button>
        </div>
      </section>

      <section className="metric-grid" aria-label="Analysis summary">
        <article className="metric-card"><p>Total Households</p><strong>{currentValues[2]}</strong><span>Survey total</span></article>
        <article className="metric-card"><p>Total Respondents</p><strong>{currentValues[0]}</strong><span>Survey total</span></article>
        <article className="metric-card"><p>{appliedIndicator}</p><strong>{currentValues[1]}</strong><span>Indicator result</span></article>
      </section>

      <section className="dashboard-grid">
        <article className="panel district-panel">
          <h3>{appliedIndicator}</h3>
          <div className="bar-chart">
            {educationLevels.map((level) => (
              <div className="bar-column" key={level.name}>
                <div className="bar-track">
                  <div className="bar" style={{ height: `${level.value}%` }} />
                </div>
                <span>{level.name}</span>
              </div>
            ))}
          </div>
          <p style={{ marginTop: '10px', color: '#718087', fontSize: '11px' }}>
            Respondent counts are shown for {selectedSurvey}.
          </p>
        </article>

        <article className="panel" style={{ gridColumn: 'span 3' }}>
          <h3>Employment Status</h3>
          <div className="donut-content">
            <div className="donut gender-donut" role="img" aria-label="Employed 62%, unemployed 28%, not in labor force 10%" />
            <ul className="legend">
              <li><span className="legend-dot male" />Employed <strong>9,250 (62%)</strong></li>
              <li><span className="legend-dot female" />Unemployed <strong>4,180 (28%)</strong></li>
              <li><span className="legend-dot other" />Not in Labor Force <strong>1,490 (10%)</strong></li>
            </ul>
          </div>
        </article>

        <article className="panel activity-panel">
          <h3>Analysis Summary</h3>
          <p style={{ color: '#526169', fontSize: '12px', lineHeight: 1.7 }}>
            The selected indicator is <strong>{appliedIndicator}</strong> for <strong>{selectedSurvey}</strong>.
            Use the survey and indicator filters above to change the analysis view.
          </p>
        </article>
      </section>
    </div>
  )
}
function Reports() {
  const [search, setSearch] = useState('')
  const [selectedSurvey, setSelectedSurvey] = useState('All surveys')
  const [selectedReport, setSelectedReport] = useState(null)
  const [reports] = useState([
    { id: 'RPT-2025-014', name: 'Household Summary Report', survey: surveyRows[0][0], date: '19 May 2025', owner: 'John Doe', status: 'Ready' },
    { id: 'RPT-2025-013', name: 'Respondent Demographics', survey: surveyRows[0][0], date: '18 May 2025', owner: 'Jane Smith', status: 'Ready' },
    { id: 'RPT-2025-012', name: 'ICT Access Findings', survey: surveyRows[1][0], date: '16 May 2025', owner: 'Mary N.', status: 'Ready' },
    { id: 'RPT-2025-011', name: 'Agricultural Practices Overview', survey: surveyRows[2][0], date: '12 May 2025', owner: 'John Doe', status: 'Ready' },
  ])

  const visibleReports = reports.filter((report) => {
    const matchesSearch = `${report.id} ${report.name} ${report.survey} ${report.owner}`
      .toLowerCase()
      .includes(search.toLowerCase())
    const matchesSurvey = selectedSurvey === 'All surveys' || report.survey === selectedSurvey
    return matchesSearch && matchesSurvey
  })

  function exportReports() {
    const csvRows = [
      ['Report ID', 'Report Name', 'Survey', 'Generated Date', 'Generated By', 'Status'],
      ...visibleReports.map((report) => [report.id, report.name, report.survey, report.date, report.owner, report.status]),
    ]
    const csv = csvRows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'survey-reports.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ display: 'grid', gap: '14px' }}>
      <section className="panel survey-management">
        <div className="survey-toolbar">
          <input
            type="search"
            placeholder="Search reports..."
            aria-label="Search reports"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            aria-label="Filter reports by survey"
            value={selectedSurvey}
            onChange={(event) => setSelectedSurvey(event.target.value)}
            style={{ minHeight: '38px', padding: '0 10px', border: '1px solid #d9e0e4', borderRadius: '5px', background: '#fff' }}
          >
            <option>All surveys</option>
            {surveyRows.map(([name]) => <option key={name}>{name}</option>)}
          </select>
          <button className="primary-button" type="button" onClick={exportReports}>
            Export CSV
          </button>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr><th>Report ID</th><th>Report Name</th><th>Survey</th><th>Date Generated</th><th>Generated By</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {visibleReports.map((report) => (
                <tr key={report.id}>
                  <td>{report.id}</td>
                  <td>{report.name}</td>
                  <td>{report.survey}</td>
                  <td>{report.date}</td>
                  <td>{report.owner}</td>
                  <td><span className="status-badge active">{report.status}</span></td>
                  <td>
                    <button className="secondary-button" type="button" onClick={() => setSelectedReport(report)}>
                      Preview
                    </button>
                  </td>
                </tr>
              ))}
              {visibleReports.length === 0 && (
                <tr><td colSpan="7" className="empty-state">No matching reports found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <span>Showing {visibleReports.length} of {reports.length} reports</span>
          <div className="pagination" aria-label="Report table pages">
            <button type="button" disabled>‹</button>
            <button type="button" className="current-page">1</button>
            <button type="button">2</button>
            <button type="button">›</button>
          </div>
        </div>
      </section>

      {selectedReport && (
        <section className="panel" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            <div>
              <h3 style={{ marginBottom: '5px' }}>{selectedReport.name}</h3>
              <p style={{ color: '#718087', fontSize: '12px' }}>{selectedReport.id} · {selectedReport.survey}</p>
            </div>
            <button className="secondary-button" type="button" onClick={() => setSelectedReport(null)}>Close preview</button>
          </div>
          <div className="metric-grid" style={{ marginTop: '16px' }}>
            <article className="metric-card"><p>Households</p><strong>5,000</strong><span>Included in report</span></article>
            <article className="metric-card"><p>Respondents</p><strong>18,420</strong><span>Included in report</span></article>
            <article className="metric-card"><p>Completion</p><strong>82.7%</strong><span>Interview completion</span></article>
          </div>
        </section>
      )}
    </div>
  )
}
function UserManagement() {
  const [search, setSearch] = useState('')
  const [selectedRole, setSelectedRole] = useState('All roles')
  const [selectedStatus, setSelectedStatus] = useState('All statuses')
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState('')
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'Field Officer' })
  const [users, setUsers] = useState([
    { id: 'USR-001', name: 'John Doe', email: 'john.doe@example.org', role: 'Administrator', lastActive: '19 May 2025', status: 'Active' },
    { id: 'USR-002', name: 'Jane Smith', email: 'jane.smith@example.org', role: 'Supervisor', lastActive: '19 May 2025', status: 'Active' },
    { id: 'USR-003', name: 'Mary N.', email: 'mary.n@example.org', role: 'Data Analyst', lastActive: '18 May 2025', status: 'Active' },
    { id: 'USR-004', name: 'Peter O.', email: 'peter.o@example.org', role: 'Field Officer', lastActive: '16 May 2025', status: 'Inactive' },
  ])

  const roles = ['Administrator', 'Supervisor', 'Data Analyst', 'Field Officer']
  const visibleUsers = users.filter((user) => {
    const matchesSearch = `${user.id} ${user.name} ${user.email} ${user.role}`
      .toLowerCase()
      .includes(search.toLowerCase())
    const matchesRole = selectedRole === 'All roles' || user.role === selectedRole
    const matchesStatus = selectedStatus === 'All statuses' || user.status === selectedStatus
    return matchesSearch && matchesRole && matchesStatus
  })

  function addUser(event) {
    event.preventDefault()
    const user = {
      id: `USR-${String(users.length + 1).padStart(3, '0')}`,
      name: newUser.name.trim(),
      email: newUser.email.trim(),
      role: newUser.role,
      lastActive: 'Never',
      status: 'Active',
    }
    setUsers((current) => [...current, user])
    setNewUser({ name: '', email: '', role: 'Field Officer' })
    setShowForm(false)
    setMessage(`${user.name} was added.`)
  }

  function toggleStatus(id) {
    setUsers((current) => current.map((user) =>
      user.id === id ? { ...user, status: user.status === 'Active' ? 'Inactive' : 'Active' } : user,
    ))
  }

  return (
    <section className="panel survey-management">
      <div className="survey-toolbar">
        <input
          type="search"
          placeholder="Search users..."
          aria-label="Search users"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          aria-label="Filter by role"
          value={selectedRole}
          onChange={(event) => setSelectedRole(event.target.value)}
          style={{ minHeight: '38px', padding: '0 10px', border: '1px solid #d9e0e4', borderRadius: '5px', background: '#fff' }}
        >
          <option>All roles</option>
          {roles.map((role) => <option key={role}>{role}</option>)}
        </select>
        <select
          aria-label="Filter by status"
          value={selectedStatus}
          onChange={(event) => setSelectedStatus(event.target.value)}
          style={{ minHeight: '38px', padding: '0 10px', border: '1px solid #d9e0e4', borderRadius: '5px', background: '#fff' }}
        >
          <option>All statuses</option>
          <option>Active</option>
          <option>Inactive</option>
        </select>
        <button className="primary-button" type="button" onClick={() => { setShowForm((value) => !value); setMessage('') }}>
          + Add User
        </button>
      </div>

      {message && <p role="status" style={{ margin: '0 0 12px', color: '#36714a', fontSize: '12px' }}>{message}</p>}

      {showForm && (
        <form onSubmit={addUser} className="panel" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr)) auto', gap: '10px', alignItems: 'end', marginBottom: '16px', padding: '14px', background: '#f8fafb' }}>
          <label style={{ display: 'grid', gap: '6px', color: '#526169', fontSize: '12px' }}>
            Full name
            <input required value={newUser.name} onChange={(event) => setNewUser((current) => ({ ...current, name: event.target.value }))} />
          </label>
          <label style={{ display: 'grid', gap: '6px', color: '#526169', fontSize: '12px' }}>
            Email
            <input required type="email" value={newUser.email} onChange={(event) => setNewUser((current) => ({ ...current, email: event.target.value }))} />
          </label>
          <label style={{ display: 'grid', gap: '6px', color: '#526169', fontSize: '12px' }}>
            Role
            <select value={newUser.role} onChange={(event) => setNewUser((current) => ({ ...current, role: event.target.value }))}>
              {roles.map((role) => <option key={role}>{role}</option>)}
            </select>
          </label>
          <button className="primary-button" type="submit">Save User</button>
        </form>
      )}

      <div className="table-scroll">
        <table>
          <thead>
            <tr><th>User ID</th><th>Name</th><th>Email</th><th>Role</th><th>Last Active</th><th>Status</th><th>Action</th></tr>
          </thead>
          <tbody>
            {visibleUsers.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td><td>{user.name}</td><td>{user.email}</td><td>{user.role}</td><td>{user.lastActive}</td>
                <td><span className={`status-badge ${user.status.toLowerCase()}`}>{user.status}</span></td>
                <td>
                  <button className="secondary-button" type="button" onClick={() => toggleStatus(user.id)}>
                    {user.status === 'Active' ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
            {visibleUsers.length === 0 && (
              <tr><td colSpan="7" className="empty-state">No matching users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <span>Showing {visibleUsers.length} of {users.length} users</span>
        <div className="pagination" aria-label="User table pages">
          <button type="button" disabled>‹</button>
          <button type="button" className="current-page">1</button>
          <button type="button">2</button>
          <button type="button">›</button>
        </div>
      </div>
    </section>
  )
}
function Settings() {
  const [profile, setProfile] = useState({ name: 'User Name', email: 'user@example.org', role: 'Administrator' })
  const [preferences, setPreferences] = useState({ emailAlerts: true, validationAlerts: true, weeklySummary: false })
  const [message, setMessage] = useState('')

  function updateProfile(event) {
    const { name, value } = event.target
    setProfile((current) => ({ ...current, [name]: value }))
    setMessage('')
  }

  function togglePreference(name) {
    setPreferences((current) => ({ ...current, [name]: !current[name] }))
    setMessage('')
  }

  function saveSettings(event) {
    event.preventDefault()
    setMessage('Settings saved successfully.')
  }

  return (
    <form onSubmit={saveSettings} style={{ display: 'grid', gap: '14px', maxWidth: '900px' }}>
      <section className="panel" style={{ padding: '18px' }}>
        <h3>Profile Information</h3>
        <div className="collection-fields">
          <label>
            Full name
            <input name="name" value={profile.name} onChange={updateProfile} required />
          </label>
          <label>
            Email address
            <input name="email" type="email" value={profile.email} onChange={updateProfile} required />
          </label>
          <label>
            Role
            <input value={profile.role} readOnly />
          </label>
          <label>
            Time zone
            <select defaultValue="Africa/Kampala">
              <option value="Africa/Kampala">Africa/Kampala (EAT)</option>
              <option value="UTC">UTC</option>
            </select>
          </label>
        </div>
      </section>

      <section className="panel" style={{ padding: '18px' }}>
        <h3>Notifications</h3>
        <div style={{ display: 'grid', gap: '14px' }}>
          {[
            ['emailAlerts', 'Email notifications', 'Receive important platform updates by email.'],
            ['validationAlerts', 'Data quality alerts', 'Get notified about critical validation issues.'],
            ['weeklySummary', 'Weekly summary', 'Receive a weekly survey activity summary.'],
          ].map(([key, title, description]) => (
            <label key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', color: '#34434b', fontSize: '13px' }}>
              <span>
                <strong style={{ display: 'block', fontWeight: 600 }}>{title}</strong>
                <small style={{ color: '#718087' }}>{description}</small>
              </span>
              <input
                type="checkbox"
                checked={preferences[key]}
                onChange={() => togglePreference(key)}
                aria-label={title}
              />
            </label>
          ))}
        </div>
      </section>

      <section className="panel" style={{ padding: '18px' }}>
        <h3>Security</h3>
        <p style={{ margin: '0 0 14px', color: '#718087', fontSize: '12px' }}>
          Keep your account secure by using a strong password and signing out on shared devices.
        </p>
        <button className="secondary-button" type="button" onClick={() => setMessage('Password change is not connected yet.') }>
          Change Password
        </button>
      </section>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button className="primary-button" type="submit">Save Settings</button>
        {message && <span role="status" style={{ color: '#36714a', fontSize: '12px' }}>{message}</span>}
      </div>
    </form>
  )
}
function App() {
  const [activePage, setActivePage] = useState('Dashboard')

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <strong>NSDMAP</strong>
          <span>Survey Data Platform</span>
        </div>

        <nav aria-label="Main navigation">
          {navigation.map((page) => (
            <button
              className={`nav-link ${activePage === page ? 'active' : ''}`}
              key={page}
              onClick={() => setActivePage(page)}
              type="button"
            >
              {page}
            </button>
          ))}
        </nav>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <h1>{activePage}</h1>
          <div className="topbar-actions">
            <button type="button" aria-label="Notifications">♧</button>
            <button className="user-button" type="button">User Name⌄</button>
          </div>
        </header>

        <section className="page-content">
          <div className="page-heading">
            <div>
              <h2>{activePage}</h2>
              <p>National Survey Data Management &amp; Analysis Platform</p>
            </div>
          </div>

          {activePage === 'Dashboard' ? (
            <Dashboard />
          ) : activePage === 'Surveys' ? (
            <SurveyManagement />
          ) : activePage === 'Questionnaires' ? (
            <QuestionnaireBuilder />
          ) : activePage === 'Data Collection' ? (
            <DataCollection />
          ) : activePage === 'Households' ? (
            <HouseholdManagement />
          ) : activePage === 'Respondents' ? (
            <RespondentManagement />
          ) : activePage === 'Validation' ? (
            <DataValidation />
          ) : activePage === 'Data Cleaning' ? (
            <DataCleaning />
          ) : activePage === 'Analysis' ? (
            <DataAnalysis />
          ) : activePage === 'Reports' ? (
            <Reports />
          ) : activePage === 'Users' ? (
            <UserManagement />
          ) : activePage === 'Settings' ? (
            <Settings />
          ) : (
            <div className="welcome-card">
              <h3>{activePage}</h3>
              <p>{activePage} tools and information will appear here.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default App












