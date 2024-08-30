import sqlite3
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Depends, HTTPException, Response
import crud
from db import init_db, get_db
from models import Task, TaskEdit, TaskUpdate, Group

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

    return {"Task deleted"}


@app.delete('/groups/delete')
async def delete_task(group_id: int, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT 1 FROM groups WHERE id = ?", (group_id,))
    if not cursor.fetchone():
        raise HTTPException(status_code=404, detail="Task does not exist")

    crud.delete_group(db, group_id)
    db.commit()

    return {"Task deleted"}


@app.put('/tasks/edit')
async def edit_task(edit: TaskEdit, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT 1 FROM tasks WHERE id = ?", (edit.task_id,))
    if not cursor.fetchone():
        raise HTTPException(status_code=404, detail="Task does not exist")

    crud.edit_task(db, edit.task_id, edit.edited_description)
    db.commit()

    return {"Task edited"}


@app.get('/tasks')
async def get_tasks(db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT id, task, done, user_id, expires, priority, group_id FROM tasks")
    tasks = cursor.fetchall()
    return [{"id": row[0], "task_description": row[1], "done": row[2], "user_id": row[3], "expires": row[4], "priority":row[5], "group_id":row[6]} for row in tasks]


@app.get('/groups')
async def get_groups(db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT id, name FROM groups")
    groups = cursor.fetchall()
    return [{"id": row[0], "group_name": row[1]} for row in groups]


@app.put('/tasks/done')
async def task_done(task_id: int, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT 1 FROM tasks WHERE id = ?", (task_id,))
    if not cursor.fetchone():
        raise HTTPException(status_code=404, detail="Task does not exist")

    crud.task_done(db, task_id)
    db.commit()

    return {"Task status changed"}


@app.put('/tasks/move')
async def move_task(update: TaskUpdate, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT 1 FROM tasks WHERE id = ?", (update.task_id,))
    if not cursor.fetchone():
        raise HTTPException(status_code=404, detail="Task does not exist")
    crud.task_move(db, update.task_id, update.new_group_id)
    db.commit()
    return {"Task group id changed"}


@app.post("/groups/add")
def add_group(group: Group, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("""
        INSERT INTO groups (name)
        VALUES (?)
    """, (group.group_name,))
    db.commit()
    return {"message": "Group added successfully", "group_id": cursor.lastrowid}
