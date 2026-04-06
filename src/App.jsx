import { useState, useEffect } from "react";

export default function App() {

  const [tasks, setTasks] = useState([]);
  const [input, setInput] = useState("");
  const [goals, setGoals] = useState([
    { id: 1, title: "Organizar semana", done: false },
    { id: 2, title: "Cumprir tarefas importantes", done: false }
  ]);

  // carregar tarefas
  useEffect(() => {
    const saved = localStorage.getItem("agenda-tasks");
    if (saved) {
      setTasks(JSON.parse(saved));
    }
  }, []);

  // salvar tarefas
  useEffect(() => {
    localStorage.setItem("agenda-tasks", JSON.stringify(tasks));
  }, [tasks]);

  function enableNotifications() {
    if ("Notification" in window) {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          new Notification("Notificações ativadas!", {
            body: "Você receberá lembretes da sua rotina."
          });
        }
      });
    }
  }

  function addTask() {
    if (!input) return;

    const newTask = {
      id: Date.now(),
      text: input,
      done: false
    };

    setTasks([...tasks, newTask]);
    setInput("");
  }

  function toggleTask(id) {
    setTasks(tasks.map(task =>
      task.id === id
        ? { ...task, done: !task.done }
        : task
    ));
  }

  function deleteTask(id) {
    setTasks(tasks.filter(task => task.id !== id));
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

      <div>
        <input
          placeholder="Digite uma tarefa..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{
            padding: "10px",
            width: "70%",
            borderRadius: "10px"
          }}
        />

        <button
          onClick={addTask}
          style={{
            padding: "10px",
            marginLeft: "5px",
            borderRadius: "10px"
          }}
        >
          +
        </button>
      </div>

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
            textDecoration: task.done ? "line-through" : "none"
          }}>
            {task.text}
          </span>

          <button
            onClick={() => deleteTask(task.id)}
            style={{
              marginLeft: "auto"
            }}
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