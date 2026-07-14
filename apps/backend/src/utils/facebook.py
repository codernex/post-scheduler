import os
import requests
from requests_oauthlib import OAuth2Session
import core as core
from .social_client import SocialClient

# Enable insecure transport for local development
if core.settings.FACEBOOK_REDIRECT_URI.startswith(
    "http://localhost"
) or core.settings.FACEBOOK_REDIRECT_URI.startswith("http://127.0.0.1"):
    os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

SCOPES = [
    "public_profile",
    "email",
    "pages_manage_posts",
    "pages_read_engagement",
    "pages_show_list",
    # "instagram_basic",
    # "instagram_content_publish",
]

AUTH_BASE_URL = "https://www.facebook.com/v20.0/dialog/oauth"
TOKEN_URL = "https://graph.facebook.com/v20.0/oauth/access_token"
USERINFO_URL = "https://graph.facebook.com/v20.0/me"


class FacebookClient(SocialClient):
    def __init__(
        self,
        client_id: str | None = None,
        client_secret: str | None = None,
        redirect_uri: str | None = None,
    ):
        self.client_id = client_id or core.settings.FACEBOOK_CLIENT_ID
        self.client_secret = client_secret or core.settings.FACEBOOK_CLIENT_SECRET
        self.redirect_uri = redirect_uri or core.settings.FACEBOOK_REDIRECT_URI

    def get_authorization_url(self, state: str | None = None) -> tuple[str, str]:
        """
        Generates the Facebook OAuth authorization URL and state.
        """
        facebook = OAuth2Session(
            client_id=self.client_id, redirect_uri=self.redirect_uri, scope=SCOPES
        )
        return facebook.authorization_url(AUTH_BASE_URL, state=state)  # type: ignore

    def fetch_token(self, code: str) -> dict[str, str]:
        """
        Exchanges the authorization code for an access token.
        """
        facebook = OAuth2Session(
            client_id=self.client_id, redirect_uri=self.redirect_uri
        )
        return facebook.fetch_token(  # type: ignore
            TOKEN_URL,
            code=code,
            client_secret=self.client_secret,
            include_client_id=True,
        )

    def get_user_info(self, access_token: str) -> dict[str, str]:
        """
        Fetches the user profile info from Facebook.
        """
        params = {
            "fields": "id,name,email",
            "access_token": access_token
        }
        response = requests.get(USERINFO_URL, params=params)
        response.raise_for_status()
        data = response.json()
        return {
            "id": data.get("id", ""),
            "name": data.get("name", ""),
            "sub": data.get("id", ""),
            "email": data.get("email", ""),
        }

    def publish_post(
        self, access_token: str, author_urn: str, commentary: str, platform_name: str | None = None
    ) -> dict[str, str]:
        """
        Publishes a post to Facebook Page, Instagram, or Threads depending on the target platform.
        """
        # Default target is Facebook Page if not specified
        platform = (platform_name or "Facebook Post").lower()

        if "instagram" in platform:
            return self._publish_instagram_post(access_token, commentary)
        elif "thread" in platform:
            return self._publish_threads_post(access_token, commentary)
        else:
            return self._publish_facebook_page_post(access_token, commentary)

    def _publish_facebook_page_post(self, access_token: str, commentary: str) -> dict[str, str]:
        """
        Publishes a post to the user's Facebook Page.
        Uses the Page Access Token.
        """
        # Step 1: Get the user's pages to find page_id and page_access_token
        accounts_url = "https://graph.facebook.com/v20.0/me/accounts"
        params = {"access_token": access_token}
        res = requests.get(accounts_url, params=params)
        res.raise_for_status()
        accounts_data = res.json().get("data", [])

        if not accounts_data:
            raise Exception("No Facebook Pages found associated with this user account.")

        # Post to the first page available
        page = accounts_data[0]
        page_id = page["id"]
        page_access_token = page["access_token"]

        # Step 2: Post to the page feed
        feed_url = f"https://graph.facebook.com/v20.0/{page_id}/feed"
        post_params = {
            "message": commentary,
            "access_token": page_access_token
        }
        post_res = requests.post(feed_url, json=post_params)
        post_res.raise_for_status()
        return post_res.json()

    def _publish_instagram_post(self, access_token: str, commentary: str) -> dict[str, str]:
        """
        Publishes an image post with caption to Instagram Business account.
        Requires Instagram Business ID, which is fetched via Facebook Page.
        """
        # Step 1: Get pages
        accounts_url = "https://graph.facebook.com/v20.0/me/accounts"
        params = {"access_token": access_token}
        res = requests.get(accounts_url, params=params)
        res.raise_for_status()
        accounts_data = res.json().get("data", [])

        if not accounts_data:
            raise Exception("No Facebook Pages found to locate Instagram accounts.")

        page = accounts_data[0]
        page_id = page["id"]
        page_access_token = page["access_token"]

        # Step 2: Get Instagram Business Account ID associated with the Page
        page_details_url = f"https://graph.facebook.com/v20.0/{page_id}"
        details_params = {
            "fields": "instagram_business_account",
            "access_token": page_access_token
        }
        details_res = requests.get(page_details_url, params=details_params)
        details_res.raise_for_status()
        ig_account = details_res.json().get("instagram_business_account")

        if not ig_account:
            raise Exception(f"No Instagram Business Account linked to Facebook Page '{page.get('name')}'")

        ig_user_id = ig_account["id"]

        # Step 3: Create Media Container (Requires a public image. Using a beautiful abstract default)
        media_url = f"https://graph.facebook.com/v20.0/{ig_user_id}/media"
        media_payload = {
            "image_url": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe",
            "caption": commentary,
            "access_token": page_access_token
        }
        media_res = requests.post(media_url, json=media_payload)
        media_res.raise_for_status()
        container_id = media_res.json().get("id")

        # Step 4: Publish Container
        publish_url = f"https://graph.facebook.com/v20.0/{ig_user_id}/media_publish"
        publish_payload = {
            "creation_id": container_id,
            "access_token": page_access_token
        }
        publish_res = requests.post(publish_url, json=publish_payload)
        publish_res.raise_for_status()
        return publish_res.json()

    def _publish_threads_post(self, access_token: str, commentary: str) -> dict[str, str]:
        """
        Publishes a text post to Threads API.
        """
        # Step 1: Create Threads container
        container_url = "https://graph.threads.net/v1.0/me/threads"
        payload = {
            "media_type": "TEXT",
            "text": commentary[:500],
            "access_token": access_token
        }
        res = requests.post(container_url, data=payload)
        res.raise_for_status()
        creation_id = res.json().get("id")

        # Step 2: Publish Threads container
        publish_url = "https://graph.threads.net/v1.0/me/threads_publish"
        publish_payload = {
            "creation_id": creation_id,
            "access_token": access_token
        }
        publish_res = requests.post(publish_url, data=publish_payload)
        publish_res.raise_for_status()
        return publish_res.json()

    def refresh_access_token(self, refresh_token: str) -> dict[str, str]:
        """
        Refreshes a Facebook OAuth long-lived access token.
        """
        url = "https://graph.facebook.com/v20.0/oauth/access_token"
        payload = {
            "grant_type": "fb_exchange_token",
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "fb_exchange_token": refresh_token,
        }
        response = requests.post(url, data=payload)
        response.raise_for_status()
        return response.json()
