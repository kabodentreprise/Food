# app/core/email_utils.py

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import ssl

from app.core.config import settings # Importe les paramètres de configuration

async def send_reset_email(to_email: str, reset_code: str):
    """
    Envoie un e-mail contenant le code de réinitialisation du mot de passe.

    Args:
        to_email (str): L'adresse e-mail du destinataire.
        reset_code (str): Le code de réinitialisation à envoyer.
    """
    # Vérifier que toutes les configurations d'e-mail nécessaires sont définies
    if not all([settings.EMAIL_HOST, settings.EMAIL_PORT, settings.EMAIL_USERNAME, settings.EMAIL_PASSWORD]):
        print("Erreur: Les paramètres d'envoi d'e-mail ne sont pas entièrement configurés dans .env ou config.py.")
        print("Veuillez vérifier EMAIL_HOST, EMAIL_PORT, EMAIL_USERNAME, EMAIL_PASSWORD.")
        # En production, vous pourriez lever une exception ici ou utiliser un système de logging
        return False # Indique un échec de l'envoi

    message = MIMEMultipart("alternative")
    message["Subject"] = "Réinitialisation de votre mot de passe"
    message["From"] = settings.EMAIL_USERNAME
    message["To"] = to_email

    # Version HTML de l'e-mail pour une meilleure présentation
    html = f"""
    <html>
        <body>
            <p>Bonjour,</p>
            <p>Votre code de réinitialisation de mot de passe est : <strong>{reset_code}</strong></p>
            <p>Ce code est valable pour une durée limitée. Si vous n'avez pas demandé de réinitialisation, veuillez ignorer cet e-mail.</p>
            <p>Cordialement,<br>L'équipe du Restaurant</p>
        </body>
    </html>
    """

    
    part2 = MIMEText(html, "html")
    message.attach(part2)

    context = ssl.create_default_context()

    try:
        # Connexion au serveur SMTP et envoi de l'e-mail
        with smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT) as server:
            server.starttls(context=context) # Démarrer TLS pour la sécurité
            server.login(settings.EMAIL_USERNAME, settings.EMAIL_PASSWORD)
            server.sendmail(settings.EMAIL_USERNAME, to_email, message.as_string())
        print(f"E-mail de réinitialisation envoyé à {to_email}")
        return True # Indique un succès de l'envoi
    except smtplib.SMTPException as e:
        print(f"Erreur lors de l'envoi de l'e-mail de réinitialisation à {to_email}: {e}")
        return False # Indique un échec de l'envoi
    except Exception as e:
        print(f"Une erreur inattendue est survenue lors de l'envoi de l'e-mail: {e}")
        return False # Indique un échec de l'envoi

