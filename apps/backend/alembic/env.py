import asyncio
from sqlalchemy.ext.asyncio import async_engine_from_config
from alembic import context

from src.core import Base  # adjust import
from src.models import User, SocialMedia, Scheduler, ApiToken

config = context.config

target_metadata = Base.metadata


def run_migrations_sync(connection):
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online():
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        pool_pre_ping=True,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(run_migrations_sync)

    await connectable.dispose()


if context.is_offline_mode():
    pass
else:
    asyncio.run(run_migrations_online())
