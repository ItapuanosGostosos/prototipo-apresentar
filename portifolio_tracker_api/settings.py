from pathlib import Path
import sys
import environ
import oracledb

# oracledb is the modern replacement for cx_Oracle; register it so Django's oracle backend finds it
oracledb.version = "8.3.0"
sys.modules["cx_Oracle"] = oracledb

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env(
    DEBUG=(bool, False)
)
environ.Env.read_env(BASE_DIR / '.env')

SECRET_KEY = env('SECRET_KEY', default='dev-secret-key-change-in-production')
DEBUG = env('DEBUG')
ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=['localhost', '127.0.0.1', '192.168.15.38'])

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',
    'rest_framework',
    'django_celery_beat',
    'users',
    'portfolios',
    'news',
    'notifications',
    'sentiment_ai.apps.SentimentAIConfig',
    'feedback',
    'drf_spectacular',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'portifolio_tracker_api.urls'

APPEND_SLASH = False

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'portifolio_tracker_api.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.oracle',
        'NAME': env('DB_NAME', default='orcl'),
        'USER': env('DB_USER', default=''),
        'PASSWORD': env('DB_PASSWORD', default=''),
        'HOST': env('DB_HOST', default='oracle.fiap.com.br'),
        'PORT': env('DB_PORT', default='1521'),
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'pt-br'
TIME_ZONE = 'America/Sao_Paulo'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

AUTH_USER_MODEL = 'users.User'

REST_FRAMEWORK = {
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'core.security.KeycloakAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

SPECTACULAR_SETTINGS = {
    'TITLE': 'Portfolio Tracker API',
    'DESCRIPTION': 'API para gerenciamento de carteiras de investimentos com análise de sentimentos de notícias.',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'COMPONENT_SPLIT_REQUEST': True,
    'SECURITY': [{'bearerAuth': []}],
    'SWAGGER_UI_SETTINGS': {
        'persistAuthorization': True,
    },
}

KEYCLOAK_SERVER_URL = env('KEYCLOAK_SERVER_URL', default='http://localhost:8080')
KEYCLOAK_REALM = env('KEYCLOAK_REALM', default='portfolio')
KEYCLOAK_CLIENT_ID = env('KEYCLOAK_CLIENT_ID', default='portfolio-api')
KEYCLOAK_ISSUER = f"{KEYCLOAK_SERVER_URL}/realms/{KEYCLOAK_REALM}"
KEYCLOAK_JWKS_URL = f"{KEYCLOAK_ISSUER}/protocol/openid-connect/certs"

CORS_ALLOWED_ORIGINS = [
    'http://localhost:8081',
    'http://127.0.0.1:8081',
    'http://192.168.15.38:8081',
]
CORS_ALLOW_ALL_ORIGINS = True

CELERY_BROKER_URL = env('CELERY_BROKER_URL', default='amqp://guest:guest@localhost:5672/')
CELERY_RESULT_BACKEND = env('CELERY_RESULT_BACKEND', default='rpc://')
CELERY_BEAT_SCHEDULER = 'django_celery_beat.schedulers:DatabaseScheduler'
CELERY_TASK_SOFT_TIME_LIMIT = 240
CELERY_TASK_TIME_LIMIT = 300

from celery.schedules import crontab
CELERY_BEAT_SCHEDULE = {
    'fetch-news-every-hour': {
        'task': 'news.tasks.fetch_news_for_all_active_sources',
        'schedule': crontab(minute=0),
    },
}

FIREBASE_CREDENTIALS_PATH = env('FIREBASE_CREDENTIALS_PATH', default='firebase-credentials.json')


# =============================================================================
# Analise de sentimento (sentiment_ai)
# =============================================================================
SENTIMENT_QUEUE = env('SENTIMENT_QUEUE', default='sentiment_analysis')

# Idioma usado quando a fonte nao informa, o banco nao tem e a deteccao nao
# conclui. NAO e ingles de proposito: a base de ativos e brasileira.
SENTIMENT_FALLBACK_LANGUAGE = env('SENTIMENT_FALLBACK_LANGUAGE', default='pt-BR')

# Idioma declarado por fonte. Vence a deteccao automatica.
SENTIMENT_SOURCE_LANGUAGES = {
    'google_news': 'pt-BR',
}

# Fontes consultadas pela analise sob demanda (POST /portfolios/{id}/analyse).
SENTIMENT_ANALYSIS_SOURCES = (
    ('yfinance', 'Yahoo Finance'),
    ('google_news', 'Google News'),
)

# =============================================================================
# LLM externa — opcional e desligada por padrao
# =============================================================================
# Nenhum valor real mora aqui. Tudo vem do ambiente; o .env.example lista
# somente os NOMES das variaveis.
LLM_ENABLED = env.bool('LLM_ENABLED', default=False)
LLM_PROVIDER = env('LLM_PROVIDER', default='')          # anthropic | openai | gemini
LLM_MODEL = env('LLM_MODEL', default='')
LLM_API_KEY = env('LLM_API_KEY', default='')
LLM_BASE_URL = env('LLM_BASE_URL', default='')
LLM_TIMEOUT_SECONDS = env.int('LLM_TIMEOUT_SECONDS', default=20)
LLM_MAX_RETRIES = env.int('LLM_MAX_RETRIES', default=2)
LLM_LANGUAGES = tuple(env.list('LLM_LANGUAGES', default=['pt-BR']))

# =============================================================================
# Logging estruturado
# =============================================================================
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'plain': {'format': '%(asctime)s %(levelname)s %(name)s %(message)s'},
    },
    'handlers': {
        'console': {'class': 'logging.StreamHandler', 'formatter': 'plain'},
    },
    'root': {'handlers': ['console'], 'level': 'INFO'},
    'loggers': {
        'sentiment_ai': {'handlers': ['console'], 'level': 'INFO', 'propagate': False},
        'sentiment_ai.events': {'handlers': ['console'], 'level': 'INFO', 'propagate': False},
    },
}
