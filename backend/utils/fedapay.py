import random

def process_fedapay_refund(fedapay_ref: str, amount: float) -> dict:
    """
    Simule le remboursement via FedaPay.
    En production, fais un appel HTTP à l'API FedaPay ici.
    """
    # Simulation d'un remboursement réussi
    if random.random() > 0.05:  # 95% de réussite
        return {
            "status": "success",
            "refund_id": f"refund_{fedapay_ref}_{random.randint(1000,9999)}",
            "amount": amount
        }
    else:
        return {
            "status": "failed",
            "error": "Erreur de remboursement"
        }