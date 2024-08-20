document.addEventListener('DOMContentLoaded', function() {
    function daysUntil(expirationDate) {
        const today = new Date();
        const expireDate = new Date(expirationDate);
        const timeDiff = expireDate - today;
        const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
        return daysDiff;
}
    let selectedTaskId = null;
    function fetchTasks() {
        fetch('http://127.0.0.1:8000/tasks')
            .then(response => response.json())
            .then(data => {
                const taskContainer = document.getElementById('taskContainer');
                taskContainer.innerHTML = '';  // Clear existing tasks
                data.forEach(task => {
                    const card = document.createElement('div');
                    card.className = 'task-card';
                    if (task.done) {
                        card.classList.add('done');
                    }
                    card.dataset.id = task.id;
                    card.innerHTML = `
                        <strong>ID:</strong> ${task.id}<br>
                        <strong>Description:</strong> ${task.task_description}<br>
                        <strong>Done:</strong> ${task.done}<br>
                        <strong>Expires:</strong> ${daysUntil(task.expires)} days (${task.expires})
                    `;
                    card.addEventListener('click', function() {
                    if (selectedTaskId === card.dataset.id) {
                        // Unselect the card if it's already selected
                        card.classList.remove('selected');
                        selectedTaskId = null;
                    } else {
                        // Select the new card
                        document.querySelectorAll('.task-card').forEach(c => c.classList.remove('selected'));
                        card.classList.add('selected');
                        selectedTaskId = card.dataset.id;
                    }
                });
                    taskContainer.appendChild(card);
                });
            })
            .catch(error => {
                console.error('Error:', error);
                responseElement.textContent = `Error fetching tasks: ${error.detail || 'Unknown error'}`;
            });
    }

    fetchTasks();

    const addTaskForm = document.getElementById('addTaskForm');
    const deleteTaskForm = document.getElementById('deleteTaskForm');
    const editTaskForm = document.getElementById('editTaskForm');
    const responseElement = document.getElementById('response');
    const statusTaskForm = document.getElementById('changeStatus');

    addTaskForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const taskDescription = document.getElementById('taskDescription').value;
        const userId = 1;
        const taskExpire = document.getElementById('taskExpire').value;

        fetch('http://127.0.0.1:8000/tasks/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                task_description: taskDescription,
                done: false,
                user_id: userId,
                expires: taskExpire
            }),
        })
        .then(response => response.json())
        .then(data => {
            responseElement.textContent = `Task Added: ID ${data.id}, Description: ${data.task_description}`;
            fetchTasks();
        })
        .catch(error => {
            console.error('Error:', error);
            responseElement.textContent = `Error: ${error.detail || 'Unknown error'}`;
        });
    });

    deleteTaskForm.addEventListener('submit', function(event) {
        event.preventDefault();

        if (selectedTaskId === null) {
            responseElement.textContent = 'No task selected for deletion.';
            return;
        }

        fetch(`http://127.0.0.1:8000/tasks/delete?task_id=${selectedTaskId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        .then(response => {
            if (response.ok) {
                responseElement.textContent = `Task Deleted: ID ${selectedTaskId}`;
                fetchTasks();
                selectedTaskId = null;
            } else {
                return response.json().then(err => { throw err; });
            }
        })
        .catch(error => {
            console.error('Error:', error);
            responseElement.textContent = `Error: ${error.detail || 'Unknown error'}`;
        });
    });

    statusTaskForm.addEventListener('submit', function(event) {
        event.preventDefault();

        if (selectedTaskId === null) {
            responseElement.textContent = 'No task selected.';
            return;
        }

        fetch(`http://127.0.0.1:8000/tasks/done?task_id=${selectedTaskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        .then(response => {
            if (response.ok) {
                responseElement.textContent = `Task done/undone: ID ${selectedTaskId}`;
                fetchTasks();
                selectedTaskId = null;
            } else {
                return response.json().then(err => { throw err; });
            }
        })
        .catch(error => {
            console.error('Error:', error);
            responseElement.textContent = `Error: ${error.detail || 'Unknown error'}`;
        });
    });

    editTaskForm.addEventListener('submit', function(event) {
        event.preventDefault();

        if (selectedTaskId === null) {
            responseElement.textContent = 'No task selected for editing.';
            return;
        }

        const newTaskDescription = document.getElementById('editTaskDescription').value;

        fetch(`http://127.0.0.1:8000/tasks/edit`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                edited_description: newTaskDescription,
                task_id: selectedTaskId
            }),
        })
        .then(response => response.json())
        .then(data => {
            responseElement.textContent = 'Task Edited';
            fetchTasks();
        })
        .catch(error => {
            console.error('Error:', error);
            responseElement.textContent = `Error: ${error.detail || 'Unknown error'}`;
        });
    });



});