from app.models import Payment
from sqlalchemy.orm import Session
from app.schemas import PaymentCreate, PaymentUpdate  # à adapter selon ton arborescence

def create_payment(db: Session, payment_in: PaymentCreate) -> Payment:
    payment = Payment(**payment_in.dict())
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment

def get_payment_by_id(db: Session, payment_id: int) -> Payment | None:
    return db.query(Payment).filter(Payment.id == payment_id).first()

def get_all_payments(db: Session, skip: int = 0, limit: int = 100) -> list[Payment]:
    return db.query(Payment).offset(skip).limit(limit).all()

def update_payment(db: Session, payment_id: int, payment_in: PaymentUpdate) -> Payment | None:
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if payment:
        update_data = payment_in.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(payment, key, value)
        db.commit()
        db.refresh(payment)
    return payment

def delete_payment(db: Session, payment_id: int) -> bool:
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if payment:
        db.delete(payment)
        db.commit()
        return True
    return False

