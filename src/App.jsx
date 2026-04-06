import { useState, useEffect } from "react";

export default function App() {

  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const [goals, setGoals] = useState([
    { id: 1, title: "Organizar semana", done: false },
    { id: 2, title: "Cumprir tarefas importantes", done: false }
  ]);

  useEffect(() => {
    const saved = localStorage.getItem("agenda_tasks");
    if (saved) {
      setTasks(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("agenda_tasks", JSON.stringify(tasks));
  }, [tasks]);

  function enableNotifications() {

    if ("Notification" in window) {

      Notification.requestPermission().then(permission => {

        if (permission === "granted") {

          new Notification("Notificações ativadas!", {
            body: "Você receberá lembretes das tarefas."
          });

        }

      });

    }

  }

  function addTask() {

    if (!title || !date || !time) return;

    const newTask = {
      id: Date.now(),
      title,
      date,
      time,
      done: false
    };

    setTasks([...tasks, newTask]);

    setTitle("");
    setDate("");
    setTime("");

  }

  function toggleTask(id) {

    setTasks(tasks.map(task =>
      task.id === id
        ? { ...task, done: !task.done }
        : task
    ));

  }

  function deleteTask(id) {

    setTasks(tasks.filter(task =>
      task.id !== id
    ));

  }

  return (

    <div style={{
      maxWidth: "500px",
      margin: "0 auto",
      padding: "20px",
      fontFamily: "sans-serif"
    }}>

      <h1>📅 Agenda Inteligente</h1>

      <button
        onClick={enableNotifications}
        style={{
          padding: "10px",
          marginBottom: "15px",
          borderRadius: "10px"
        }}
      >
        🔔 Ativar notificações
      </button>

      <h2>Nova tarefa</h2>

      <input
        placeholder="Nome da tarefa"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{
          padding: "10px",
          width: "100%",
          borderRadius: "10px",
          marginBottom: "8px"
        }}
      />

      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        style={{
          padding: "10px",
          width: "100%",
          borderRadius: "10px",
          marginBottom: "8px"
        }}
      />

      <input
        type="time"
        value={time}
        onChange={(e) => setTime(e.target.value)}
        style={{
          padding: "10px",
          width: "100%",
          borderRadius: "10px",
          marginBottom: "8px"
        }}
      />

      <button
        onClick={addTask}
        style={{
          padding: "10px",
          borderRadius: "10px"
        }}
      >
        ➕ Adicionar tarefa
      </button>

      <h2 style={{ marginTop: "25px" }}>📌 Tarefas</h2>

      {tasks.map(task => (

        <div key={task.id}
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "8px"
          }}
        >

          <input
            type="checkbox"
            checked={task.done}
            onChange={() => toggleTask(task.id)}
          />

          <span style={{
            marginLeft: "8px",
            flex: 1,
            textDecoration: task.done ? "line-through" : "none"
          }}>

            {task.title}
            <br />
            <small>
              📅 {task.date} ⏰ {task.time}
            </small>

          </span>

          <button
            onClick={() => deleteTask(task.id)}
          >
            ❌
          </button>

        </div>

      ))}

      <h2 style={{ marginTop: "25px" }}>🎯 Metas</h2>

      {goals.map(goal => (

        <div key={goal.id}
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "8px"
          }}
        >

          <input
            type="checkbox"
            checked={goal.done}
            onChange={() =>
              setGoals(goals.map(g =>
                g.id === goal.id
                  ? { ...g, done: !g.done }
                  : g
              ))
            }
          />

          <span style={{ marginLeft: "8px" }}>
            {goal.title}
          </span>

        </div>

      ))}

    </div>

  );

}