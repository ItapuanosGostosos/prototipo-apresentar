import requests
from django.conf import settings
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import RegisterSerializer, UserSerializer


def _keycloak_admin_token() -> str:
    """Obtém token de admin do realm master para gerenciar usuários."""
    url = f"{settings.KEYCLOAK_SERVER_URL}/realms/master/protocol/openid-connect/token"
    resp = requests.post(url, data={
        'grant_type': 'password',
        'client_id': 'admin-cli',
        'username': 'admin',
        'password': 'admin',
    }, timeout=10)
    resp.raise_for_status()
    return resp.json()['access_token']


class RegisterView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        username = serializer.validated_data['username']
        password = serializer.validated_data['password']

        try:
            admin_token = _keycloak_admin_token()
        except Exception:
            return Response(
                {'detail': 'Não foi possível conectar ao servidor de autenticação.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        url = f"{settings.KEYCLOAK_SERVER_URL}/admin/realms/{settings.KEYCLOAK_REALM}/users"
        resp = requests.post(url, json={
            'username': username,
            'email': email,
            'enabled': True,
            'credentials': [{'type': 'password', 'value': password, 'temporary': False}],
        }, headers={'Authorization': f'Bearer {admin_token}'}, timeout=10)

        if resp.status_code == 409:
            return Response({'detail': 'E-mail já cadastrado.'}, status=status.HTTP_409_CONFLICT)

        if not resp.ok:
            return Response({'detail': 'Erro ao criar conta.'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'email': email, 'username': username}, status=status.HTTP_201_CREATED)


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user
