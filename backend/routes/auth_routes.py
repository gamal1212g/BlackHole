from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from ..database import get_database
from ..models import UserCreate, UserInDB
from ..auth import get_password_hash, verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES, get_current_user
router = APIRouter(prefix='/auth', tags=['auth'])

@router.get('/me')
async def get_me(current_user: dict=Depends(get_current_user)):
    return {'username': current_user.get('username'), 'email': current_user.get('email'), 'role': current_user.get('role', 'Lead SOC Manager / Product Engineer'), 'station': 'Management Node (Localhost)', 'organization': 'BlackHole Cyber Security Lab'}

@router.post('/register')
async def register(user_data: UserCreate, db=Depends(get_database)):
    if not db:
        raise HTTPException(status_code=503, detail='Database connection not ready')
    users_collection = db['users']
    existing_user = await users_collection.find_one({'username': user_data.username})
    if existing_user:
        raise HTTPException(status_code=400, detail='Username already registered')
    hashed_password = get_password_hash(user_data.password)
    new_user = {'username': user_data.username, 'email': user_data.email, 'hashed_password': hashed_password}
    await users_collection.insert_one(new_user)
    return {'message': 'User created successfully'}

@router.post('/login')
async def login(response: Response, form_data: OAuth2PasswordRequestForm=Depends(), db=Depends(get_database)):
    if not db:
        raise HTTPException(status_code=503, detail='Database connection not ready')
    users_collection = db['users']
    user = await users_collection.find_one({'username': form_data.username})
    if not user or not verify_password(form_data.password, user['hashed_password']):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Incorrect username or password', headers={'WWW-Authenticate': 'Bearer'})
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data={'sub': user['username']}, expires_delta=access_token_expires)
    response.set_cookie(key='access_token', value=f'Bearer {access_token}', httponly=True, max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60, samesite='lax', secure=False)
    return {'message': 'Login successful'}

@router.post('/logout')
async def logout(response: Response):
    response.delete_cookie('access_token')
    return {'message': 'Logged out'}