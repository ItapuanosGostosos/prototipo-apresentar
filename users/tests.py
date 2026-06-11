import pytest
from django.urls import reverse


@pytest.mark.django_db
class TestRegister:
    def test_register_success(self, api_client):
        url = reverse('auth-register')
        data = {'email': 'new@example.com', 'username': 'newuser', 'password': 'strongpass123'}
        response = api_client.post(url, data)
        assert response.status_code == 201
        assert response.data['email'] == 'new@example.com'
        assert 'password' not in response.data

    def test_register_duplicate_email(self, api_client, user):
        url = reverse('auth-register')
        data = {'email': 'test@example.com', 'username': 'x', 'password': 'strongpass123'}
        response = api_client.post(url, data)
        assert response.status_code == 400

    def test_register_weak_password(self, api_client):
        url = reverse('auth-register')
        data = {'email': 'new@example.com', 'username': 'x', 'password': '123'}
        response = api_client.post(url, data)
        assert response.status_code == 400


@pytest.mark.django_db
class TestLogin:
    def test_login_success(self, api_client, user):
        url = reverse('auth-login')
        response = api_client.post(url, {'email': 'test@example.com', 'password': 'strongpass123'})
        assert response.status_code == 200
        assert 'access' in response.data
        assert 'refresh' in response.data

    def test_login_wrong_password(self, api_client, user):
        url = reverse('auth-login')
        response = api_client.post(url, {'email': 'test@example.com', 'password': 'wrong'})
        assert response.status_code == 401

    def test_login_unknown_email(self, api_client):
        url = reverse('auth-login')
        response = api_client.post(url, {'email': 'nobody@example.com', 'password': 'pass'})
        assert response.status_code == 401


@pytest.mark.django_db
class TestMe:
    def test_me_authenticated(self, auth_client, user):
        url = reverse('auth-me')
        response = auth_client.get(url)
        assert response.status_code == 200
        assert response.data['email'] == user.email

    def test_me_unauthenticated(self, api_client):
        url = reverse('auth-me')
        response = api_client.get(url)
        assert response.status_code == 401
