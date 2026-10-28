from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import User, AuditLog, utcnow
from backend.auth import verify_password, create_access_token, get_current_user, get_password_hash, require_roles
from backend.schemas import Token, LoginRequest, UserOut, UserCreate

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
def login(creds: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == creds.username).first()
    if not user or not verify_password(creds.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is deactivated"
        )
    
    # Audit log entry
    audit = AuditLog(
        user_id=user.id,
        username=user.username,
        action="USER_LOGIN",
        entity_type="USER",
        entity_id=str(user.id),
        details=f"Successful authentication for {user.full_name} ({user.role})"
    )
    db.add(audit)
    db.commit()

    token = create_access_token({
        "sub": user.username,
        "role": user.role,
        "user_id": user.id,
        "plant_id": user.plant_id
    })
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "username": user.username,
        "full_name": user.full_name,
        "plant_id": user.plant_id
    }

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/users", response_model=list[UserOut])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN", "PLANT_ADMIN"))
):
    return db.query(User).all()

@router.post("/users", response_model=UserOut)
def create_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("SUPER_ADMIN", "PLANT_ADMIN"))
):
    existing = db.query(User).filter(User.username == user_in.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    new_user = User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role,
        plant_id=user_in.plant_id,
        department=user_in.department,
        phone=user_in.phone
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user
