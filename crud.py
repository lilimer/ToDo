from models import Task


def add_task(db, task: Task) -> int:
    cursor = db.cursor()
    cursor.execute("INSERT INTO tasks (task, done, user_id)" 
                   "VALUES(?, ?, ?)", (task.task_description, task.done, task.user_id))
    db.commit()
    return cursor.lastrowid


def delete_task(db, id):
    cursor = db.cursor()
    cursor.execute("DELETE FROM tasks WHERE id = ?", (id,))
    db.commit()
    return True
