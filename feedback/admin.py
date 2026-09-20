from django.contrib import admin

from .models import Feedback


@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ('id', 'rating', 'made_sense', 'summary_clear', 'app_version', 'created_at')
    list_filter = ('rating', 'made_sense', 'summary_clear')
    search_fields = ('problem', 'suggestion')
