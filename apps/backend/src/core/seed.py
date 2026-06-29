from dotenv import load_dotenv

load_dotenv()
# seed.py
import sys
from pathlib import Path
import asyncio
from dotenv import load_dotenv

# 1. Load env vars and fix paths instantly
load_dotenv()
sys.path.append(str(Path(__file__).resolve().parents[2]))

# 2. Async SQLAlchemy imports
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

# 3. Your project imports
from src.core.database import engine  # Your AsyncEngine
from src.models import SocialMedia

social_medias = [
    {"name": "Facebook", "url": "https://facebook.com"},
    {"name": "Linkedin", "url": "https://linkedin.com"},
]


async def seed_social_media():
    """Asynchronously seeds the database with initial social media platforms."""

    # Use AsyncSession and 'async with'
    async with AsyncSession(engine) as session:

        # In async SQLAlchemy, we use 'select' and 'await session.scalar()' to get a single value like a count
        count_query = select(func.count()).select_from(SocialMedia)
        existing_count = await session.scalar(count_query)

        if existing_count is not None and existing_count > 0:
            print(f"Database already contains {existing_count} records. Skipping seed.")
            return

        db_social_medias = [SocialMedia(**sm) for sm in social_medias]

        session.add_all(db_social_medias)
        await session.commit()  # Commit must be awaited

        print(f"Successfully seeded {len(db_social_medias)} social media platforms!")


if __name__ == "__main__":
    print("Starting async database seed...")
    # Because this is a top-level script, we have to tell Python to run the async function
    asyncio.run(seed_social_media())
    print("Done!")
