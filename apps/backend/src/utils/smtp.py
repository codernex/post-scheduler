import logging
import mailtrap as mt
from core import settings

logger = logging.getLogger(__name__)

def send_smtp_email(to_email: str, subject: str, body: str, html_body: str = None) -> bool:
    """
    Sends an email using the Mailtrap API Client SDK.
    If MAILTRAP_API_TOKEN is blank, it logs the email to local server console instead of crashing.
    """
    print("API_TOKEN",settings.MAILTRAP_API_TOKEN)
    if not settings.MAILTRAP_API_TOKEN:
        logger.warning(
            "\n=== [LOCAL MAILTRAP WORKER LOG] ===\n"
            "MAILTRAP_API_TOKEN is not configured. Email logged to console:\n"
            "TO: %s\n"
            "FROM: %s <%s>\n"
            "SUBJECT: %s\n"
            "TEXT BODY:\n%s\n"
            "HTML BODY:\n%s\n"
            "===================================\n",
            to_email, settings.SMTP_FROM_NAME, settings.SMTP_FROM_EMAIL, subject, body, html_body
        )
        return True

    try:
        # Create mail payload using Mailtrap SDK classes
        mail = mt.Mail(
            sender=mt.Address(email=settings.SMTP_FROM_EMAIL, name=settings.SMTP_FROM_NAME),
            to=[mt.Address(email=to_email)],
            subject=subject,
            text=body,
            html=html_body,
            category="PostScheduler Contact Response",
        )

        # Initialize Mailtrap client and dispatch request
        client = mt.MailtrapClient(token=settings.MAILTRAP_API_TOKEN)
        response = client.send(mail)

        # logger.info("Mailtrap email sent successfully to %s. Response: %s", to_email, response)
        return True

    except Exception as exc:
        logger.error("Failed to send Mailtrap email to %s: %s", to_email, exc, exc_info=True)
        raise exc
