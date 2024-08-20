from pydantic import BaseModel


class Task(BaseModel):
    id: int
    task_description: str
    done: bool = False
    user_id: int = 1