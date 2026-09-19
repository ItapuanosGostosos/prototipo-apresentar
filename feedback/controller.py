from rest_framework import generics, permissions

from .dto import FeedbackSerializer
from .models import Feedback


class FeedbackCreateView(generics.CreateAPIView):
    """POST: registra um feedback. Nao grava quem enviou."""

    serializer_class = FeedbackSerializer
    permission_classes = (permissions.IsAuthenticated,)
    queryset = Feedback.objects.all()


class FeedbackListView(generics.ListAPIView):
    """GET: lista os feedbacks para consulta na apresentacao.

    Restrito a staff: feedback de terceiros nao deve ficar visivel para
    qualquer usuario autenticado.
    """

    serializer_class = FeedbackSerializer
    permission_classes = (permissions.IsAdminUser,)
    queryset = Feedback.objects.all()
