import React, { useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'agenda-inteligente-v2'
const SETTINGS_KEY = 'agenda-inteligente-settings'
const GOALS_KEY = 'agenda-inteligente-goals'
const notesSeed = `Exemplos de comandos rápidos:\n- amanhã 14h estudar matemática urgente\n- sexta 16h organizar a semana\n- domingo 19h planejar próxima semana`

function pad(n) {
  return String(n).padStart(2, '0')
}

function formatDate(date) {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(date))
}

function formatDateTime(date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

function inputDateTime(date = new Date()) {
  const d = new Date(date)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function startOfWeek(date) {
  const d = new Date(date)
  const day = d.getDay()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - day)
  return d
}

function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function isSameDay(a, b) {
  const da = new Date(a)
  const db = new Date(b)
  return da.getDate() === db.getDate() && da.getMonth() === db.getMonth() && da.getFullYear() === db.getFullYear()
}

function taskEmoji(priority) {
  if (priority === 'alta') return '🔥'
  if (priority === 'média') return '✅'
  return '📝'
}

function parseQuick(text) {
  const raw = text.trim()
  const lower = raw.toLowerCase()
  const now = new Date()
  let when = new Date(now)
  when.setHours(9, 0, 0, 0)
  let priority = 'média'
  let category = 'geral'

  const hourMatch = lower.match(/(\d{1,2})(?::|h)?(\d{2})?/) 
  if (hourMatch) {
    const hour = Number(hourMatch[1])
    const min = Number(hourMatch[2] || 0)
    if (hour >= 0 && hour <= 23 && min >= 0 && min <= 59) when.setHours(hour, min, 0, 0)
  }

  const dayMap = [
    ['domingo', 0],
    ['segunda', 1],
    ['terça', 2],
    ['terca', 2],
    ['quarta', 3],
    ['quinta', 4],
    ['sexta', 5],
    ['sábado', 6],
    ['sabado', 6],
  ]

  if (lower.includes('amanhã') || lower.includes('amanha')) when = addDays(when, 1)
  if (lower.includes('hoje')) when = new Date(when)
  dayMap.forEach(([label, num]) => {
    if (lower.includes(label)) {
      const diff = (num - now.getDay() + 7) % 7 || 7
      when = addDays(when, diff)
    }
  })

  if (lower.includes('urgente') || lower.includes('importante') || lower.includes('foco')) priority = 'alta'
  if (lower.includes('leve') || lower.includes('depois')) priority = 'baixa'

  if (lower.includes('estudar') || lower.includes('prova') || lower.includes('revisar')) category = 'estudo'
  if (lower.includes('treino') || lower.includes('academia')) category = 'treino'
  if (lower.includes('trabalho') || lower.includes('reunião') || lower.includes('reuniao')) category = 'trabalho'
  if (lower.includes('comprar') || lower.includes('mercado') || lower.includes('casa')) category = 'pessoal'

  const title = raw
    .replace(/amanhã|amanha|hoje|segunda|terça|terca|quarta|quinta|sexta|sábado|sabado|domingo/gi, '')
    .replace(/urgente|importante|leve|depois|foco/gi, '')
    .replace(/\d{1,2}(:\d{2})?|\d{1,2}h\d{0,2}/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  return {
    title: title ? title.charAt(0).toUpperCase() + title.slice(1) : raw,
    datetime: when.toISOString(),
    priority,
    category,
    done: false,
  }
}

function getSuggestion(tasks) {
  const pending = tasks.filter(t => !t.done)
  const high = pending.filter(t => t.priority === 'alta').length
  const study = pending.filter(t => t.category === 'estudo').length
  if (!pending.length) return 'Semana zerada. Defina 3 metas novas e mantenha o ritmo.'
  if (high >= 4) return 'Você está com muita prioridade alta. Tente reduzir para 3 focos principais por dia.'
  if (study >= 3) return 'Bom volume de estudo. Separe blocos curtos e revisões rápidas para não cansar.'
  return 'Sua semana está equilibrada. Mantenha o que é prioridade no começo do dia.'
}

function buildSummary(tasks, goals) {
  const pending = tasks.filter(t => !t.done).sort((a,b) => new Date(a.datetime) - new Date(b.datetime))
  const today = new Date()
  const todays = pending.filter(t => isSameDay(t.datetime, today))
  const openGoals = goals.filter(g => !g.done)
  const lines = [
    '📅 *Agenda Inteligente*',
    '',
    '*Hoje*'
  ]
  if (todays.length) {
    todays.forEach((t, i) => lines.push(`${i + 1}. ${taskEmoji(t.priority)} ${t.title} — ${formatDateTime(t.datetime)}`))
  } else {
    lines.push('Sem tarefas marcadas para hoje.')
  }
  lines.push('', '*Próximos passos*')
  pending.slice(0, 6).forEach((t, i) => lines.push(`${i + 1}. ${t.title} — ${formatDateTime(t.datetime)}`))
  lines.push('', '*Metas da semana*')
  if (openGoals.length) {
    openGoals.slice(0, 4).forEach((g, i) => lines.push(`${i + 1}. ${g.title}`))
  } else {
    lines.push('Metas concluídas ou não definidas.')
  }
  return lines.join('\n')
}

const initialTasks = [
  { id: 1, title: 'Revisar matemática', datetime: new Date(new Date().setHours(19, 0, 0, 0)).toISOString(), priority: 'alta', category: 'estudo', done: false },
  { id: 2, title: 'Treino', datetime: new Date(new Date().setHours(21, 0, 0, 0)).toISOString(), priority: 'média', category: 'treino', done: false },
  { id: 3, title: 'Planejar a semana', datetime: addDays(new Date(), 1).toISOString(), priority: 'alta', category: 'pessoal', done: false },
]

const initialGoals = [
  { id: 1, title: 'Cumprir 3 blocos de estudo na semana', done: false },
  { id: 2, title: 'Treinar pelo menos 4 vezes', done: false },
]

export default function App() {
  const [tab, setTab] = useState('hoje')
  const [tasks, setTasks] = useState(initialTasks)
  const [goals, setGoals] = useState(initialGoals)
  const [quick, setQuick] = useState('')
  const [manualTitle, setManualTitle] = useState('')
  const [manualDate, setManualDate] = useState(inputDateTime())
  const [manualPriority, setManualPriority] = useState('média')
  const [manualCategory, setManualCategory] = useState('geral')
  const [goalInput, setGoalInput] = useState('')
  const [notes, setNotes] = useState(notesSeed)
  const [settings, setSettings] = useState({ notifications: false, installTipClosed: false })
  const [installEvent, setInstallEvent] = useState(null)

  useEffect(() => {
    const savedTasks = localStorage.getItem(STORAGE_KEY)
    const savedGoals = localStorage.getItem(GOALS_KEY)
    const savedSettings = localStorage.getItem(SETTINGS_KEY)
    const savedNotes = localStorage.getItem('agenda-notes')
    if (savedTasks) setTasks(JSON.parse(savedTasks))
    if (savedGoals) setGoals(JSON.parse(savedGoals))
    if (savedSettings) setSettings(JSON.parse(savedSettings))
    if (savedNotes) setNotes(savedNotes)
  }, [])

  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)), [tasks])
  useEffect(() => localStorage.setItem(GOALS_KEY, JSON.stringify(goals)), [goals])
  useEffect(() => localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)), [settings])
  useEffect(() => localStorage.setItem('agenda-notes', notes), [notes])

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setInstallEvent(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

  const weekStart = startOfWeek(new Date())
  const week = [...Array(7)].map((_, i) => addDays(weekStart, i))
  const today = new Date()

  const todayTasks = useMemo(() => tasks.filter(t => isSameDay(t.datetime, today)).sort((a,b) => new Date(a.datetime) - new Date(b.datetime)), [tasks])
  const pendingTasks = useMemo(() => tasks.filter(t => !t.done), [tasks])
  const suggestion = useMemo(() => getSuggestion(tasks), [tasks])
  const summary = useMemo(() => buildSummary(tasks, goals), [tasks, goals])
  const progress = useMemo(() => {
    const total = tasks.length || 1
    const done = tasks.filter(t => t.done).length
    return Math.round((done / total) * 100)
  }, [tasks])

  function addQuickTask() {
    if (!quick.trim()) return
    const task = parseQuick(quick)
    setTasks(prev => [...prev, { id: Date.now(), ...task }])
    setQuick('')
    setTab('hoje')
  }

  function addManualTask() {
    if (!manualTitle.trim()) return
    setTasks(prev => [...prev, {
      id: Date.now(),
      title: manualTitle.trim(),
      datetime: new Date(manualDate).toISOString(),
      priority: manualPriority,
      category: manualCategory,
      done: false,
    }])
    setManualTitle('')
  }

  function toggleTask(id) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }

  function deleteTask(id) {
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  function autoPlan() {
    const pending = tasks.filter(t => !t.done).sort((a,b) => {
      const pa = tScore(a.priority)
      const pb = tScore(b.priority)
      return pa - pb
    })
    const finished = tasks.filter(t => t.done)
    const base = new Date()
    base.setHours(8, 0, 0, 0)
    const rescheduled = pending.map((t, i) => {
      const slot = new Date(base)
      slot.setDate(slot.getDate() + Math.floor(i / 3))
      slot.setHours(8 + (i % 3) * 4, 0, 0, 0)
      return { ...t, datetime: slot.toISOString() }
    })
    setTasks([...finished, ...rescheduled])
  }

  function tScore(p) {
    if (p === 'alta') return 0
    if (p === 'média') return 1
    return 2
  }

  function addGoal() {
    if (!goalInput.trim()) return
    setGoals(prev => [...prev, { id: Date.now(), title: goalInput.trim(), done: false }])
    setGoalInput('')
  }

  function toggleGoal(id) {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, done: !g.done } : g))
  }

  function deleteGoal(id) {
    setGoals(prev => prev.filter(g => g.id !== id))
  }

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(summary)
      alert('Resumo copiado para colar no WhatsApp.')
    } catch {
      alert('Não consegui copiar automaticamente.')
    }
  }

  async function enableNotifications() {
    if (!('Notification' in window)) {
      alert('Seu navegador não suporta notificações.')
      return
    }
    const permission = await Notification.requestPermission()
    const allowed = permission === 'granted'
    setSettings(prev => ({ ...prev, notifications: allowed }))
    if (allowed) {
      new Notification('Lembretes ativados', { body: 'Sua agenda vai poder te avisar no navegador.' })
    }
  }

  async function installApp() {
    if (!installEvent) {
      alert('No iPhone, abra no Safari e toque em Compartilhar > Adicionar à Tela de Início.')
      return
    }
    installEvent.prompt()
    await installEvent.userChoice
    setInstallEvent(null)
  }

  const upcoming = week.map(day => ({
    day,
    count: pendingTasks.filter(t => isSameDay(t.datetime, day)).length,
    tasks: tasks.filter(t => isSameDay(t.datetime, day)).sort((a,b) => new Date(a.datetime) - new Date(b.datetime))
  }))

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <div className="pill">Agenda Inteligente</div>
          <h1>Seu planner estilo Foquinha</h1>
          <p>Metas, lembretes, tarefas e resumo semanal no celular.</p>
        </div>
        <button className="primary small" onClick={installApp}>Instalar app</button>
      </header>

      {!settings.installTipClosed && (
        <section className="install-card">
          <div>
            <strong>Use como app no celular</strong>
            <p>No Android toque em “Instalar”. No iPhone abra no Safari e use “Adicionar à Tela de Início”.</p>
          </div>
          <button className="ghost" onClick={() => setSettings(prev => ({ ...prev, installTipClosed: true }))}>Fechar</button>
        </section>
      )}

      <section className="hero-card">
        <div>
          <span className="muted">Progresso da semana</span>
          <h2>{progress}% concluído</h2>
          <p>{suggestion}</p>
        </div>
        <div className="hero-stats">
          <div><strong>{tasks.length}</strong><span>Tarefas</span></div>
          <div><strong>{pendingTasks.length}</strong><span>Pendentes</span></div>
          <div><strong>{goals.filter(g => !g.done).length}</strong><span>Metas</span></div>
        </div>
      </section>

      <section className="quick-card">
        <h3>Adicionar rápido</h3>
        <div className="row">
          <input value={quick} onChange={e => setQuick(e.target.value)} placeholder="amanhã 14h estudar biologia urgente" />
          <button className="primary icon" onClick={addQuickTask}>+</button>
        </div>
        <div className="chips">
          {['hoje 19h revisar redação', 'amanhã 21h treino', 'domingo 18h planejar semana'].map(text => (
            <button key={text} className="chip" onClick={() => setQuick(text)}>{text}</button>
          ))}
        </div>
      </section>

      <nav className="tabs">
        {['hoje', 'semana', 'metas', 'mais'].map(item => (
          <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item}</button>
        ))}
      </nav>

      <main className="content">
        {tab === 'hoje' && (
          <>
            <section className="card">
              <div className="section-head">
                <h3>Hoje</h3>
                <button className="ghost" onClick={autoPlan}>Auto planejar</button>
              </div>
              {todayTasks.length ? todayTasks.map(task => (
                <TaskItem key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} />
              )) : <Empty text="Nada marcado para hoje." />}
            </section>

            <section className="card">
              <h3>Resumo do WhatsApp</h3>
              <textarea value={summary} readOnly rows={10} />
              <button className="primary full" onClick={copySummary}>Copiar resumo</button>
            </section>
          </>
        )}

        {tab === 'semana' && (
          <section className="card">
            <h3>Planejamento da semana</h3>
            <div className="week-grid">
              {upcoming.map(({ day, count, tasks: dayTasks }) => (
                <div key={String(day)} className="day-card">
                  <div className="day-head">
                    <strong>{formatDate(day)}</strong>
                    <span>{count} pend.</span>
                  </div>
                  <div className="mini-list">
                    {dayTasks.length ? dayTasks.slice(0, 3).map(task => (
                      <div key={task.id} className={`mini-task ${task.done ? 'done' : ''}`}>{taskEmoji(task.priority)} {task.title}</div>
                    )) : <span className="muted">Livre</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {tab === 'metas' && (
          <>
            <section className="card">
              <h3>Metas da semana</h3>
              <div className="row">
                <input value={goalInput} onChange={e => setGoalInput(e.target.value)} placeholder="Ex.: estudar 5 horas nesta semana" />
                <button className="primary" onClick={addGoal}>Adicionar</button>
              </div>
              <div className="stack">
                {goals.map(goal => (
                  <div key={goal.id} className="goal-item">
                    <label>
                      <input type="checkbox" checked={goal.done} onChange={() => toggleGoal(goal.id)} />
                      <span className={goal.done ? 'done' : ''}>{goal.title}</span>
                    </label>
                    <button className="delete" onClick={() => deleteGoal(goal.id)}>✕</button>
                  </div>
                ))}
              </div>
            </section>
            <section className="card">
              <h3>Plano inteligente</h3>
              <ul className="smart-list">
                <li>Defina no máximo 3 prioridades altas por dia.</li>
                <li>Use o auto planejar quando a semana travar.</li>
                <li>Copie o resumo no WhatsApp para revisar manhã e noite.</li>
              </ul>
            </section>
          </>
        )}

        {tab === 'mais' && (
          <>
            <section className="card">
              <h3>Nova tarefa manual</h3>
              <div className="stack">
                <input value={manualTitle} onChange={e => setManualTitle(e.target.value)} placeholder="Título da tarefa" />
                <input type="datetime-local" value={manualDate} onChange={e => setManualDate(e.target.value)} />
                <div className="row">
                  <select value={manualPriority} onChange={e => setManualPriority(e.target.value)}>
                    <option value="alta">Alta</option>
                    <option value="média">Média</option>
                    <option value="baixa">Baixa</option>
                  </select>
                  <select value={manualCategory} onChange={e => setManualCategory(e.target.value)}>
                    <option value="geral">Geral</option>
                    <option value="estudo">Estudo</option>
                    <option value="treino">Treino</option>
                    <option value="trabalho">Trabalho</option>
                    <option value="pessoal">Pessoal</option>
                  </select>
                </div>
                <button className="primary full" onClick={addManualTask}>Salvar tarefa</button>
              </div>
            </section>

            <section className="card">
              <div className="section-head">
                <h3>Lembretes</h3>
                <button className="ghost" onClick={enableNotifications}>{settings.notifications ? 'Ativado' : 'Ativar'}</button>
              </div>
              <p className="muted">Ative para permitir notificações do navegador. Em muitos celulares isso funciona melhor quando o app está instalado na tela inicial.</p>
            </section>

            <section className="card">
              <h3>Anotações rápidas</h3>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={8} />
            </section>
          </>
        )}
      </main>
    </div>
  )
}

function TaskItem({ task, onToggle, onDelete }) {
  return (
    <div className="task-item">
      <label className="task-main">
        <input type="checkbox" checked={task.done} onChange={() => onToggle(task.id)} />
        <div>
          <div className={`task-title ${task.done ? 'done' : ''}`}>{task.title}</div>
          <div className="task-meta">{taskEmoji(task.priority)} {task.priority} · {task.category} · {formatDateTime(task.datetime)}</div>
        </div>
      </label>
      <button className="delete" onClick={() => onDelete(task.id)}>✕</button>
    </div>
  )
}

function Empty({ text }) {
  return <div className="empty">{text}</div>
}
