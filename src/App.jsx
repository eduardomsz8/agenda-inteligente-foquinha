import { useEffect, useMemo, useState } from "react";

const initialGoals = [
  { id: 1, title: "Organizar semana", target: 1, current: 0 },
  { id: 2, title: "Cumprir tarefas importantes", target: 5, current: 0 },
];

function formatDateDisplay(dateStr, timeStr) {
  if (!dateStr) return "Sem data";
  try {
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}${timeStr ? ` • ${timeStr}` : ""}`;
  } catch {
    return `${dateStr}${timeStr ? ` • ${timeStr}` : ""}`;
  }
}

function isToday(dateStr) {
  if (!dateStr) return false;
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  return dateStr === `${y}-${m}-${d}`;
}

function buildWhatsappSummary(tasks) {
  const pending = tasks
    .filter((t) => !t.done)
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));

  const todayItems = pending.filter((t) => isToday(t.date));
  const lines = ["🗓️ *Agenda Inteligente*", ""];

  lines.push("*Hoje*");
  if (!todayItems.length) {
    lines.push("Sem tarefas para hoje.");
  } else {
    todayItems.forEach((task, i) => {
      const emoji = task.priority === "alta" ? "🔥" : "✅";
      lines.push(
        `${i + 1}. ${emoji} ${task.title} — ${formatDateDisplay(task.date, task.time)}`
      );
    });
  }

  lines.push("", "*Próximos passos*");
  if (!pending.length) {
    lines.push("Tudo concluído ✅");
  } else {
    pending.slice(0, 5).forEach((task, i) => {
      lines.push(
        `${i + 1}. ${task.title} — ${formatDateDisplay(task.date, task.time)}`
      );
    });
  }

  return lines.join("\n");
}

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [goals, setGoals] = useState(initialGoals);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [priority, setPriority] = useState("média");
  const [activeTab, setActiveTab] = useState("hoje");
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [installTip, setInstallTip] = useState(true);

  useEffect(() => {
    const savedTasks = localStorage.getItem("foquinha_tasks_v2");
    const savedGoals = localStorage.getItem("foquinha_goals_v2");

    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    } else {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, "0");
      const d = String(now.getDate()).padStart(2, "0");
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      const ty = tomorrow.getFullYear();
      const tm = String(tomorrow.getMonth() + 1).padStart(2, "0");
      const td = String(tomorrow.getDate()).padStart(2, "0");

      setTasks([
        {
          id: 1,
          title: "Revisar matemática",
          date: `${y}-${m}-${d}`,
          time: "19:00",
          priority: "alta",
          done: false,
        },
        {
          id: 2,
          title: "Treino",
          date: `${y}-${m}-${d}`,
          time: "21:00",
          priority: "média",
          done: false,
        },
        {
          id: 3,
          title: "Planejar a semana",
          date: `${ty}-${tm}-${td}`,
          time: "18:00",
          priority: "alta",
          done: false,
        },
      ]);
    }

    if (savedGoals) {
      setGoals(JSON.parse(savedGoals));
    }

    if ("Notification" in window && Notification.permission === "granted") {
      setNotifEnabled(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("foquinha_tasks_v2", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem("foquinha_goals_v2", JSON.stringify(goals));
  }, [goals]);

  const pending = tasks.filter((t) => !t.done).length;
  const completed = tasks.filter((t) => t.done).length;
  const weekProgress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  const orderedTasks = useMemo(() => {
    return [...tasks].sort((a, b) =>
      `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)
    );
  }, [tasks]);

  const todayTasks = useMemo(
    () => orderedTasks.filter((task) => !task.done && isToday(task.date)),
    [orderedTasks]
  );

  const otherTasks = useMemo(
    () => orderedTasks.filter((task) => !task.done && !isToday(task.date)),
    [orderedTasks]
  );

  const whatsappSummary = useMemo(() => buildWhatsappSummary(tasks), [tasks]);

  function enableNotifications() {
    if (!("Notification" in window)) {
      alert("Seu navegador não suporta notificações.");
      return;
    }

    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        setNotifEnabled(true);
        new Notification("Notificações ativadas", {
          body: "Seus lembretes da rotina estão prontos.",
        });
      }
    });
  }

  function addTask() {
    if (!title.trim() || !date || !time) {
      alert("Preencha nome, data e horário.");
      return;
    }

    const newTask = {
      id: Date.now(),
      title: title.trim(),
      date,
      time,
      priority,
      done: false,
    };

    setTasks((prev) => [...prev, newTask]);
    setTitle("");
    setDate("");
    setTime("");
    setPriority("média");
  }

  function toggleTask(id) {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== id) return task;

        const updated = { ...task, done: !task.done };

        if (!task.done) {
          setGoals((oldGoals) =>
            oldGoals.map((goal) =>
              goal.id === 2
                ? { ...goal, current: Math.min(goal.target, goal.current + 1) }
                : goal
            )
          );
        }

        return updated;
      })
    );
  }

  function deleteTask(id) {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  }

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(whatsappSummary);
      alert("Resumo copiado.");
    } catch {
      alert("Não consegui copiar o resumo.");
    }
  }

  const tabButton = (key, label) => (
    <button
      onClick={() => setActiveTab(key)}
      style={{
        ...styles.tab,
        ...(activeTab === key ? styles.tabActive : {}),
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.badge}>Agenda Inteligente</div>

        <div style={styles.heroRow}>
          <div>
            <h1 style={styles.title}>Seu planner estilo Foquinha</h1>
            <p style={styles.subtitle}>
              Metas, lembretes, tarefas e resumo semanal no celular.
            </p>
          </div>

          <button style={styles.installButton}>Instalar app</button>
        </div>

        {installTip && (
          <div style={styles.infoCard}>
            <div>
              <div style={styles.infoTitle}>Use como app no celular</div>
              <div style={styles.infoText}>
                No Android toque em “Instalar”. No iPhone abra no Safari e use
                “Adicionar à Tela de Início”.
              </div>
            </div>
            <button style={styles.lightButton} onClick={() => setInstallTip(false)}>
              Fechar
            </button>
          </div>
        )}

        <div style={styles.progressCard}>
          <div style={styles.progressLabel}>Progresso da semana</div>
          <div style={styles.progressBig}>{weekProgress}% concluído</div>
          <div style={styles.progressText}>
            Sua semana está equilibrada. Mantenha o que é prioridade no começo do dia.
          </div>

          <div style={styles.statsRow}>
            <div style={styles.statBox}>
              <div style={styles.statNumber}>{tasks.length}</div>
              <div style={styles.statLabel}>Tarefas</div>
            </div>
            <div style={styles.statBox}>
              <div style={styles.statNumber}>{pending}</div>
              <div style={styles.statLabel}>Pendentes</div>
            </div>
            <div style={styles.statBox}>
              <div style={styles.statNumber}>{goals.length}</div>
              <div style={styles.statLabel}>Metas</div>
            </div>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.sectionTop}>
            <div style={styles.sectionTitle}>Nova tarefa</div>
            <button style={styles.outlineButton} onClick={enableNotifications}>
              {notifEnabled ? "Notificações ativas" : "🔔 Ativar notificações"}
            </button>
          </div>

          <div style={styles.formGrid}>
            <input
              style={styles.input}
              placeholder="Nome da tarefa"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <input
              style={styles.input}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />

            <input
              style={styles.input}
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />

            <div style={styles.priorityRow}>
              <button
                style={{
                  ...styles.priorityButton,
                  ...(priority === "alta" ? styles.priorityActive : {}),
                }}
                onClick={() => setPriority("alta")}
              >
                Alta
              </button>
              <button
                style={{
                  ...styles.priorityButton,
                  ...(priority === "média" ? styles.priorityActive : {}),
                }}
                onClick={() => setPriority("média")}
              >
                Média
              </button>
            </div>

            <button style={styles.addButton} onClick={addTask}>
              + Adicionar tarefa
            </button>
          </div>
        </div>

        <div style={styles.tabsRow}>
          {tabButton("hoje", "Hoje")}
          {tabButton("semana", "Semana")}
          {tabButton("metas", "Metas")}
          {tabButton("mais", "Mais")}
        </div>

        {(activeTab === "hoje" || activeTab === "semana") && (
          <div style={styles.card}>
            <div style={styles.sectionTop}>
              <div style={styles.sectionTitle}>
                {activeTab === "hoje" ? "Hoje" : "Semana"}
              </div>
              <button style={styles.lightButton}>Auto planejar</button>
            </div>

            <div style={styles.taskList}>
              {todayTasks.length > 0 && (
                <>
                  <div style={styles.groupLabel}>Hoje</div>
                  {todayTasks.map((task) => (
                    <TaskItem key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} />
                  ))}
                </>
              )}

              {otherTasks.length > 0 && (
                <>
                  <div style={styles.groupLabel}>Próximas</div>
                  {otherTasks.map((task) => (
                    <TaskItem key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} />
                  ))}
                </>
              )}

              {todayTasks.length === 0 && otherTasks.length === 0 && (
                <div style={styles.emptyState}>Nenhuma tarefa pendente. Boa.</div>
              )}
            </div>
          </div>
        )}

        {(activeTab === "metas" || activeTab === "mais") && (
          <div style={styles.card}>
            <div style={styles.sectionTitle}>Metas da rotina</div>

            <div style={{ marginTop: 16 }}>
              {goals.map((goal) => {
                const percent = Math.round((goal.current / goal.target) * 100);
                return (
                  <div key={goal.id} style={styles.goalItem}>
                    <div style={styles.goalTop}>
                      <span style={styles.goalTitle}>{goal.title}</span>
                      <span style={styles.goalCount}>
                        {goal.current}/{goal.target}
                      </span>
                    </div>
                    <div style={styles.goalBarBg}>
                      <div style={{ ...styles.goalBar, width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={styles.card}>
          <div style={styles.sectionTitle}>Resumo do WhatsApp</div>
          <textarea style={styles.textarea} readOnly value={whatsappSummary} />
          <button style={styles.copyButton} onClick={copySummary}>
            Copiar resumo
          </button>
        </div>
      </div>
    </div>
  );
}

function TaskItem({ task, onToggle, onDelete }) {
  return (
    <div style={styles.taskItem}>
      <input
        type="checkbox"
        checked={task.done}
        onChange={() => onToggle(task.id)}
        style={styles.checkbox}
      />

      <div style={{ flex: 1 }}>
        <div style={styles.taskTitle}>{task.title}</div>
        <div style={styles.taskMeta}>
          {task.priority === "alta" ? "🔥 alta" : "✅ média"} · {formatDateDisplay(task.date, task.time)}
        </div>
      </div>

      <button style={styles.deleteButton} onClick={() => onDelete(task.id)}>
        ×
      </button>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f3f4f6",
    padding: "24px 16px 40px",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    color: "#0f172a",
  },
  container: {
    maxWidth: 430,
    margin: "0 auto",
  },
  badge: {
    display: "inline-block",
    padding: "10px 14px",
    borderRadius: 999,
    background: "#e5e7eb",
    fontWeight: 700,
    fontSize: 14,
    marginBottom: 16,
  },
  heroRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 20,
  },
  title: {
    margin: 0,
    fontSize: 28,
    lineHeight: 1.15,
    fontWeight: 800,
  },
  subtitle: {
    marginTop: 12,
    color: "#64748b",
    fontSize: 16,
    lineHeight: 1.5,
    maxWidth: 250,
  },
  installButton: {
    border: "none",
    background: "#0f172a",
    color: "white",
    padding: "16px 18px",
    borderRadius: 18,
    fontWeight: 800,
    fontSize: 15,
    cursor: "pointer",
    minWidth: 98,
  },
  infoCard: {
    background: "#ffffff",
    borderRadius: 24,
    padding: 18,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
    boxShadow: "0 2px 10px rgba(15,23,42,0.04)",
  },
  infoTitle: {
    fontWeight: 800,
    fontSize: 16,
    marginBottom: 6,
  },
  infoText: {
    color: "#64748b",
    fontSize: 14,
    lineHeight: 1.45,
  },
  progressCard: {
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    color: "white",
    borderRadius: 28,
    padding: 20,
    marginBottom: 16,
  },
  progressLabel: {
    fontSize: 15,
    opacity: 0.9,
  },
  progressBig: {
    fontSize: 30,
    fontWeight: 800,
    marginTop: 10,
  },
  progressText: {
    marginTop: 10,
    color: "#dbeafe",
    lineHeight: 1.45,
    fontSize: 15,
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 10,
    marginTop: 18,
  },
  statBox: {
    background: "rgba(255,255,255,0.08)",
    borderRadius: 18,
    padding: 16,
    textAlign: "center",
  },
  statNumber: {
    fontWeight: 800,
    fontSize: 28,
  },
  statLabel: {
    marginTop: 6,
    fontSize: 14,
    color: "#e5e7eb",
  },
  card: {
    background: "#ffffff",
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    boxShadow: "0 2px 10px rgba(15,23,42,0.04)",
  },
  sectionTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: 800,
    fontSize: 18,
  },
  outlineButton: {
    border: "1px solid #cbd5e1",
    background: "white",
    color: "#0f172a",
    padding: "10px 14px",
    borderRadius: 16,
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 13,
  },
  lightButton: {
    border: "none",
    background: "#e5e7eb",
    color: "#334155",
    padding: "12px 16px",
    borderRadius: 18,
    fontWeight: 700,
    cursor: "pointer",
  },
  formGrid: {
    display: "grid",
    gap: 10,
  },
  input: {
    width: "100%",
    padding: "16px 18px",
    borderRadius: 18,
    border: "1px solid #cbd5e1",
    fontSize: 14,
    outline: "none",
    background: "#fff",
    boxSizing: "border-box",
  },
  priorityRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
  },
  priorityButton: {
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#0f172a",
    padding: "14px 12px",
    borderRadius: 16,
    fontWeight: 700,
    cursor: "pointer",
  },
  priorityActive: {
    background: "#0f172a",
    color: "#fff",
    border: "1px solid #0f172a",
  },
  addButton: {
    width: "100%",
    borderRadius: 18,
    border: "none",
    background: "#0f172a",
    color: "white",
    fontSize: 16,
    fontWeight: 800,
    padding: "16px 18px",
    cursor: "pointer",
  },
  tabsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 10,
    marginBottom: 16,
  },
  tab: {
    border: "none",
    background: "#e5e7eb",
    color: "#475569",
    borderRadius: 999,
    padding: "13px 10px",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 15,
  },
  tabActive: {
    background: "#0f172a",
    color: "#ffffff",
  },
  taskList: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  groupLabel: {
    fontWeight: 800,
    fontSize: 14,
    color: "#64748b",
    marginTop: 2,
  },
  taskItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "14px 6px",
    borderTop: "1px solid #e5e7eb",
  },
  checkbox: {
    width: 20,
    height: 20,
    flexShrink: 0,
  },
  taskTitle: {
    fontWeight: 700,
    fontSize: 16,
    lineHeight: 1.3,
  },
  taskMeta: {
    marginTop: 4,
    color: "#64748b",
    fontSize: 14,
  },
  deleteButton: {
    border: "none",
    background: "transparent",
    color: "#64748b",
    fontSize: 28,
    cursor: "pointer",
    lineHeight: 1,
  },
  emptyState: {
    padding: "8px 0",
    color: "#64748b",
    fontSize: 15,
  },
  goalItem: {
    marginBottom: 16,
  },
  goalTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 8,
  },
  goalTitle: {
    fontWeight: 700,
  },
  goalCount: {
    color: "#64748b",
    fontWeight: 700,
  },
  goalBarBg: {
    width: "100%",
    height: 10,
    borderRadius: 999,
    background: "#e5e7eb",
    overflow: "hidden",
  },
  goalBar: {
    height: "100%",
    borderRadius: 999,
    background: "#0f172a",
  },
  textarea: {
    width: "100%",
    minHeight: 180,
    resize: "vertical",
    marginTop: 14,
    borderRadius: 18,
    border: "1px solid #cbd5e1",
    padding: 14,
    fontSize: 15,
    lineHeight: 1.5,
    color: "#0f172a",
    boxSizing: "border-box",
  },
  copyButton: {
    width: "100%",
    marginTop: 14,
    border: "none",
    background: "#0f172a",
    color: "#fff",
    padding: "16px 18px",
    borderRadius: 18,
    fontWeight: 800,
    fontSize: 16,
    cursor: "pointer",
  },
};