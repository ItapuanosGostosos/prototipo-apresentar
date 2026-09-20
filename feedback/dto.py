from rest_framework import serializers

from .models import Feedback


class FeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = (
            'id', 'rating', 'made_sense', 'summary_clear', 'problem',
            'suggestion', 'name', 'contact', 'app_version', 'created_at',
        )
        read_only_fields = ('id', 'created_at')

    def validate_rating(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError('A avaliacao deve ficar entre 1 e 5.')
        return value
