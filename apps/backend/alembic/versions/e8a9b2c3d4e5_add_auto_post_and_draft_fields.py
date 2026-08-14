"""add auto_post and draft fields

Revision ID: e8a9b2c3d4e5
Revises: cb0f106d52bd
Create Date: 2026-08-14 21:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e8a9b2c3d4e5'
down_revision: Union[str, Sequence[str], None] = '152575009883'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('users', sa.Column('auto_post', sa.Boolean(), server_default='true', nullable=False))
    op.add_column('scheduler', sa.Column('auto_post', sa.Boolean(), server_default='true', nullable=False))
    op.add_column('scheduler', sa.Column('draft_post_text', sa.String(length=5000), nullable=True))
    op.add_column('scheduler', sa.Column('draft_image_url', sa.String(length=1000), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('scheduler', 'draft_image_url')
    op.drop_column('scheduler', 'draft_post_text')
    op.drop_column('scheduler', 'auto_post')
    op.drop_column('users', 'auto_post')
