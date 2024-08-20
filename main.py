import sqlite3
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Depends, HTTPException, Response
import crud
from db import init_db, get_db
from models import Task

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    init_db()


@app.post('/tasks/add')
async def add_task(task: Task, db: sqlite3.Connection = Depends(get_db)):
    crud.add_task(db, task)
    return {"Task added"}


@app.delete('/tasks/delete')
async def delete_task(task_id: int, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT 1 FROM tasks WHERE id = ?", (task_id,))
    if not cursor.fetchone():
        raise HTTPException(status_code=404, detail="Task does not exist")

    crud.delete_task(db, task_id)
    db.commit()

    return Response(content="Task deleted", status_code=202)


@app.get('/tasks')
async def get_tasks(db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT id, task, done, user_id FROM tasks")
    tasks = cursor.fetchall()
    return [{"id": row[0], "task_description": row[1], "done": row[2], "user_id": row[3]} for row in tasks]
