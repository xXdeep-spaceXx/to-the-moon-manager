const taskInput = document.getElementById('task-input');
const addBtn = document.getElementById('add-btn');
const taskList = document.getElementById('task-list');
const xpBar = document.getElementById('xp-bar');
const levelText = document.getElementById('level-indicator');

let xp = 0;
let level = 1;
const xpPerTask = 20;

addBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
});

function addTask() {
    const text = taskInput.value;
    if (text === '') return;

    // Create List Item
    const li = document.createElement('li');
    li.innerHTML = `
        <span>${text}</span>
        <button class="delete-btn">x</button>
    `;

    // Add Delete Functionality (completing a task)
    li.querySelector('.delete-btn').addEventListener('click', () => {
        completeTask(li);
    });

    taskList.appendChild(li);
    taskInput.value = '';
}

function completeTask(element) {
    element.remove();
    gainXP();
}

function gainXP() {
    xp += xpPerTask;
    
    // Cap bar at 100% for this prototype
    if (xp > 100) {
        xp = 0;
        level++;
        levelText.innerText = `Level ${level}: Upgraded Ship`;
        // In the future, this is where we swap the image
    }
    
    xpBar.style.width = `${xp}%`;
}
