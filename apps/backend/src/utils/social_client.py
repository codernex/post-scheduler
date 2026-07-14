from abc import ABC, abstractmethod


class SocialClient(ABC):
    @abstractmethod
    def get_authorization_url(self, state: str | None = None) -> tuple[str, str]:
        pass

    @abstractmethod
    def fetch_token(self, code: str) -> dict[str, str]:
        pass

    @abstractmethod
    def get_user_info(self, access_token: str) -> dict[str, str]:
        pass

    @abstractmethod
    def publish_post(
        self, access_token: str, author_urn: str, commentary: str
    ) -> dict[str, str]:
        pass

    @abstractmethod
    def refresh_access_token(self, refresh_token: str) -> dict[str, str]:
        pass
