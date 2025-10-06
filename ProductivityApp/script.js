// Select elements
const taskTitle = document.getElementById("task-title");
const taskDesc = document.getElementById("task-desc");
const taskPriority = document.getElementById("task-priority");
const taskCategory = document.getElementById("task-category");
const addTaskBtn = document.getElementById("add-task-btn");
const taskContainer = document.getElementById("task-container");

const filterCategory = document.getElementById("filter-category");
const filterStatus = document.getElementById("filter-status");

// Load tasks from localStorage
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

// Render tasks
function renderTasks() {
  taskContainer.innerHTML = "";
  let filteredTasks = tasks.filter((task) => {
    let categoryMatch =
      filterCategory.value === "all" || task.category === filterCategory.value;
    let statusMatch =
      filterStatus.value === "all" ||
      (filterStatus.value === "completed" && task.completed) ||
      (filterStatus.value === "incomplete" && !task.completed);
    return categoryMatch && statusMatch;
  });

  filteredTasks.forEach((task, index) => {
    const taskCard = document.createElement("div");
    taskCard.className = `task-card ${task.priority}`;
    if (task.completed) taskCard.classList.add("completed");

    taskCard.innerHTML = `
      <div class="task-info">
        <h3>${task.title}</h3>
        <p>${task.description}</p>
        <p><strong>Category:</strong> ${task.category}</p>
      </div>
      <div class="task-actions">
        <button class="complete-btn">${
          task.completed ? "Undo" : "Complete"
        }</button>
        <button class="delete-btn">Delete</button>
      </div>
    `;

    // Complete button
    taskCard.querySelector(".complete-btn").addEventListener("click", () => {
      tasks[index].completed = !tasks[index].completed;
      saveAndRender();
    });

    // Delete button
    taskCard.querySelector(".delete-btn").addEventListener("click", () => {
      if (confirm("Are you sure you want to delete this task?")) {
        tasks.splice(index, 1);
        saveAndRender();
      }
    });

    taskContainer.appendChild(taskCard);
  });
}

// Save tasks to localStorage and re-render
function saveAndRender() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
  renderTasks();
}

// Add new task
addTaskBtn.addEventListener("click", () => {
  const title = taskTitle.value.trim();
  const description = taskDesc.value.trim();
  const priority = taskPriority.value;
  const category = taskCategory.value;

  if (!title) {
    alert("Please enter a task title.");
    return;
  }

  tasks.push({ title, description, priority, category, completed: false });
  taskTitle.value = "";
  taskDesc.value = "";
  taskPriority.value = "medium";
  taskCategory.value = "work";

  saveAndRender();
});

// Filter tasks
filterCategory.addEventListener("change", renderTasks);
filterStatus.addEventListener("change", renderTasks);

// Initial render
renderTasks();
