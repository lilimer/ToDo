from models import Task


def add_task(db, task: Task) -> int:
    cursor = db.cursor()
    cursor.execute("INSERT INTO tasks (task, done, user_id, expires, priority, group_id)" 
                   "VALUES(?, ?, ?, ?, ?, ?)", (task.task_description, task.done, task.user_id, task.expires, task.priority, task.group_id))
    db.commit()
    return cursor.lastrowid


def delete_task(db, id):
    cursor = db.cursor()
    cursor.execute("DELETE FROM tasks WHERE id = ?", (id,))
    db.commit()
    return True


def edit_task(db, id, desc):
    cursor = db.cursor()
    cursor.execute("UPDATE tasks SET task = ? WHERE id = ?", (desc, id,))
    db.commit()
    return True


def task_done(db, task_id):
    cursor = db.cursor()
    cursor.execute("UPDATE tasks SET done = NOT done WHERE id = ?", (task_id,))
    db.commit()
    return True


def task_move(db, task_id, new_id):
    cursor = db.cursor()
    cursor.execute("UPDATE tasks SET group_id = ? WHERE id = ?", (new_id, task_id,))
    db.commit()
    return True
