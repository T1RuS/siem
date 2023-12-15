from typing import Optional

from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import insert
from backend.src.db.models.siem import Siem

import jwt
from datetime import datetime, timedelta
from db.connection_db import engine

from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from fastapi.security.utils import get_authorization_scheme_param
from passlib.context import CryptContext
from pydantic import BaseModel
from starlette.requests import Request
from starlette.status import HTTP_401_UNAUTHORIZED

SECRET_KEY = "my_secret_key"
ALGORITHM = "HS256"
EXPIRATION_TIME = timedelta(minutes=30)


class User(BaseModel):
    username: str
    email: str = None
    full_name: str = None
    disabled: bool  = None
    hashed_password: str  = None


class AuditSystem(BaseModel):
    hostname: str
    port: int
    status_code: int
    act_type: str
    date: datetime
    url: str
    massage: str


def create_jwt_token(data: dict):
    expiration = datetime.utcnow() + EXPIRATION_TIME
    data.update({"exp": expiration})
    token = jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)
    return token


def verify_jwt_token(token: str):
    try:
        decoded_data = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return decoded_data
    except jwt.PyJWTError:
        return None


app = FastAPI()


origins = [
    "http://localhost.tiangolo.com",
    "https://localhost.tiangolo.com",
    "http://localhost",
    "http://localhost:8080",
    "http://localhost:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class OAuth2PasswordBearerCustom(OAuth2PasswordBearer):
    async def __call__(self, request: Request) -> Optional[str]:
        authorization = request.headers.get("Authorization")
        scheme, param = get_authorization_scheme_param(authorization)
        if not authorization or scheme.lower() != "bearer":
            if self.auto_error:
                q = insert(Siem).values(
                    hostname=request.client.host,
                    port=request.client.port,
                    status_code=401,
                    act_type='UNAUTHORIZED',
                    date=datetime.now(),
                    url=request.scope['root_path'] + request.scope['route'].path,
                    massage='Not authenticated'
                )
                conn = engine.connect()
                conn.execute(q)
                conn.commit()
                raise HTTPException(
                    status_code=HTTP_401_UNAUTHORIZED,
                    detail="Not authenticated",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            else:
                return None
        return param


oauth2_scheme = OAuth2PasswordBearerCustom(tokenUrl="/token")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


templates = Jinja2Templates(directory="../../frontend/build")


@app.post("/register")
def register_user(username: str, password: str):
    hashed_password = pwd_context.hash(password)
    # Сохраните пользователя в базе данных
    return {"username": username, "hashed_password": hashed_password}


@app.post("/token")
def authenticate_user(username: str, password: str, request: Request):
    # user = get_user(username)  # Получите пользователя из базы данных
    user = User(
        username='username',
        email='email',
        full_name='full_name',
        disabled=False,
        hashed_password='$2b$12$Jxw7Tximghr6HI2RGGoCl.dK9rjOex6QFFQHslB/th8n1IPz392ha'
    )
    if not user:
        q = insert(Siem).values(
            hostname=request.client.host,
            port=request.client.port,
            status_code=400,
            act_type='Bad Request',
            date=datetime.now(),
            url=request.scope['root_path'] + request.scope['route'].path,
            massage='Incorrect username or password'
        )
        conn = engine.connect()
        conn.execute(q)
        conn.commit()
        raise HTTPException(status_code=400, detail="Incorrect username or password")

    is_password_correct = pwd_context.verify(password, user.hashed_password)
    if not is_password_correct:
        q = insert(Siem).values(
            hostname=request.client.host,
            port=request.client.port,
            status_code=400,
            act_type='Bad Request',
            date=datetime.now(),
            url=request.scope['root_path'] + request.scope['route'].path,
            massage='Incorrect username or password'
        )
        conn = engine.connect()
        conn.execute(q)
        conn.commit()
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    jwt_token = create_jwt_token({"sub": user.username})
    return {"access_token": jwt_token, "token_type": "bearer"}


def get_current_user(request: Request, token: str = Depends(oauth2_scheme)):
    decoded_data = verify_jwt_token(token)
    if not decoded_data:
        q = insert(Siem).values(
            hostname=request.client.host,
            port=request.client.port,
            status_code=400,
            act_type='Bad Request',
            date=datetime.now(),
            url=request.scope['root_path'] + request.scope['route'].path,
            massage='Invalid token'
        )
        conn = engine.connect()
        conn.execute(q)
        conn.commit()
        raise HTTPException(status_code=400, detail="Invalid token")
    # user = get_user(decoded_data["sub"])  # Получите пользователя из базы данных
    user = User(
        username='username',
        email='email',
        full_name='full_name',
        disabled=False
    )
    if not user:
        raise HTTPException(status_code=400, detail="User not found")
    return user


@app.get("/users/me")
def get_user_me(current_user: User = Depends(get_current_user)):
    return current_user


@app.get("/{rest_of_path:path}")
async def react_app(req: Request, rest_of_path: str):
    return templates.TemplateResponse('index.html', {'request': req})