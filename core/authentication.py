import jwt
import requests
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import authentication
from rest_framework.exceptions import AuthenticationFailed

User = get_user_model()


class KeycloakAuthentication(authentication.BaseAuthentication):
    keyword = 'Bearer'

    def get_jwks(self):
        try:
            response = requests.get(settings.KEYCLOAK_JWKS_URL, timeout=5)
            response.raise_for_status()
            return response.json()
        except Exception:
            raise AuthenticationFailed("Não foi possível obter as chaves públicas do Keycloak.")

    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '').split()

        if not auth_header or auth_header[0] != self.keyword:
            return None

        if len(auth_header) == 1:
            raise AuthenticationFailed("Token inválido. Sem credenciais.")
        elif len(auth_header) > 2:
            raise AuthenticationFailed("Token inválido. Espaços não permitidos.")

        token = auth_header[1]

        try:
            unverified_header = jwt.get_unverified_header(token)
        except Exception:
            raise AuthenticationFailed("Token malformado.")

        jwks = self.get_jwks()
        rsa_key = {}
        for key in jwks.get('keys', []):
            if key['kid'] == unverified_header.get('kid'):
                rsa_key = {k: key[k] for k in ('kty', 'kid', 'use', 'n', 'e') if k in key}
                break

        if not rsa_key:
            raise AuthenticationFailed("Chave pública não encontrada para validar o token.")

        try:
            public_key = jwt.algorithms.RSAAlgorithm.from_jwk(rsa_key)
            payload = jwt.decode(
                token,
                public_key,
                algorithms=["RS256"],
                audience=settings.KEYCLOAK_CLIENT_ID,
                issuer=settings.KEYCLOAK_ISSUER,
            )
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed("O token expirou.")
        except jwt.InvalidTokenError:
            raise AuthenticationFailed("Token inválido.")

        email = payload.get("email")
        if not email:
            raise AuthenticationFailed("Token sem email associado.")

        user, _ = User.objects.get_or_create(
            email=email,
            defaults={'username': payload.get('preferred_username', email)},
        )
        return (user, token)
