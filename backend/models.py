from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserInDB(UserBase):
    hashed_password: str

class AgentBase(BaseModel):
    agent_id: str
    name: Optional[str] = None

class AgentCreate(AgentBase):
    pass

class AgentInDB(AgentBase):
    hashed_api_key: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AlertBase(BaseModel):
    agent_id: str
    source_ip: str
    attack_type: str
    timestamp: datetime

class AlertCreate(AlertBase):
    pass

class AlertInDB(AlertBase):
    id: Optional[str] = Field(None, alias="_id")
    received_at: datetime = Field(default_factory=datetime.utcnow)

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
