from pydantic import BaseModel


class Task(BaseModel):
    task_description: str
    done: bool = False
    user_id: int = 1
    expires: str


class TaskEdit(BaseModel):
    edited_description: str
    task_id: int