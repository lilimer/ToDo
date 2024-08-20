import sqlite3

from fastapi import FastAPI, Depends, HTTPException, Response
import crud
from db import init_db, get_db
from models import Task

app = FastAPI()


@app.on_event("startup")
async def startup_event():
    init_db()


@app.post('/tasks/add')
async def add_task(task: Task, db: sqlite3.Connection = Depends(get_db)):
    task_id = crud.add_task(db, task)
    return Task(id=task_id,
                task_description=task.task_description,
                done=task.done,
                user_id=task.user_id)


@app.delete('/tasks/{task_id}/delete')
async def delete_task(task: Task, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT 1 FROM tasks WHERE id = ?", (task.id,))
    if not cursor.fetchone():
        raise HTTPException(status_code=404, detail="Task does not exist")

    crud.delete_task(db, task.id)
    db.commit()

    return Response(content="Task deleted", status_code=202)
