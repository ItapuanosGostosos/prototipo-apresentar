from django.urls import path

from .controller import FeedbackCreateView, FeedbackListView

urlpatterns = [
    path('', FeedbackCreateView.as_view(), name='feedback-create'),
    path('list', FeedbackListView.as_view(), name='feedback-list'),
]
