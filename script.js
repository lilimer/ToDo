// Define global functions
let selectedTaskId = null;
function allowDrop(ev) {
    ev.preventDefault();
}

function drop(ev) {
    ev.preventDefault();
    const taskId = ev.dataTransfer.getData("text"); // Get the dragged task ID

    // Traverse up the DOM tree to find the nearest parent with a valid group ID
    let dropTarget = ev.target;
    while (dropTarget && !dropTarget.classList.contains('group')) {
        dropTarget = dropTarget.parentElement;
    }

    if (!dropTarget || !dropTarget.dataset.id) {
        console.error('Drop target is not a valid group or has no valid group ID');
        return;
    }

    const groupId = dropTarget.dataset.id; // Get the group ID from the valid drop target

    fetch(`http://127.0.0.1:8000/tasks/move`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            task_id: taskId,
            new_group_id: groupId
        }),
    })
    .then(response => {
        if (response.ok) {
            fetchTasks(); // Refresh tasks to reflect the change
        } else {
            return response.json().then(err => { throw err; });
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}




function fetchGroups() {
    fetch('http://127.0.0.1:8000/groups')
        .then(response => response.json())
        .then(data => {
            const groupContainer = document.getElementById('groupsContainer');
            groupContainer.innerHTML = ''; // Clear existing groups

            data.forEach(group => {
                const groupDiv = document.createElement('div');
                groupDiv.className = 'group';
                groupDiv.dataset.id = group.id; // Use data-id for consistency
                groupDiv.innerHTML = `<h3>${group.name}</h3>`;

                // Create a container within each group div for tasks
                const taskContainer = document.createElement('div');
                taskContainer.className = 'task-container';
                taskContainer.id = `task-container-${group.id}`;
                groupDiv.appendChild(taskContainer);

                groupDiv.ondrop = drop;
                groupDiv.ondragover = allowDrop;

                groupContainer.appendChild(groupDiv);

            });

            // After groups are created, fetch tasks
            fetchTasks(); // No need to pass group IDs here
        })
        .catch(error => {
            console.error('Error:', error);
        });
}




function fetchTasks() {
    fetch('http://127.0.0.1:8000/tasks')
        .then(response => response.json())
        .then(data => {
            document.querySelectorAll('.group').forEach(container => container.innerHTML = '');


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
                card.draggable = true;
                card.addEventListener('dragstart', drag);
                card.addEventListener('click', function() {
                    if (selectedTaskId === card.dataset.id) {
                        card.classList.remove('selected');
                        selectedTaskId = null;
                        document.querySelectorAll('.selectedTaskButton').forEach(button => {
                            button.style.display = 'none';
                        });
                    } else {
                        document.querySelectorAll('.task-card').forEach(c => c.classList.remove('selected'));
                        card.classList.add('selected');
                        selectedTaskId = card.dataset.id;
                        document.querySelectorAll('.selectedTaskButton').forEach(button => {
                            button.style.display = 'block';
                        });
                    }
                });

                const taskContainer = document.querySelector(`.group[data-id='${task.group_id}']`);

                if (taskContainer) {
                    taskContainer.appendChild(card);
                } else {
                    console.error(`No group container found for group_id ${task.group_id}`);
                }
            });
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

function daysUntil(expirationDate) {
    const today = new Date();
    const expireDate = new Date(expirationDate);
    const timeDiff = expireDate - today;
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    return daysDiff;
}

function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.dataset.id);
}

// Setup DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    fetchGroups()
    fetchTasks(); // Initial fetch

    const addTaskForm = document.getElementById('addTaskForm');
    const addGroupForm = document.getElementById('addGroupForm');
    const deleteTaskForm = document.getElementById('deleteTaskForm');
    const editTaskForm = document.getElementById('editTaskForm');
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
                expires: taskExpire,
                group_id: 1 // Default group
            }),
        })
        .then(response => response.json())
        .then(data => {
            fetchTasks();
        })
        .catch(error => {
            console.error('Error:', error);

        });
    });

    addGroupForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const groupName = document.getElementById('groupName').value;

        fetch('http://127.0.0.1:8000/groups/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                group_name: groupName
            }),
        })
        .then(response => response.json())
        .then(data => {
            fetchGroups();
        })
        .catch(error => {
            console.error('Error:', error);

        });
    });

    deleteTaskForm.addEventListener('submit', function(event) {
        event.preventDefault();

        if (selectedTaskId === null) {

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

                fetchTasks();
                selectedTaskId = null;
                document.querySelectorAll('.selectedTaskButton').forEach(button => {
                    button.style.display = 'none';
                });
            } else {
                return response.json().then(err => { throw err; });
            }
        })
        .catch(error => {
            console.error('Error:', error);

        });
    });

    statusTaskForm.addEventListener('submit', function(event) {
        event.preventDefault();

        if (selectedTaskId === null) {

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

                fetchTasks();
                selectedTaskId = null;
                document.querySelectorAll('.selectedTaskButton').forEach(button => {
                    button.style.display = 'none';
                });
            } else {
                return response.json().then(err => { throw err; });
            }
        })
        .catch(error => {
            console.error('Error:', error);

        });
    });

    editTaskForm.addEventListener('submit', function(event) {
        event.preventDefault();

        if (selectedTaskId === null) {

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

            fetchTasks();
            selectedTaskId = null;
            document.querySelectorAll('.selectedTaskButton').forEach(button => {
                button.style.display = 'none';
            });
        })
        .catch(error => {
            console.error('Error:', error);

        });
    });
});

// Define global functions for opening/closing forms
function openAdd() {
    document.getElementById("addForm").style.display = "block";
}

function closeAdd() {
    document.getElementById("addForm").style.display = "none";
}

function openGroup() {
    document.getElementById("addGroup").style.display = "block";
}

function closeGroup() {
    document.getElementById("addGroup").style.display = "none";
}

function openEdit() {
    document.getElementById("editForm").style.display = "block";
}

function closeEdit() {
    document.getElementById("editForm").style.display = "none";
}

