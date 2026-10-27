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
  const [dashboardData, setDashboardData] = useState({
    surveys: [],
    households: [],
    respondents: [],
    interviews: [],
    qualityScore: null,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function loadDashboardData() {
      setLoading(true)
      setError('')

      try {
        const endpoints = ['surveys', 'households', 'respondents', 'interviews']
        const [collections, validationData] = await Promise.all([
          Promise.all(endpoints.map(async (endpoint) => {
          const response = await fetch(`${API_BASE_URL}/${endpoint}/`, {
            credentials: 'include',
            headers: { Accept: 'application/json' },
          })
          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.detail || `Could not load ${endpoint} (HTTP ${response.status}).`)
          }
          if (!Array.isArray(data)) {
            throw new Error(`The ${endpoint} endpoint returned an unexpected response.`)
          }
          return data
          })),
          apiRequest(`${API_BASE_URL}/validation/issues/`),
        ])

        if (!cancelled) {
          setDashboardData({
            surveys: collections[0],
            households: collections[1],
            respondents: collections[2],
            interviews: collections[3],
            qualityScore: validationData.summary?.quality_score ?? 100,
          })
        }
      } catch (requestError) {
        if (!cancelled) setError(requestError.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadDashboardData()
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  const { surveys, households, respondents, interviews } = dashboardData
  const activeSurveyCount = surveys.filter((survey) => survey.status === 'active').length
  const completedInterviewCount = interviews.filter((interview) => interview.status === 'completed').length
  const inProgressInterviewCount = interviews.filter((interview) => interview.status === 'in_progress').length
  const surveyStatuses = [
    { key: 'draft', label: 'Draft' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' },
    { key: 'archived', label: 'Archived' },
  ].map((status) => ({
    ...status,
    count: surveys.filter((survey) => survey.status === status.key).length,
  }))
  const largestStatusCount = Math.max(1, ...surveyStatuses.map((status) => status.count))
  const respondentSexCounts = {
    female: respondents.filter((respondent) => respondent.sex === 'female').length,
    male: respondents.filter((respondent) => respondent.sex === 'male').length,
    other: respondents.filter((respondent) => respondent.sex === 'other').length,
    notReported: respondents.filter((respondent) => respondent.sex === 'not_reported').length,
  }
  const interviewStatuses = [
    { key: 'completed', label: 'Completed' },
    { key: 'in_progress', label: 'In progress' },
    { key: 'not_started', label: 'Not started' },
  ].map((status) => ({
    ...status,
    count: interviews.filter((interview) => interview.status === status.key).length,
  }))

  function formatDate(value) {
    if (!value) return 'Not set'
    const [year, month, day] = value.split('-')
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${day} ${monthNames[Number(month) - 1]} ${year}`
  }

  function formatStatus(value) {
    return value
      ? value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
      : 'Unknown'
  }

  const metrics = [
    { label: 'Total Surveys', value: loading ? '…' : surveys.length, note: `${activeSurveyCount} active` },
    { label: 'Total Households', value: loading ? '…' : households.length, note: 'All recorded households' },
    { label: 'Total Respondents', value: loading ? '…' : respondents.length, note: 'All recorded respondents' },
    {
      label: 'Completed Interviews',
      value: loading ? '…' : completedInterviewCount,
      note: `${inProgressInterviewCount} in progress`,
    },
    { label: 'Data Quality Score', value: loading ? '…' : `${dashboardData.qualityScore ?? 100}%`, note: 'Based on current validation checks' },
  ]

  return (
    <>
      <section className="metric-grid" aria-label="Survey summary">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>

      {error && (
        <p role="alert" style={{ color: '#a33b36', fontSize: '13px' }}>
          Could not load dashboard data: {error}
        </p>
      )}

      <section className="dashboard-grid">
        <article className="panel district-panel">
          <h3>Surveys by Status</h3>
          <div className="bar-chart">
            {surveyStatuses.map((status) => (
              <div className="bar-column" key={status.key}>
                <div className="bar-track">
                  <div
                    className="bar"
                    style={{
                      height: status.count
                        ? `${Math.max(8, (status.count / largestStatusCount) * 100)}%`
                        : '0%',
                    }}
                  />
                </div>
                <span>{status.label} ({status.count})</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <h3>Gender Distribution</h3>
          {respondents.length === 0 ? (
            <p className="empty-state">No respondent records yet.</p>
          ) : (
            <ul className="legend">
              <li>Female <strong>{respondentSexCounts.female}</strong></li>
              <li>Male <strong>{respondentSexCounts.male}</strong></li>
              <li>Other <strong>{respondentSexCounts.other}</strong></li>
              <li>Not reported <strong>{respondentSexCounts.notReported}</strong></li>
            </ul>
          )}
        </article>

        <article className="panel">
          <h3>Interviews by Status</h3>
          {interviews.length === 0 ? (
            <p className="empty-state">No interviews recorded yet.</p>
          ) : (
            <ul className="legend">
              {interviewStatuses.map((status) => (
                <li key={status.key}>{status.label} <strong>{status.count}</strong></li>
              ))}
            </ul>
          )}
        </article>

        <article className="panel">
          <h3>Urban / Rural</h3>
          <p className="empty-state">Household settlement type will appear here when collected.</p>
        </article>

        <article className="panel recent-surveys">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            <h3>Recent Surveys</h3>
            <button
              className="text-button"
              type="button"
              onClick={() => setReloadKey((current) => current + 1)}
              disabled={loading}
            >
              Refresh
            </button>
          </div>

          <div className="table-scroll">
            <table>
              <thead>
                <tr><th>Survey Name</th><th>Start Date</th><th>Status</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="3" className="empty-state">Loading dashboard data...</td></tr>
                ) : surveys.length === 0 ? (
                  <tr><td colSpan="3" className="empty-state">No surveys yet.</td></tr>
                ) : (
                  [...surveys]
                    .sort((a, b) => (b.start_date || '').localeCompare(a.start_date || ''))
                    .slice(0, 5)
                    .map((survey) => (
                      <tr key={survey.id}>
                        <td>{survey.name}</td>
                        <td>{formatDate(survey.start_date)}</td>
                        <td>
                          <span className={`status-badge ${survey.status}`}>
                            {formatStatus(survey.status)}
                          </span>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel activity-panel">
          <h3>Recent Activities</h3>
          <p className="empty-state">Activity history will appear here when activity tracking is connected.</p>
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

const starterQuestionnaireQuestions = [
  { label: 'District', type: 'Dropdown', required: true, options: ['Central', 'Eastern', 'Northern', 'Western'] },
  { label: 'Parish', type: 'Dropdown', required: true, options: [] },
  { label: 'Village / EA', type: 'Text (Short)', required: true, options: [] },
  { label: 'Name of Household Head', type: 'Text (Short)', required: true, options: [] },
  { label: 'Sex', type: 'Single Choice', required: true, options: ['Male', 'Female'] },
]

function readLocalQuestionnaire(surveyName) {
  try {
    const saved = localStorage.getItem(`nsdmap:questionnaire:${surveyName}`)
    if (!saved) return starterQuestionnaireQuestions

    const parsed = JSON.parse(saved)
    return Array.isArray(parsed) ? parsed : starterQuestionnaireQuestions
  } catch {
    return starterQuestionnaireQuestions
  }
}

const questionTypeToApi = {
  'Text (Short)': 'short_text',
  'Text (Long)': 'long_text',
  Number: 'number',
  'Single Choice': 'single_choice',
  'Multiple Choice': 'multiple_choice',
  Date: 'date',
  'Yes / No': 'yes_no',
  Dropdown: 'dropdown',
}

const questionTypeFromApi = Object.fromEntries(
  Object.entries(questionTypeToApi).map(([label, value]) => [value, label]),
)

function questionsFromQuestionnaire(questionnaire) {
  const questions = questionnaire?.sections?.[0]?.questions || []
  if (questions.length === 0) return starterQuestionnaireQuestions

  return questions.map((question) => ({
    label: question.label,
    type: questionTypeFromApi[question.question_type] || 'Text (Short)',
    required: question.required,
    options: (question.options || []).map((option) => option.label),
  }))
}

function getCsrfToken() {
  const cookie = document.cookie.split('; ').find((item) => item.startsWith('csrftoken='))
  return cookie ? decodeURIComponent(cookie.slice('csrftoken='.length)) : ''
}

async function apiRequest(url, { method = 'GET', body } = {}) {
  const headers = { Accept: 'application/json' }
  const options = { method, credentials: 'include', headers }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    headers['X-CSRFToken'] = getCsrfToken()
    options.body = JSON.stringify(body)
  }

  const response = await fetch(url, options)
  const data = response.status === 204 ? null : await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.detail || (data ? JSON.stringify(data) : `Request failed (HTTP ${response.status}).`))
  }

  return data
}
function QuestionnaireBuilder() {
  const [surveys, setSurveys] = useState([])
  const [questionnaires, setQuestionnaires] = useState([])
  const [selectedSurvey, setSelectedSurvey] = useState('')
  const [loadingSurveys, setLoadingSurveys] = useState(true)
  const [saving, setSaving] = useState(false)
  const [surveyError, setSurveyError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [activeTab, setActiveTab] = useState('Structure')
  const [selectedQuestion, setSelectedQuestion] = useState(0)
  const [questions, setQuestions] = useState(starterQuestionnaireQuestions)
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadBuilderData() {
      setLoadingSurveys(true)
      setSurveyError('')

      try {
        const [surveyData, questionnaireData] = await Promise.all([
          apiRequest(`${API_BASE_URL}/surveys/`),
          apiRequest(`${API_BASE_URL}/questionnaires/`),
        ])

        if (!Array.isArray(surveyData) || !Array.isArray(questionnaireData)) {
          throw new Error('The API returned an unexpected response.')
        }
        if (cancelled) return

        setSurveys(surveyData)
        setQuestionnaires(questionnaireData)

        const firstSurvey = surveyData[0]
        if (firstSurvey) {
          setSelectedSurvey(firstSurvey.name)
          const existing = questionnaireData.find(
            (item) => String(item.survey) === String(firstSurvey.id),
          )
          setQuestions(
            existing
              ? questionsFromQuestionnaire(existing)
              : readLocalQuestionnaire(firstSurvey.name),
          )
        } else {
          setSelectedSurvey('')
          setQuestions(starterQuestionnaireQuestions)
        }
      } catch (error) {
        if (!cancelled) {
          setSurveyError(error.message)
          setSelectedSurvey('')
          setQuestions(starterQuestionnaireQuestions)
        }
      } finally {
        if (!cancelled) setLoadingSurveys(false)
      }
    }

    loadBuilderData()
    return () => {
      cancelled = true
    }
  }, [])

  const currentQuestion = questions[selectedQuestion]
  const selectedSurveyRecord = surveys.find((survey) => survey.name === selectedSurvey)
  const existingQuestionnaire = questionnaires.find(
    (item) => String(item.survey) === String(selectedSurveyRecord?.id),
  )

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
    setSaveMessage('')
    setSaveError('')
  }

  function updateQuestion(field, value) {
    setQuestions((current) =>
      current.map((question, index) =>
        index === selectedQuestion ? { ...question, [field]: value } : question,
      ),
    )
    setSaveMessage('')
    setSaveError('')
  }

  function updateOption(optionIndex, value) {
    const updatedOptions = [...currentQuestion.options]
    updatedOptions[optionIndex] = value
    updateQuestion('options', updatedOptions)
  }

  function addOption() {
    updateQuestion('options', [...currentQuestion.options, `Option ${currentQuestion.options.length + 1}`])
  }

  function changeSurvey(surveyName) {
    const survey = surveys.find((item) => item.name === surveyName)
    const questionnaire = questionnaires.find(
      (item) => String(item.survey) === String(survey?.id),
    )

    setSelectedSurvey(surveyName)
    setQuestions(
      questionnaire
        ? questionsFromQuestionnaire(questionnaire)
        : readLocalQuestionnaire(surveyName),
    )
    setSelectedQuestion(0)
    setSaveMessage('')
    setSaveError('')
  }

  async function saveQuestionnaire() {
    if (!selectedSurveyRecord) {
      setSaveError('Select a survey before saving its questionnaire.')
      return
    }

    setSaving(true)
    setSaveError('')
    setSaveMessage('')

    const payload = {
      survey: selectedSurveyRecord.id,
      title: selectedSurveyRecord.name,
      description: '',
      status: 'draft',
      sections: [
        {
          title: 'Household Information',
          description: '',
          order: 0,
          questions: questions.map((question, questionIndex) => ({
            label: question.label.trim(),
            question_type: questionTypeToApi[question.type] || 'short_text',
            required: question.required,
            order: questionIndex,
            options: (question.options || []).map((option, optionIndex) => {
              const label = String(option).trim() || `Option ${optionIndex + 1}`
              return { label, value: label, order: optionIndex }
            }),
          })),
        },
      ],
    }

    try {
      localStorage.setItem(`nsdmap:questionnaire:${selectedSurvey}`, JSON.stringify(questions))

      const url = existingQuestionnaire
        ? `${API_BASE_URL}/questionnaires/${existingQuestionnaire.id}/`
        : `${API_BASE_URL}/questionnaires/`
      const saved = await apiRequest(url, {
        method: existingQuestionnaire ? 'PATCH' : 'POST',
        body: payload,
      })

      setQuestionnaires((current) => {
        const found = current.some((item) => item.id === saved.id)
        return found
          ? current.map((item) => (item.id === saved.id ? saved : item))
          : [...current, saved]
      })
      setQuestions(questionsFromQuestionnaire(saved))
      setSaveMessage('Questionnaire saved to the database.')
    } catch (error) {
      setSaveError(`${error.message} Your draft remains saved in this browser.`)
    } finally {
      setSaving(false)
    }
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
          disabled={loadingSurveys || surveys.length === 0}
          onChange={(event) => changeSurvey(event.target.value)}
        >
          <option value="">
            {loadingSurveys ? 'Loading surveys...' : 'Select a survey'}
          </option>
          {surveys.map((survey) => (
            <option key={survey.id} value={survey.name}>{survey.name}</option>
          ))}
        </select>

        <button
          className="primary-button"
          type="button"
          onClick={saveQuestionnaire}
          disabled={!selectedSurveyRecord || loadingSurveys || saving}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {surveyError && <p role="alert">Could not load questionnaire data: {surveyError}</p>}
      {saveError && <p role="alert">{saveError}</p>}
      {saveMessage && <p role="status">{saveMessage}</p>}

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
          <h3>{selectedSurvey || 'Select a survey'}</h3>
          {questions.map((question, index) => (
            <div className="preview-question" key={`${question.label}-${index}`}>
              <span>{question.label}{question.required ? ' *' : ''}</span>

              {question.type === 'Dropdown' && (
                <select disabled defaultValue="">
                  <option value="">Select an option</option>
                  {(question.options || []).map((option, optionIndex) => (
                    <option key={`${option}-${optionIndex}`}>{option}</option>
                  ))}
                </select>
              )}

              {question.type === 'Single Choice' && (
                <div>
                  {(question.options || []).map((option, optionIndex) => (
                    <label key={`${option}-${optionIndex}`}>
                      <input type="radio" name={`preview-question-${index}`} disabled />
                      {option}
                    </label>
                  ))}
                </div>
              )}

              {question.type === 'Multiple Choice' && (
                <div>
                  {(question.options || []).map((option, optionIndex) => (
                    <label key={`${option}-${optionIndex}`}>
                      <input type="checkbox" disabled />
                      {option}
                    </label>
                  ))}
                </div>
              )}

              {question.type === 'Yes / No' && (
                <select disabled defaultValue="">
                  <option value="">Select an answer</option>
                  <option>Yes</option>
                  <option>No</option>
                </select>
              )}

              {question.type === 'Date' && <input type="date" disabled />}
              {question.type === 'Number' && <input type="number" disabled />}
              {question.type === 'Text (Long)' && <textarea rows="3" disabled />}
              {question.type === 'Text (Short)' && <input type="text" disabled />}
            </div>
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
  const [surveys, setSurveys] = useState([])
  const [selectedSurveyId, setSelectedSurveyId] = useState('')
  const [loadingSurveys, setLoadingSurveys] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [savedHouseholdId, setSavedHouseholdId] = useState('')
  const [formData, setFormData] = useState({ district: '', parish: '', village: '', region: '' })

  useEffect(() => {
    let cancelled = false

    async function loadSurveys() {
      try {
        const data = await apiRequest(`${API_BASE_URL}/surveys/`)
        if (!cancelled) {
          setSurveys(data)
          setSelectedSurveyId(data[0] ? String(data[0].id) : '')
        }
      } catch (requestError) {
        if (!cancelled) setError(requestError.message)
      } finally {
        if (!cancelled) setLoadingSurveys(false)
      }
    }

    loadSurveys()
    return () => {
      cancelled = true
    }
  }, [])

  function updateField(event) {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
    setError('')
    setMessage('')
  }

  async function saveHousehold(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    setSavedHouseholdId('')

    try {
      const household = await apiRequest(`${API_BASE_URL}/households/`, {
        method: 'POST',
        body: {
          survey: Number(selectedSurveyId),
          district: formData.district.trim(),
          parish: formData.parish.trim(),
          village_ea: formData.village.trim(),
          region: formData.region,
        },
      })

      setSavedHouseholdId(household.household_id)
      try {
        await apiRequest(`${API_BASE_URL}/interviews/`, {
          method: 'POST',
          body: {
            survey: Number(selectedSurveyId),
            household: household.id,
            status: 'in_progress',
          },
        })
        setMessage(`Household ${household.household_id} saved and an interview was started.`)
      } catch (interviewError) {
        setMessage(`Household ${household.household_id} was saved. Interview start failed: ${interviewError.message}`)
      }
      setFormData({ district: '', parish: '', village: '', region: '' })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="panel collection-panel" onSubmit={saveHousehold}>
      <div className="collection-meta">
        <label>
          Survey
          <select
            value={selectedSurveyId}
            onChange={(event) => setSelectedSurveyId(event.target.value)}
            required
            disabled={loadingSurveys || surveys.length === 0}
          >
            <option value="">{loadingSurveys ? 'Loading surveys...' : 'Select a survey'}</option>
            {surveys.map((survey) => (
              <option key={survey.id} value={survey.id}>{survey.name}</option>
            ))}
          </select>
        </label>
        <label>
          Household ID
          <input value={savedHouseholdId || 'Assigned after saving'} readOnly />
        </label>
      </div>

      <div className="collection-section-heading">
        <div>
          <h3>Household Information</h3>
          <p>Save a household under the selected survey. You can add its members in the Respondents module.</p>
        </div>
      </div>

      {error && <p role="alert" className="form-error">{error}</p>}
      {message && <p role="status" className="saved-message">{message}</p>}

      <div className="collection-fields">
        <label>
          District <span className="required-mark">*</span>
          <select name="district" value={formData.district} onChange={updateField} required>
            <option value="">Select District</option>
            <option value="Kampala">Kampala</option>
            <option value="Wakiso">Wakiso</option>
            <option value="Mukono">Mukono</option>
            <option value="Masaka">Masaka</option>
            <option value="Mbarara">Mbarara</option>
            <option value="Gulu">Gulu</option>
          </select>
        </label>
        <label>
          Parish <span className="required-mark">*</span>
          <input name="parish" value={formData.parish} onChange={updateField} placeholder="Enter Parish" required />
        </label>
        <label>
          Village / EA <span className="required-mark">*</span>
          <input name="village" value={formData.village} onChange={updateField} placeholder="Enter Village / EA" required />
        </label>
        <label>
          Region <span className="required-mark">*</span>
          <select name="region" value={formData.region} onChange={updateField} required>
            <option value="">Select Region</option>
            <option value="Central">Central</option>
            <option value="Eastern">Eastern</option>
            <option value="Northern">Northern</option>
            <option value="Western">Western</option>
          </select>
        </label>
      </div>

      <div className="collection-actions">
        <span className="collection-progress">A household ID is assigned when the record is saved.</span>
        <button className="primary-button" type="submit" disabled={saving || loadingSurveys || !selectedSurveyId}>
          {saving ? 'Saving...' : 'Save Household & Start Interview'}
        </button>
      </div>
    </form>
  )
}
function HouseholdManagement() {
  const [search, setSearch] = useState('')
  const [households, setHouseholds] = useState([])
  const [surveys, setSurveys] = useState([])
  const [selectedHouseholdId, setSelectedHouseholdId] = useState('')
  const [members, setMembers] = useState([])
  const [form, setForm] = useState({ survey: '', district: '', parish: '', village_ea: '', region: '' })
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      setLoading(true)
      setError('')
      try {
        const [householdData, surveyData] = await Promise.all([
          apiRequest(`${API_BASE_URL}/households/`),
          apiRequest(`${API_BASE_URL}/surveys/`),
        ])
        if (cancelled) return
        setHouseholds(householdData)
        setSurveys(surveyData)
        setSelectedHouseholdId((current) => {
          const currentExists = householdData.some((household) => String(household.id) === String(current))
          return currentExists ? current : householdData[0] ? String(householdData[0].id) : ''
        })
        setForm((current) => ({ ...current, survey: current.survey || (surveyData[0] ? String(surveyData[0].id) : '') }))
      } catch (requestError) {
        if (!cancelled) setError(requestError.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadData()
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  useEffect(() => {
    let cancelled = false
    if (!selectedHouseholdId) {
      setMembers([])
      return () => { cancelled = true }
    }

    async function loadMembers() {
      try {
        const data = await apiRequest(`${API_BASE_URL}/respondents/?household=${selectedHouseholdId}`)
        if (!cancelled) setMembers(data)
      } catch (requestError) {
        if (!cancelled) setError(requestError.message)
      }
    }

    loadMembers()
    return () => {
      cancelled = true
    }
  }, [selectedHouseholdId])

  const visibleHouseholds = households.filter((household) =>
    `${household.household_id} ${household.district} ${household.parish} ${household.village_ea} ${household.region}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  )
  const selectedHousehold = households.find((household) => String(household.id) === String(selectedHouseholdId))

  function updateForm(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function saveHousehold(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const household = await apiRequest(`${API_BASE_URL}/households/`, {
        method: 'POST',
        body: {
          survey: Number(form.survey),
          district: form.district.trim(),
          parish: form.parish.trim(),
          village_ea: form.village_ea.trim(),
          region: form.region,
        },
      })
      setForm({ survey: form.survey, district: '', parish: '', village_ea: '', region: '' })
      setShowForm(false)
      setSelectedHouseholdId(String(household.id))
      setMessage(`Household ${household.household_id} added.`)
      setReloadKey((current) => current + 1)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  function formatLabel(value) {
    return value ? value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) : '—'
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
          <button className="primary-button" type="button" onClick={() => setShowForm((current) => !current)}>
            + Add Household
          </button>
          <button className="text-button" type="button" onClick={() => setReloadKey((current) => current + 1)} disabled={loading}>
            Refresh
          </button>
        </div>

        {error && <p role="alert" className="form-error">{error}</p>}
        {message && <p role="status" className="saved-message">{message}</p>}

        {showForm && (
          <form onSubmit={saveHousehold} className="collection-fields" style={{ marginBottom: '16px' }}>
            <label>
              Survey
              <select name="survey" value={form.survey} onChange={updateForm} required>
                <option value="">Select a survey</option>
                {surveys.map((survey) => <option key={survey.id} value={survey.id}>{survey.name}</option>)}
              </select>
            </label>
            <label>District<input name="district" value={form.district} onChange={updateForm} required /></label>
            <label>Parish<input name="parish" value={form.parish} onChange={updateForm} required /></label>
            <label>EA / Village<input name="village_ea" value={form.village_ea} onChange={updateForm} required /></label>
            <label>
              Region
              <select name="region" value={form.region} onChange={updateForm} required>
                <option value="">Select Region</option>
                <option value="Central">Central</option><option value="Eastern">Eastern</option>
                <option value="Northern">Northern</option><option value="Western">Western</option>
              </select>
            </label>
            <div style={{ display: 'flex', alignItems: 'end', gap: '8px' }}>
              <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Household'}</button>
              <button className="secondary-button" type="button" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        )}

        <div className="table-scroll">
          <table>
            <thead>
              <tr><th>HH ID</th><th>District</th><th>Parish</th><th>EA / Village</th><th>Members</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="empty-state">Loading households...</td></tr>
              ) : visibleHouseholds.map((household) => (
                <tr key={household.id} style={{ background: String(selectedHouseholdId) === String(household.id) ? '#f2f5f6' : undefined }}>
                  <td>
                    <button className="text-button" type="button" onClick={() => setSelectedHouseholdId(String(household.id))}>
                      {household.household_id}
                    </button>
                  </td>
                  <td>{household.district}</td>
                  <td>{household.parish}</td>
                  <td>{household.village_ea}</td>
                  <td>{household.members}</td>
                  <td><button className="secondary-button" type="button" onClick={() => setSelectedHouseholdId(String(household.id))}>View members</button></td>
                </tr>
              ))}
              {!loading && visibleHouseholds.length === 0 && (
                <tr><td colSpan="6" className="empty-state">{search ? 'No matching households found.' : 'No households yet. Add the first household.'}</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <span>Showing {visibleHouseholds.length} of {households.length} households</span>
        </div>
      </section>

      <section className="panel survey-management">
        <h3>Members in {selectedHousehold?.household_id || 'selected household'}</h3>
        {selectedHousehold ? (
          <>
            <p style={{ margin: '0 0 12px', color: '#718087', fontSize: '12px' }}>
              {selectedHousehold.district} · {selectedHousehold.parish} · {selectedHousehold.village_ea}
            </p>
            {members.length > 0 ? (
              <div className="table-scroll">
                <table>
                  <thead><tr><th>Person ID</th><th>Name</th><th>Sex</th><th>Age</th><th>Relationship</th></tr></thead>
                  <tbody>
                    {members.map((member) => (
                      <tr key={member.id}>
                        <td>{member.person_id}</td><td>{member.name}</td><td>{formatLabel(member.sex)}</td>
                        <td>{member.age ?? '—'}</td><td>{member.relationship || '—'}</td>
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
  const [surveys, setSurveys] = useState([])
  const [households, setHouseholds] = useState([])
  const [respondents, setRespondents] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [form, setForm] = useState({ household: '', name: '', sex: 'not_reported', age: '', relationship: '' })

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      setLoading(true)
      setError('')
      try {
        const [respondentData, householdData, surveyData] = await Promise.all([
          apiRequest(`${API_BASE_URL}/respondents/`),
          apiRequest(`${API_BASE_URL}/households/`),
          apiRequest(`${API_BASE_URL}/surveys/`),
        ])
        if (cancelled) return
        setRespondents(respondentData)
        setHouseholds(householdData)
        setSurveys(surveyData)
        setForm((current) => ({ ...current, household: current.household || (householdData[0] ? String(householdData[0].id) : '') }))
      } catch (requestError) {
        if (!cancelled) setError(requestError.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadData()
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  const visibleRespondents = respondents.filter((person) => {
    const surveyName = surveys.find((survey) => String(survey.id) === String(person.survey))?.name || ''
    const matchesSearch = `${person.person_id} ${person.name} ${person.sex} ${person.age ?? ''} ${person.district} ${person.household_id} ${surveyName}`
      .toLowerCase()
      .includes(search.toLowerCase())
    const matchesSurvey = selectedSurvey === 'All surveys' || String(person.survey) === selectedSurvey
    return matchesSearch && matchesSurvey
  })

  const availableHouseholds = selectedSurvey === 'All surveys'
    ? households
    : households.filter((household) => String(household.survey) === selectedSurvey)

  function updateForm(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function formatLabel(value) {
    return value ? value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) : '—'
  }

  async function saveRespondent(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const respondent = await apiRequest(`${API_BASE_URL}/respondents/`, {
        method: 'POST',
        body: {
          household: Number(form.household),
          name: form.name.trim(),
          sex: form.sex,
          age: form.age === '' ? null : Number(form.age),
          relationship: form.relationship.trim(),
        },
      })
      setMessage(`${respondent.person_id} added.`)
      setForm({ household: form.household, name: '', sex: 'not_reported', age: '', relationship: '' })
      setShowForm(false)
      setReloadKey((current) => current + 1)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
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
        >
          <option>All surveys</option>
          {surveys.map((survey) => <option key={survey.id} value={survey.id}>{survey.name}</option>)}
        </select>
        <button className="primary-button" type="button" onClick={() => setShowForm((current) => !current)} disabled={households.length === 0}>
          + Add Respondent
        </button>
        <button className="text-button" type="button" onClick={() => setReloadKey((current) => current + 1)} disabled={loading}>
          Refresh
        </button>
      </div>

      {error && <p role="alert" className="form-error">{error}</p>}
      {message && <p role="status" className="saved-message">{message}</p>}

      {showForm && (
        <form onSubmit={saveRespondent} className="collection-fields" style={{ marginBottom: '16px' }}>
          <label>
            Household
            <select name="household" value={form.household} onChange={updateForm} required>
              <option value="">Select a household</option>
              {availableHouseholds.map((household) => (
                <option key={household.id} value={household.id}>
                  {household.household_id} · {household.district}, {household.parish}
                </option>
              ))}
            </select>
          </label>
          <label>Full name<input name="name" value={form.name} onChange={updateForm} required maxLength="200" /></label>
          <label>
            Sex
            <select name="sex" value={form.sex} onChange={updateForm}>
              <option value="not_reported">Not reported</option>
              <option value="female">Female</option><option value="male">Male</option><option value="other">Other</option>
            </select>
          </label>
          <label>Age<input name="age" type="number" min="0" max="120" value={form.age} onChange={updateForm} /></label>
          <label>Relationship<input name="relationship" value={form.relationship} onChange={updateForm} maxLength="100" /></label>
          <div style={{ display: 'flex', alignItems: 'end', gap: '8px' }}>
            <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Respondent'}</button>
            <button className="secondary-button" type="button" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      <div className="table-scroll">
        <table>
          <thead>
            <tr><th>Person ID</th><th>Name</th><th>Sex</th><th>Age</th><th>District</th><th>Household ID</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="empty-state">Loading respondents...</td></tr>
            ) : visibleRespondents.map((person) => (
              <tr key={person.id}>
                <td>{person.person_id}</td><td>{person.name}</td><td>{formatLabel(person.sex)}</td>
                <td>{person.age ?? '—'}</td><td>{person.district}</td><td>{person.household_id}</td>
              </tr>
            ))}
            {!loading && visibleRespondents.length === 0 && (
              <tr><td colSpan="6" className="empty-state">{households.length === 0 ? 'Add a household before adding respondents.' : 'No matching respondents found.'}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <span>Showing {visibleRespondents.length} of {respondents.length} respondents</span>
      </div>
    </section>
  )
}
function DataValidation() {
  const [activeSeverity, setActiveSeverity] = useState('All Issues')
  const [search, setSearch] = useState('')
  const [selectedIssue, setSelectedIssue] = useState(null)
  const [selectedModule, setSelectedModule] = useState('All modules')
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function loadIssues() {
      setLoading(true)
      setError('')
      try {
        const data = await apiRequest(`${API_BASE_URL}/validation/issues/`)
        if (!cancelled) setIssues(Array.isArray(data.issues) ? data.issues : [])
      } catch (requestError) {
        if (!cancelled) setError(requestError.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadIssues()
    return () => { cancelled = true }
  }, [reloadKey])

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
          <option>Surveys</option>
          <option>Households</option>
          <option>Data Collection</option>
          <option>Respondents</option>
        </select>
        <button className="text-button" type="button" onClick={() => setReloadKey((current) => current + 1)} disabled={loading}>
          {loading ? 'Checking...' : 'Run checks'}
        </button>
      </div>

      {error && <p role="alert" className="form-error">Could not load validation issues: {error}</p>}

      <div className="table-scroll">
        <table>
          <thead>
            <tr><th>Record ID</th><th>Field</th><th>Issue</th><th>Severity</th><th>Action</th></tr>
          </thead>
          <tbody>
              {loading ? (
                <tr><td colSpan="5" className="empty-state">Checking records...</td></tr>
              ) : visibleIssues.map((issue) => (
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
            {!loading && visibleIssues.length === 0 && (
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
  const [issues, setIssues] = useState([])
  const [surveys, setSurveys] = useState([])
  const [selectedIssue, setSelectedIssue] = useState(null)
  const [correctionValue, setCorrectionValue] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingKey, setSavingKey] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const categories = ['All Records', 'Duplicates', 'Missing Data', 'Inconsistent', 'Cleared']

  useEffect(() => {
    let cancelled = false
    async function loadCleaningQueue() {
      setLoading(true)
      setError('')
      try {
        const [data, surveyData] = await Promise.all([
          apiRequest(API_BASE_URL + '/cleaning/issues/'),
          apiRequest(API_BASE_URL + '/surveys/'),
        ])
        if (!cancelled) {
          setIssues(Array.isArray(data.issues) ? data.issues : [])
          setSurveys(Array.isArray(surveyData) ? surveyData : [])
        }
      } catch (requestError) {
        if (!cancelled) setError(requestError.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadCleaningQueue()
    return () => { cancelled = true }
  }, [reloadKey])

  const visibleIssues = issues.filter((item) => {
    const matchesCategory = activeCategory === 'All Records' || item.category === activeCategory
    const matchesSearch = (item.id + ' ' + item.field + ' ' + item.issue + ' ' + item.category + ' ' + item.status)
      .toLowerCase()
      .includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  })

  async function updateIssue(issue, status) {
    setSavingKey(issue.key)
    setError('')
    setMessage('')
    try {
      await apiRequest(API_BASE_URL + '/cleaning/issues/', {
        method: 'POST',
        body: { key: issue.key, status },
      })
      setMessage(status === 'open' ? 'Issue returned to the open review queue.' : 'Cleaning decision saved.')
      setSelectedIssue(null)
      setReloadKey((current) => current + 1)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSavingKey('')
    }
  }

  async function correctIssue(event) {
    event.preventDefault()
    if (!selectedIssue) return
    setSavingKey(selectedIssue.key)
    setError('')
    setMessage('')
    try {
      const result = await apiRequest(API_BASE_URL + '/cleaning/correct/', {
        method: 'POST',
        body: { key: selectedIssue.key, value: correctionValue },
      })
      setMessage(result.detail)
      setSelectedIssue(null)
      setCorrectionValue('')
      setReloadKey((current) => current + 1)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSavingKey('')
    }
  }

  function canCorrect(issue) {
    return ['district_missing', 'parish_missing', 'village_ea_missing', 'region_missing', 'age_missing', 'sex_not_reported', 'duplicate_name', 'future_start', 'missing_completed_at', 'date_order', 'survey_mismatch'].includes(issue.rule)
  }

  function correctionInput(issue) {
    if (issue.rule === 'sex_not_reported') {
      return (
        <select value={correctionValue} onChange={(event) => setCorrectionValue(event.target.value)} required>
          <option value="">Select sex</option><option value="female">Female</option><option value="male">Male</option><option value="other">Other</option>
        </select>
      )
    }
    if (issue.rule === 'survey_mismatch') {
      return (
        <select value={correctionValue} onChange={(event) => setCorrectionValue(event.target.value)} required>
          <option value="">Select the correct survey</option>
          {surveys.map((survey) => <option key={survey.id} value={survey.id}>{survey.name}</option>)}
        </select>
      )
    }
    const type = issue.rule === 'age_missing'
      ? 'number'
      : issue.rule === 'date_order' && issue.source_type === 'survey'
        ? 'date'
        : ['future_start', 'missing_completed_at', 'date_order'].includes(issue.rule)
          ? 'datetime-local'
          : 'text'
    return <input type={type} min={type === 'number' ? '0' : undefined} max={type === 'number' ? '120' : undefined} value={correctionValue} onChange={(event) => setCorrectionValue(event.target.value)} required />
  }

  function formatLabel(value) {
    return value ? value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) : 'Open'
  }

  return (
    <section className="panel survey-management">
      <div className="validation-tabs" role="tablist" aria-label="Filter cleaning records">
        {categories.map((category) => {
          const count = category === 'All Records'
            ? issues.length
            : issues.filter((item) => item.category === category).length
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
        <button className="primary-button" type="button" onClick={() => setReloadKey((current) => current + 1)} disabled={loading}>
          {loading ? 'Reviewing...' : 'Run Review'}
        </button>
      </div>

      {error && <p role="alert" className="form-error">Could not update the cleaning queue: {error}</p>}
      {message && <p role="status" className="saved-message">{message}</p>}

      <div className="table-scroll">
        <table>
          <thead>
            <tr><th>Record ID</th><th>Field</th><th>Issue</th><th>Category</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="empty-state">Loading the cleaning queue...</td></tr>
            ) : visibleIssues.map((item) => (
              <tr key={item.key}>
                <td>{item.id}</td>
                <td>{item.field}</td>
                <td>{item.issue}</td>
                <td>{item.category}</td>
                <td><span className={'status-badge ' + item.status}>{formatLabel(item.status)}</span></td>
                <td className="row-actions">
                  <button type="button" onClick={() => { setSelectedIssue(item); setCorrectionValue('') }}>Details</button>
                  {item.status === 'open' && (
                    <>
                      <button type="button" disabled={savingKey === item.key} onClick={() => updateIssue(item, 'reviewed')}>Mark reviewed</button>
                      <button type="button" disabled={savingKey === item.key} onClick={() => updateIssue(item, 'dismissed')}>Dismiss</button>
                    </>
                  )}
                  {(item.status === 'reviewed' || item.status === 'dismissed') && (
                    <button type="button" disabled={savingKey === item.key} onClick={() => updateIssue(item, 'open')}>Reopen</button>
                  )}
                </td>
              </tr>
            ))}
            {!loading && visibleIssues.length === 0 && (
              <tr><td colSpan="6" className="empty-state">No records match this cleaning review.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <span>Showing {visibleIssues.length} of {issues.length} current and reviewed records</span>
        <button className="text-button" type="button" onClick={() => setReloadKey((current) => current + 1)} disabled={loading}>Refresh</button>
      </div>

      {selectedIssue && (
        <div className="panel" style={{ marginTop: '16px', background: '#f8fafb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Cleaning record details</h3>
            <button className="secondary-button" type="button" onClick={() => setSelectedIssue(null)}>Close</button>
          </div>
          <p style={{ marginTop: '12px', color: '#526169', fontSize: '12px' }}>
            <strong>{selectedIssue.id}</strong> · {selectedIssue.field}: {selectedIssue.issue}
          </p>
          <p style={{ color: '#718087', fontSize: '12px' }}>
            Module: {selectedIssue.module} · Severity: {selectedIssue.severity} · Review status: {formatLabel(selectedIssue.status)}
          </p>
          {canCorrect(selectedIssue) ? (
            <form onSubmit={correctIssue} style={{ display: 'grid', gap: '10px', maxWidth: '420px' }}>
              <label style={{ color: '#526169', fontSize: '12px' }}>Correct {selectedIssue.field}{correctionInput(selectedIssue)}</label>
              <button className="primary-button" type="submit" disabled={savingKey === selectedIssue.key}>
                {savingKey === selectedIssue.key ? 'Saving...' : 'Save correction'}
              </button>
            </form>
          ) : (
            <p style={{ color: '#718087', fontSize: '12px', marginBottom: 0 }}>
              This issue needs a manual source-record review. An issue will appear as cleared when its check no longer finds a problem.
            </p>
          )}
        </div>
      )}
    </section>
  )
}

function DataAnalysis() {
  const [surveys, setSurveys] = useState([])
  const [selectedSurveyId, setSelectedSurveyId] = useState('')
  const [selectedIndicator, setSelectedIndicator] = useState('Respondents by Sex')
  const [appliedIndicator, setAppliedIndicator] = useState('Respondents by Sex')
  const [records, setRecords] = useState({ households: [], respondents: [], interviews: [] })
  const [loadingSurveys, setLoadingSurveys] = useState(true)
  const [loadingData, setLoadingData] = useState(false)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  const indicators = [
    'Respondents by Sex',
    'Respondents by Age Group',
    'Households by District',
    'Household Size',
    'Interviews by Status',
  ]

  useEffect(() => {
    let cancelled = false
    async function loadSurveys() {
      setLoadingSurveys(true)
      setError('')
      try {
        const data = await apiRequest(API_BASE_URL + '/surveys/')
        if (!cancelled) {
          setSurveys(data)
          setSelectedSurveyId((current) => {
            if (data.some((survey) => String(survey.id) === String(current))) return current
            return data[0] ? String(data[0].id) : ''
          })
        }
      } catch (requestError) {
        if (!cancelled) setError(requestError.message)
      } finally {
        if (!cancelled) setLoadingSurveys(false)
      }
    }
    loadSurveys()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    if (!selectedSurveyId) {
      setRecords({ households: [], respondents: [], interviews: [] })
      setLoadingData(false)
      return () => { cancelled = true }
    }

    async function loadAnalysisData() {
      setLoadingData(true)
      setError('')
      setRecords({ households: [], respondents: [], interviews: [] })
      const query = '?survey=' + encodeURIComponent(selectedSurveyId)
      try {
        const [households, respondents, interviews] = await Promise.all([
          apiRequest(API_BASE_URL + '/households/' + query),
          apiRequest(API_BASE_URL + '/respondents/' + query),
          apiRequest(API_BASE_URL + '/interviews/' + query),
        ])
        if (!cancelled) setRecords({ households, respondents, interviews })
      } catch (requestError) {
        if (!cancelled) setError(requestError.message)
      } finally {
        if (!cancelled) setLoadingData(false)
      }
    }

    loadAnalysisData()
    return () => { cancelled = true }
  }, [selectedSurveyId, reloadKey])

  const selectedSurvey = surveys.find((survey) => String(survey.id) === String(selectedSurveyId))
  const completedInterviews = records.interviews.filter((item) => item.status === 'completed').length
  const interviewCompletion = records.interviews.length
    ? Math.round((completedInterviews / records.interviews.length) * 100)
    : 0

  let distribution = []
  if (appliedIndicator === 'Respondents by Sex') {
    distribution = [
      { label: 'Female', count: records.respondents.filter((item) => item.sex === 'female').length },
      { label: 'Male', count: records.respondents.filter((item) => item.sex === 'male').length },
      { label: 'Other', count: records.respondents.filter((item) => item.sex === 'other').length },
      { label: 'Not reported', count: records.respondents.filter((item) => item.sex === 'not_reported').length },
    ]
  } else if (appliedIndicator === 'Respondents by Age Group') {
    const groups = [
      { label: '0–17', matches: (age) => age >= 0 && age <= 17 },
      { label: '18–29', matches: (age) => age >= 18 && age <= 29 },
      { label: '30–44', matches: (age) => age >= 30 && age <= 44 },
      { label: '45–59', matches: (age) => age >= 45 && age <= 59 },
      { label: '60+', matches: (age) => age >= 60 },
      { label: 'Not reported', matches: (age) => age === null || age === undefined },
    ]
    distribution = groups.map((group) => ({
      label: group.label,
      count: records.respondents.filter((item) => group.matches(item.age)).length,
    }))
  } else if (appliedIndicator === 'Households by District') {
    const counts = records.households.reduce((result, household) => {
      const district = household.district || 'Not reported'
      result[district] = (result[district] || 0) + 1
      return result
    }, {})
    distribution = Object.entries(counts)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  } else if (appliedIndicator === 'Household Size') {
    const groups = [
      { label: '1 member', matches: (count) => count === 1 },
      { label: '2–4 members', matches: (count) => count >= 2 && count <= 4 },
      { label: '5–7 members', matches: (count) => count >= 5 && count <= 7 },
      { label: '8+ members', matches: (count) => count >= 8 },
      { label: 'No members', matches: (count) => count === 0 },
    ]
    distribution = groups.map((group) => ({
      label: group.label,
      count: records.households.filter((item) => group.matches(Number(item.members) || 0)).length,
    }))
  } else {
    distribution = [
      { label: 'Completed', count: records.interviews.filter((item) => item.status === 'completed').length },
      { label: 'In progress', count: records.interviews.filter((item) => item.status === 'in_progress').length },
      { label: 'Not started', count: records.interviews.filter((item) => item.status === 'not_started').length },
    ]
  }

  const distributionTotal = distribution.reduce((total, item) => total + item.count, 0)
  const maxCount = Math.max(1, ...distribution.map((item) => item.count))

  function exportDistribution() {
    const rows = [
      ['Survey', 'Indicator', 'Category', 'Count', 'Share (%)'],
      ...distribution.map((item) => [
        selectedSurvey?.name || '',
        appliedIndicator,
        item.label,
        item.count,
        distributionTotal ? ((item.count / distributionTotal) * 100).toFixed(1) : '0.0',
      ]),
    ]
    const csv = rows.map((row) => row.map((value) => '"' + String(value).replaceAll('"', '""') + '"').join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'survey-analysis.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ display: 'grid', gap: '14px' }}>
      <section className="panel survey-management">
        <div className="survey-toolbar analysis-toolbar">
          <label>
            Survey
            <select value={selectedSurveyId} onChange={(event) => setSelectedSurveyId(event.target.value)} disabled={loadingSurveys || surveys.length === 0}>
              <option value="">{loadingSurveys ? 'Loading surveys...' : 'Select a survey'}</option>
              {surveys.map((survey) => <option key={survey.id} value={survey.id}>{survey.name}</option>)}
            </select>
          </label>
          <label>
            Indicator
            <select value={selectedIndicator} onChange={(event) => setSelectedIndicator(event.target.value)}>
              {indicators.map((indicator) => <option key={indicator}>{indicator}</option>)}
            </select>
          </label>
          <button className="primary-button" type="button" onClick={() => setAppliedIndicator(selectedIndicator)} disabled={!selectedSurveyId || loadingData}>
            Apply
          </button>
          <button className="secondary-button" type="button" onClick={() => setReloadKey((current) => current + 1)} disabled={!selectedSurveyId || loadingData}>
            Refresh
          </button>
          <button className="secondary-button" type="button" onClick={exportDistribution} disabled={!selectedSurveyId || loadingData || distributionTotal === 0}>
            Export CSV
          </button>
        </div>
      </section>

      {error && <p role="alert" className="form-error">Could not load analysis data: {error}</p>}

      <section className="metric-grid" aria-label="Selected survey analysis summary">
        <MetricCard label="Total Households" value={loadingData ? '…' : records.households.length} note="In selected survey" />
        <MetricCard label="Total Respondents" value={loadingData ? '…' : records.respondents.length} note="In selected survey" />
        <MetricCard label="Completed Interviews" value={loadingData ? '…' : completedInterviews} note={interviewCompletion + '% of interviews'} />
      </section>

      <section className="panel analysis-panel">
        <div className="analysis-heading">
          <div>
            <h3>{appliedIndicator}</h3>
            <p>{selectedSurvey?.name || 'Select a survey'} · {distributionTotal.toLocaleString()} records in this distribution</p>
          </div>
          <span>{loadingData ? 'Updating…' : 'Live data'}</span>
        </div>

        {loadingData ? (
          <p className="empty-state">Loading analysis data...</p>
        ) : !selectedSurveyId ? (
          <p className="empty-state">Create a survey before viewing analysis.</p>
        ) : distributionTotal === 0 ? (
          <p className="empty-state">No records are available for this indicator in the selected survey.</p>
        ) : (
          <div className="analysis-bars">
            {distribution.map((item) => {
              const share = distributionTotal ? (item.count / distributionTotal) * 100 : 0
              return (
                <div className="analysis-bar-row" key={item.label}>
                  <div className="analysis-bar-label">
                    <span>{item.label}</span>
                    <strong>{item.count.toLocaleString()} <small>({share.toFixed(1)}%)</small></strong>
                  </div>
                  <div className="analysis-bar-track" aria-label={item.label + ': ' + item.count + ' records'}>
                    <div className="analysis-bar-fill" style={{ width: Math.max(item.count ? 2 : 0, (item.count / maxCount) * 100) + '%' }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section className="panel analysis-note">
        <h3>Analysis notes</h3>
        <p>
          Results are calculated from records currently saved for the selected survey. Missing ages appear under “Not reported”.
          The district chart shows the ten districts with the most households.
        </p>
      </section>
    </div>
  )
}
function Reports() {
  const reportTypes = [
    { value: 'overview', label: 'Survey Overview' },
    { value: 'demographics', label: 'Respondent Demographics' },
    { value: 'households', label: 'Household Distribution' },
    { value: 'interviews', label: 'Interview Progress' },
  ]
  const [search, setSearch] = useState('')
  const [surveys, setSurveys] = useState([])
  const [selectedSurvey, setSelectedSurvey] = useState('all')
  const [reportType, setReportType] = useState('overview')
  const [historyType, setHistoryType] = useState('all')
  const [reports, setReports] = useState([])
  const [selectedReport, setSelectedReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function loadSurveys() {
      try {
        const data = await apiRequest(API_BASE_URL + '/surveys/')
        if (!cancelled) setSurveys(data)
      } catch (requestError) {
        if (!cancelled) setError(requestError.message)
      }
    }
    loadSurveys()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadReports() {
      setLoading(true)
      setError('')
      const params = new URLSearchParams()
      if (selectedSurvey !== 'all') params.set('survey', selectedSurvey)
      if (historyType !== 'all') params.set('type', historyType)
      const query = params.toString()
      try {
        const data = await apiRequest(API_BASE_URL + '/reports/' + (query ? '?' + query : ''))
        if (!cancelled) setReports(Array.isArray(data) ? data : [])
      } catch (requestError) {
        if (!cancelled) setError(requestError.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadReports()
    return () => { cancelled = true }
  }, [selectedSurvey, historyType, reloadKey])

  const visibleReports = reports.filter((report) =>
    (report.title + ' ' + report.survey_name + ' ' + report.generated_by_name)
      .toLowerCase()
      .includes(search.toLowerCase()),
  )

  async function generateReport() {
    setGenerating(true)
    setError('')
    try {
      const report = await apiRequest(API_BASE_URL + '/reports/generate/', {
        method: 'POST',
        body: { survey: selectedSurvey, report_type: reportType },
      })
      setSelectedReport(report)
      setReloadKey((current) => current + 1)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setGenerating(false)
    }
  }

  function exportReport(report) {
    const rows = Array.isArray(report?.data_snapshot) ? report.data_snapshot : []
    if (rows.length === 0) return
    const columns = Object.keys(rows[0])
    const csvRows = [
      ['Report', report.title],
      ['Survey', report.survey_name],
      ['Generated', report.generated_at],
      [],
      columns,
      ...rows.map((row) => columns.map((column) => row[column] ?? '')),
    ]
    const csv = csvRows.map((row) => row.map((value) => '"' + String(value).replaceAll('"', '""') + '"').join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'report-' + report.id + '.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  function formatDate(value) {
    if (!value) return '—'
    return new Date(value).toLocaleString()
  }

  function formatLabel(value) {
    return String(value).replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
  }

  const summaryEntries = selectedReport
    ? Object.entries(selectedReport.summary || {})
    : []

  return (
    <div style={{ display: 'grid', gap: '14px' }}>
      <section className="panel survey-management">
        <div className="report-generator">
          <label>
            Survey
            <select value={selectedSurvey} onChange={(event) => setSelectedSurvey(event.target.value)}>
              <option value="all">All surveys</option>
              {surveys.map((survey) => <option key={survey.id} value={survey.id}>{survey.name}</option>)}
            </select>
          </label>
          <label>
            Report type
            <select value={reportType} onChange={(event) => setReportType(event.target.value)}>
              {reportTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
            </select>
          </label>
          <button className="primary-button" type="button" onClick={generateReport} disabled={generating || surveys.length === 0}>
            {generating ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
        {surveys.length === 0 && <p className="empty-state">Create a survey before generating reports.</p>}
        {error && <p role="alert" className="form-error">{error}</p>}
      </section>

      <section className="panel survey-management">
        <div className="survey-toolbar report-history-toolbar">
          <input
            type="search"
            placeholder="Search generated reports..."
            aria-label="Search generated reports"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select aria-label="Filter generated reports by type" value={historyType} onChange={(event) => setHistoryType(event.target.value)}>
            <option value="all">All report types</option>
            {reportTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
          </select>
          <button className="secondary-button" type="button" onClick={() => setReloadKey((current) => current + 1)} disabled={loading}>Refresh</button>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr><th>Report ID</th><th>Report Name</th><th>Survey</th><th>Date Generated</th><th>Generated By</th><th>Rows</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="empty-state">Loading report history...</td></tr>
              ) : visibleReports.map((report) => (
                <tr key={report.id}>
                  <td>RPT-{String(report.id).padStart(6, '0')}</td>
                  <td>{report.title}</td>
                  <td>{report.survey_name}</td>
                  <td>{formatDate(report.generated_at)}</td>
                  <td>{report.generated_by_name}</td>
                  <td>{report.row_count}</td>
                  <td className="row-actions">
                    <button className="secondary-button" type="button" onClick={() => setSelectedReport(report)}>Preview</button>
                    <button className="secondary-button" type="button" onClick={() => exportReport(report)}>Export CSV</button>
                  </td>
                </tr>
              ))}
              {!loading && visibleReports.length === 0 && (
                <tr><td colSpan="7" className="empty-state">No generated reports match these filters. Choose a report above to generate one.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <span>Showing {visibleReports.length} of {reports.length} generated reports</span>
        </div>
      </section>

      {selectedReport && (
        <section className="panel report-preview">
          <div className="report-preview-heading">
            <div>
              <h3>{selectedReport.title}</h3>
              <p>{selectedReport.survey_name} · Generated {formatDate(selectedReport.generated_at)}</p>
            </div>
            <div>
              <button className="secondary-button" type="button" onClick={() => exportReport(selectedReport)}>Export CSV</button>
              <button className="secondary-button" type="button" onClick={() => setSelectedReport(null)}>Close preview</button>
            </div>
          </div>

          <div className="metric-grid report-summary">
            {summaryEntries.map(([label, value]) => (
              <MetricCard key={label} label={formatLabel(label)} value={label === 'completion_rate' ? value + '%' : Number.isFinite(value) ? value.toLocaleString() : value} note="Report snapshot" />
            ))}
          </div>

          <div className="table-scroll">
            {selectedReport.data_snapshot?.length ? (
              <table>
                <thead><tr>{Object.keys(selectedReport.data_snapshot[0]).map((column) => <th key={column}>{formatLabel(column)}</th>)}</tr></thead>
                <tbody>
                  {selectedReport.data_snapshot.map((row, index) => (
                    <tr key={index}>
                      {Object.keys(selectedReport.data_snapshot[0]).map((column) => <td key={column}>{row[column] ?? '—'}{column === 'share_pct' ? '%' : ''}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="empty-state">This report contains no rows for the selected data.</p>}
          </div>
        </section>
      )}
    </div>
  )
}function UserManagement() {
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






