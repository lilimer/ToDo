from pydantic import BaseModel


class Task(BaseModel):
    task_description: str
    done: bool = False
    user_id: int = 1
    expires: str
    priority: int = 1
    group_id: int = 1


class TaskEdit(BaseModel):
    edited_description: str
    task_id: int


class TaskUpdate(BaseModel):
    task_id: int
    new_group_id: int


class Group(BaseModel):
    group_name: str