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
from  core.database import engine  # Your AsyncEngine
from  models import SocialMedia

social_medias = [
    {"name": "Facebook", "url": "https://facebook.com"},
    {"name": "Linkedin", "url": "https://linkedin.com"},
]


async def seed_social_media():
    """Asynchronously seeds the database with initial social media platforms."""

    # Use AsyncSession and 'async with'
    async with AsyncSession(engine) as session:
        # Idempotently seed parents
        for name, url in [("Facebook", "https://facebook.com"), ("Linkedin", "https://linkedin.com")]:
            result = await session.execute(select(SocialMedia).where(SocialMedia.name == name))
            db_sm = result.scalar_one_or_none()
            if not db_sm:
                db_sm = SocialMedia(name=name, url=url)
                session.add(db_sm)
                await session.flush()

        await session.commit()

        # Fetch Facebook parent
        fb_result = await session.execute(select(SocialMedia).where(SocialMedia.name == "Facebook"))
        facebook = fb_result.scalar_one()

        # Idempotently seed children
        children = [
            ("Facebook Post", "https://facebook.com"),
            ("Instagram Post", "https://instagram.com"),
            ("Threads Post", "https://threads.net"),
        ]
        for name, url in children:
            result = await session.execute(select(SocialMedia).where(SocialMedia.name == name))
            db_sm = result.scalar_one_or_none()
            if not db_sm:
                db_sm = SocialMedia(name=name, url=url, parent_id=facebook.id)
                session.add(db_sm)

        await session.commit()
        print("Successfully seeded all social media platforms and child options!")


if __name__ == "__main__":
    print("Starting async database seed...")
    # Because this is a top-level script, we have to tell Python to run the async function
    asyncio.run(seed_social_media())
    print("Done!")
