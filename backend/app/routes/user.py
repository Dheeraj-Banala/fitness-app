from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from ..database import get_db
from ..models.user import User
from ..models.refresh_token import RefreshToken
from ..schemas.user import UserCreate, UserResponse, UserLogin, RefreshRequest
from ..auth import hash_password, verify_password, create_access_token, get_current_user, create_refresh_token, REFRESH_TOKEN_EXPIRE_DAYS

router = APIRouter(prefix="/users", tags=["users"])


@router.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    db_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hash_password(user.password)
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": str(db_user.id)})
    refresh_token = create_refresh_token()

    db.add(RefreshToken(
        user_id=db_user.id,
        token=refresh_token,
        expires_at=datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
    ))
    db.commit()

    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/refresh")
def refresh(request: RefreshRequest, db: Session = Depends(get_db)):
    db_token = db.query(RefreshToken).filter(
        RefreshToken.token == request.refresh_token,
        RefreshToken.is_revoked == False,
    ).first()

    if not db_token or db_token.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    
    db_token.expires_at = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    db.commit()

    access_token = create_access_token(data={"sub": str(db_token.user_id)})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/logout")
def logout(request: RefreshRequest, db: Session = Depends(get_db)):
    db_token = db.query(RefreshToken).filter(RefreshToken.token == request.refresh_token).first()
    if db_token:
        db_token.is_revoked = True
        db.commit()
    return {"message": "Logged out"}