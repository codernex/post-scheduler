import os
import sys
import asyncio
import bcrypt
from pathlib import Path
from dotenv import load_dotenv

# Load env variables and add src to sys.path
load_dotenv()
sys.path.append(str(Path(__file__).resolve().parents[2]))

from core.database import engine
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.User import User

async def create_admin():
    admin_email = os.getenv("ADMIN_EMAIL")
    admin_password = os.getenv("ADMIN_PASSWORD")

    if not admin_email or not admin_password:
        print("Error: ADMIN_EMAIL and ADMIN_PASSWORD must be set in the environment.")
        return

    async with AsyncSession(engine) as session:
        # Check if the user already exists
        result = await session.execute(select(User).where(User.email == admin_email))
        existing_user = result.scalar_one_or_none()

        if existing_user:
            print(f"User with email {admin_email} already exists.")
            # Ensure they have admin privileges
            if existing_user.role != "admin" or existing_user.tier != "pro":
                existing_user.role = "admin"
                existing_user.tier = "pro"
                await session.commit()
                print(f"Updated existing user {admin_email} role to 'admin' and tier to 'pro'.")
            return

        # Hashing password
        pw_bytes = admin_password.encode('utf-8')
        salt = bcrypt.gensalt()
        hashed_bytes = bcrypt.hashpw(pw_bytes, salt)
        hashed_password = hashed_bytes.decode('utf-8')

        # Create new admin user
        admin_user = User(
            username=admin_email.split('@')[0],
            email=admin_email,
            password=hashed_password,
            role="admin",
            tier="pro"
        )
        session.add(admin_user)
        await session.commit()
        print(f"Successfully created admin user: {admin_email}")

if __name__ == "__main__":
    print("Creating admin user...")
    asyncio.run(create_admin())
