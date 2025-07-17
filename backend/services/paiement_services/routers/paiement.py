from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.session import get_db
from app.schemas import PaymentCreate, PaymentUpdate
from services.paiement_services.crud_paiement import (
    create_payment,
    get_payment_by_id,
    get_all_payments,
    update_payment,
    delete_payment
)
from services.order_services.crud_order import update_order_status  # Assurez-vous que cette fonction est importée correctement
import os
import requests

router = APIRouter(
    tags=["paiements"]
)

@router.post("/", response_model=PaymentCreate)
def create_new_payment(payment: PaymentCreate, db: Session = Depends(get_db)):
    return create_payment(db, payment.dict())

@router.get("/{payment_id}", response_model=PaymentCreate)
def read_payment(payment_id: int, db: Session = Depends(get_db)):
    db_payment = get_payment_by_id(db, payment_id)
    if not db_payment:
        raise HTTPException(status_code=404, detail="Paiement non trouvé")
    return db_payment

@router.get("/", response_model=list[PaymentCreate])
def read_payments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return get_all_payments(db, skip=skip, limit=limit)

@router.put("/{payment_id}", response_model=PaymentCreate)
def update_existing_payment(payment_id: int, payment: PaymentUpdate, db: Session = Depends(get_db)):
    db_payment = update_payment(db, payment_id, payment.dict(exclude_unset=True))
    if not db_payment:
        raise HTTPException(status_code=404, detail="Paiement non trouvé")
    return db_payment

@router.delete("/{payment_id}")
def delete_existing_payment(payment_id: int, db: Session = Depends(get_db)):
    db_payment = delete_payment(db, payment_id)
    if not db_payment:
        raise HTTPException(status_code=404, detail="Paiement non trouvé")
    return {"ok": True}


@router.post("/callback")
async def fedapay_callback(request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    transaction_id = data.get("transaction_id")
    order_id = data.get("commande_id")
    status_fedapay = data.get("status")
    amount = data.get("amount")

    # Vérification auprès de FedaPay avec la clé secrète
    FEDAPAY_SECRET_KEY = os.getenv("FEDAPAY_SECRET_KEY")
    FEDAPAY_API_BASE_URL = os.getenv("FEDAPAY_API_BASE_URL", "https://sandbox-api.fedapay.com")
    fedapay_url = f"{FEDAPAY_API_BASE_URL}/v1/transactions/{transaction_id}"

    headers = {
        "Authorization": f"Bearer {FEDAPAY_SECRET_KEY}",
        "Content-Type": "application/json"
    }
    fedapay_response = requests.get(fedapay_url, headers=headers)
    if fedapay_response.status_code != 200:
        raise HTTPException(status_code=400, detail="Impossible de vérifier la transaction FedaPay")

    fedapay_data = fedapay_response.json()
    fedapay_status = fedapay_data.get("transaction", {}).get("status")

    if fedapay_status == "approved" and status_fedapay == "approved":
        # Mettre à jour la commande comme PAYE
        try:
            update_order_status(db, order_id, "PAYE", actor_email="fedapay-callback", role="system")
        except Exception as e:
            # Optionnel : log l'erreur
            pass

        # Créer le paiement en base
        payment_data = {
            "order_id": order_id,
            "status": "approved",
            "faydapay_ref": str(transaction_id),
            "amount": amount
        }
        create_payment(db, payment_data)
        return {"success": True, "message": "Paiement validé"}
    else:
        return {"success": False, "message": "Paiement non validé"}