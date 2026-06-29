from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta

import src.utils as utils
from src.core.database import get_db
from src.core.dependencies import get_current_user
from src.models import User, ApiToken, SocialMedia
from src.dto import SocialPlatformStatus

social_router = APIRouter(
    prefix="/social-media",
    tags=["Social"]
)

linkedin = utils.LinkedInClient()

@social_router.get("/connect/linkedin")
def linkedin_connect(
    current_user: User = Depends(get_current_user)
):
    # Encrypt the user's ID to use as the state parameter
    encrypted_state = utils.encrypt_data(str(current_user.id))
    url, state = linkedin.get_authorization_url(state=encrypted_state)
    return RedirectResponse(url)

@social_router.get("/connect/linkedin/callback")
async def linkedin_callback(
    code: str,
    state: str,
    db: AsyncSession = Depends(get_db)
):
    # Decrypt the state parameter to verify the user identity
    try:
        user_id_str = utils.decrypt_data(state)
        if not user_id_str:
            raise ValueError()
        user_id = int(user_id_str)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid state parameter"
        )

    # Fetch token and user info from LinkedIn
    token = await run_in_threadpool(linkedin.fetch_token, code)
    user_info = await run_in_threadpool(linkedin.get_user_info, token['access_token'])

    # Find the LinkedIn platform record in the database
    result = await db.execute(select(SocialMedia).where(SocialMedia.name.ilike("linkedin")))
    social_media = result.scalar_one_or_none()
    if not social_media:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Social media platform 'Linkedin' not found in database"
        )

    # Calculate token expiration time
    expires_in = token.get("expires_in")
    expires_at = datetime.now() + timedelta(seconds=int(expires_in)) if expires_in else None

    # Check for an existing token connection
    token_query = await db.execute(
        select(ApiToken).where(
            ApiToken.user_id == user_id,
            ApiToken.social_media_id == social_media.id
        )
    )
    api_token = token_query.scalar_one_or_none()

    scopes_val = token.get("scope")
    if isinstance(scopes_val, list):
        scopes_str = ",".join(scopes_val)
    elif isinstance(scopes_val, str):
        scopes_str = scopes_val
    else:
        scopes_str = None

    if api_token:
        # Update existing token
        api_token.access_token = token["access_token"]
        api_token.refresh_token = token.get("refresh_token")
        api_token.expires_at = expires_at
        api_token.token_type = token.get("token_type")
        api_token.scopes = scopes_str
    else:
        # Create new token record
        api_token = ApiToken(
            user_id=user_id,
            social_media_id=social_media.id,
            expires_at=expires_at,
            token_type=token.get("token_type"),
            scopes=scopes_str
        )
        api_token.access_token = token["access_token"]
        api_token.refresh_token = token.get("refresh_token")
        db.add(api_token)

    await db.commit()

    return RedirectResponse(url="http://localhost:3000/dashboard?connected=linkedin")

@social_router.get("/status", response_model=list[SocialPlatformStatus])
async def get_social_connection_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Fetch all social media platforms
    result = await db.execute(select(SocialMedia))
    platforms = result.scalars().all()

    # Fetch active API tokens for the user
    token_result = await db.execute(
        select(ApiToken).where(ApiToken.user_id == current_user.id)
    )
    tokens = token_result.scalars().all()
    connected_map = {token.social_media_id: token for token in tokens}

    # Construct the response
    status_list = []
    for platform in platforms:
        token = connected_map.get(platform.id)
        is_connected = token is not None and not token.is_expired
        
        status_list.append(
            SocialPlatformStatus(
                id=platform.id,
                name=platform.name,
                connected=is_connected,
                expires_at=token.expires_at if token else None
            )
        )

    return status_list

@social_router.delete("/disconnect/{platform}")
async def disconnect_social_platform(
    platform: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Find the platform in the SocialMedia table
    result = await db.execute(select(SocialMedia).where(SocialMedia.name.ilike(platform)))
    social_media = result.scalar_one_or_none()
    if not social_media:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Social media platform '{platform}' not found"
        )

    # Delete all ApiToken records matching the user and social media platform
    delete_result = await db.execute(
        select(ApiToken).where(
            ApiToken.user_id == current_user.id,
            ApiToken.social_media_id == social_media.id
        )
    )
    tokens = delete_result.scalars().all()
    if not tokens:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Platform '{platform}' is not connected"
        )

    for token in tokens:
        await db.delete(token)
    
    await db.commit()

    return {"detail": f"Successfully disconnected '{platform}'"}