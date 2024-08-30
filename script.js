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

            const groupSelect = document.getElementById('groupSelect');
            groupSelect.innerHTML = '<option>Select a group</option>'; // Reset dropdown options


            data.forEach(group => {
                const option = document.createElement('option');
                option.value = group.id;
                option.textContent = group.group_name;
                groupSelect.appendChild(option);


                const groupDiv = document.createElement('div');
                groupDiv.className = 'group';
                groupDiv.dataset.id = group.id;
                groupDiv.dataset.name = group.group_name;


                const taskContainer = document.createElement('div');
                taskContainer.className = 'task-container';
                taskContainer.id = `task-container-${group.id}`;
                groupDiv.appendChild(taskContainer);

                groupDiv.ondrop = drop;
                groupDiv.ondragover = allowDrop;

                groupContainer.appendChild(groupDiv);

            });

            fetchTasks(); // Fetch tasks after creating groups
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

function deleteGroup(groupId) {
    fetch(`http://127.0.0.1:8000/groups/delete?group_id=${groupId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    .then(response => {
        if (response.ok) {
            fetchGroups(); // Refresh groups after deletion
        } else {
            return response.json().then(err => { throw err; });
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}




function fetchTasks() {
    fetch('http://127.0.0.1:8000/tasks')
        .then(response => response.json())
        .then(data => {
            // Clear all groups and their contents
            document.querySelectorAll('.group').forEach(container => {
                container.innerHTML = '';
                // Create and add the group title
                const title = document.createElement('p');
                title.className = 'group-title';
                title.textContent = container.dataset.name;
                container.appendChild(title);


                // Create and add the delete button
                const deleteButton = document.createElement('button');
                deleteButton.className = 'delete-button fa-solid fa-trash'; // Use class for styling
                deleteButton.addEventListener('click', () => {
                    if (confirm('Delete group?')) {
                        deleteGroup(container.dataset.id);
                    }
                });
                container.appendChild(deleteButton);
            });

            // Create a map to keep track of which group containers have tasks
            const taskContainers = new Map();

            data.forEach(task => {
                const card = document.createElement('div');
                card.className = 'task-card';
                if (task.done) {
                    card.classList.add('done');
                }
                card.dataset.id = task.id;
                card.innerHTML = `
                    ${task.task_description}<br>
                    <hr>
                    Expires in ${daysUntil(task.expires)} days<br>
                    (${task.expires})
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

                    taskContainer.querySelector('button').style.display = 'none';
                    taskContainer.appendChild(card);
                    taskContainers.set(task.group_id, true);

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
        const groupId = document.getElementById('groupSelect').value;

        if (!groupId) {
        alert('Please select a group.');
        return;
    }

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
                group_id: groupId
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

