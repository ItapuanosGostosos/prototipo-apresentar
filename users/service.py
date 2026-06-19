import requests
from django.conf import settings


class KeycloakService:

    @staticmethod
    def admin_token() -> str:
        url = f"{settings.KEYCLOAK_SERVER_URL}/realms/master/protocol/openid-connect/token"
        resp = requests.post(url, data={
            'grant_type': 'password',
            'client_id': 'admin-cli',
            'username': 'admin',
            'password': 'admin',
        }, timeout=10)
        resp.raise_for_status()
        return resp.json()['access_token']

    @staticmethod
    def register_user(data: dict) -> requests.Response:
        admin_token = KeycloakService.admin_token()
        url = f"{settings.KEYCLOAK_SERVER_URL}/admin/realms/{settings.KEYCLOAK_REALM}/users"
        return requests.post(url, json={
            'username': data['username'],
            'email': data['email'],
            'firstName': data['username'],
            'lastName': data['username'],
            'enabled': True,
            'emailVerified': True,
            'requiredActions': [],
            'credentials': [{'type': 'password', 'value': data['password'], 'temporary': False}],
        }, headers={'Authorization': f'Bearer {admin_token}'}, timeout=10)

    @staticmethod
    def login(email: str, password: str) -> requests.Response:
        url = f"{settings.KEYCLOAK_SERVER_URL}/realms/{settings.KEYCLOAK_REALM}/protocol/openid-connect/token"
        return requests.post(url, data={
            'grant_type': 'password',
            'client_id': settings.KEYCLOAK_CLIENT_ID,
            'username': email,
            'password': password,
        }, timeout=10)

    @staticmethod
    def refresh(refresh_token: str) -> requests.Response:
        url = f"{settings.KEYCLOAK_SERVER_URL}/realms/{settings.KEYCLOAK_REALM}/protocol/openid-connect/token"
        return requests.post(url, data={
            'grant_type': 'refresh_token',
            'client_id': settings.KEYCLOAK_CLIENT_ID,
            'refresh_token': refresh_token,
        }, timeout=10)
