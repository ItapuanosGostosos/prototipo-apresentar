import requests
from django.conf import settings
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import RegisterSerializer, UserSerializer


def _keycloak_admin_token() -> str:
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
        data = serializer.validated_data

        try:
            admin_token = _keycloak_admin_token()
        except Exception:
            return Response(
                {'detail': 'Não foi possível conectar ao servidor de autenticação.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        url = f"{settings.KEYCLOAK_SERVER_URL}/admin/realms/{settings.KEYCLOAK_REALM}/users"
        resp = requests.post(url, json={
            'username': data['username'],
            'email': data['email'],
            'enabled': True,
            'credentials': [{'type': 'password', 'value': data['password'], 'temporary': False}],
        }, headers={'Authorization': f'Bearer {admin_token}'}, timeout=10)

        if resp.status_code == 409:
            return Response({'detail': 'E-mail já cadastrado.'}, status=status.HTTP_400_BAD_REQUEST)

        if not resp.ok:
            return Response({'detail': 'Erro ao criar conta.'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'email': data['email'], 'username': data['username']}, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """Proxies login to Keycloak and returns access + refresh tokens."""
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        email = request.data.get('email', '')
        password = request.data.get('password', '')

        if not email or not password:
            return Response({'detail': 'Email e senha são obrigatórios.'}, status=status.HTTP_400_BAD_REQUEST)

        url = f"{settings.KEYCLOAK_SERVER_URL}/realms/{settings.KEYCLOAK_REALM}/protocol/openid-connect/token"
        try:
            resp = requests.post(url, data={
                'grant_type': 'password',
                'client_id': settings.KEYCLOAK_CLIENT_ID,
                'username': email,
                'password': password,
            }, timeout=10)
        except Exception:
            return Response(
                {'detail': 'Não foi possível conectar ao servidor de autenticação.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        if resp.status_code in (401, 400):
            return Response({'detail': 'Credenciais inválidas.'}, status=status.HTTP_401_UNAUTHORIZED)

        if not resp.ok:
            return Response({'detail': 'Erro ao autenticar.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        data = resp.json()
        return Response({
            'access': data['access_token'],
            'refresh': data['refresh_token'],
        })


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user
