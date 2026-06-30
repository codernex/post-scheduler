import os
import core as core
from requests_oauthlib import OAuth2Session
import requests

# Enable insecure transport for local development (only if HTTP redirect URIs are used)
if core.settings.LINKEDIN_REDIRECT_URI.startswith("http://localhost") or core.settings.LINKEDIN_REDIRECT_URI.startswith(
        "http://127.0.0.1"):
    os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

SCOPES = ['openid', 'profile', 'email', 'w_member_social']
AUTH_BASE_URL = 'https://www.linkedin.com/oauth/v2/authorization'
TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken'
USERINFO_URL = 'https://api.linkedin.com/v2/userinfo'
POSTS_URL = 'https://api.linkedin.com/rest/posts'
LINKEDIN_VERSION = '202606'  # API Version Header


class LinkedInClient:
    def __init__(
            self,
            client_id: str | None = None,
            client_secret: str | None = None,
            redirect_uri: str | None = None,
    ):
        self.client_id = client_id or core.settings.LINKEDIN_CLIENT_ID
        self.client_secret = client_secret or core.settings.LINKEDIN_CLIENT_SECRET
        self.redirect_uri = redirect_uri or core.settings.LINKEDIN_REDIRECT_URI

    def get_authorization_url(self, state: str | None = None) -> tuple[str, str]:
        """
        Generates the authorization URL and state.
        """
        linkedin = OAuth2Session(
            client_id=self.client_id,
            redirect_uri=self.redirect_uri,
            scope=SCOPES
        )
        return linkedin.authorization_url(AUTH_BASE_URL, state=state)

    def fetch_token(self, code: str) -> dict:
        """
        Fetches the access token using the authorization code.
        """
        linkedin = OAuth2Session(
            client_id=self.client_id,
            redirect_uri=self.redirect_uri
        )
        return linkedin.fetch_token(
            TOKEN_URL,
            code=code,
            client_secret=self.client_secret,
            include_client_id=True
        )

    def get_user_info(self, access_token: str) -> dict:
        """
        Fetches the user profile info from the LinkedIn OIDC endpoint.
        """
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        response = requests.get(USERINFO_URL, headers=headers)
        response.raise_for_status()
        return response.json()

    def get_person_urn(self, sub: str) -> str:
        """
        Formats OIDC sub claim to Person URN required by LinkedIn API.
        """
        if sub.startswith("urn:li:person:"):
            return sub
        return f"urn:li:person:{sub}"

    def publish_post(self, access_token: str, author_urn: str, commentary: str) -> dict:
        """
        Publishes a text post to the user's LinkedIn profile feed.
        """
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0",
            "LinkedIn-Version": LINKEDIN_VERSION
        }
        payload = {
            "author": self.get_person_urn(author_urn),
            "commentary": commentary,
            "visibility": {
                "com.linkedin.voyager.feed.shared.ScreenExtent": "PUBLIC"
            },
            "lifecycleState": "PUBLISHED"
        }
        response = requests.post(POSTS_URL, headers=headers, json=payload)
        response.raise_for_status()
        if response.status_code == 201:
            if response.text:
                return response.json()
            return {"status": "success", "id": response.headers.get("x-restli-id")}
        return response.json()

    def refresh_access_token(self, refresh_token: str) -> dict:
        """
        Refreshes the access token using the refresh token.
        """
        payload = {
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
            "client_id": self.client_id,
            "client_secret": self.client_secret,
        }
        headers = {"Content-Type": "application/x-www-form-urlencoded"}
        response = requests.post(TOKEN_URL, data=payload, headers=headers)
        response.raise_for_status()
        return response.json()
