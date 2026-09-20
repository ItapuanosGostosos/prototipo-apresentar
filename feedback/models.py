"""Feedback de usuarios reais sobre a analise.

App separado de proposito: o enunciado pede para NAO misturar a logica de
feedback com o motor de analise. Nada aqui importa ``sentiment_ai``.

LGPD: nome e contato sao opcionais e autodeclarados. O usuario autenticado NAO
e gravado junto do feedback — nao precisamos saber quem disse o que para ler os
resultados na apresentacao, entao nao coletamos.
"""

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class Feedback(models.Model):
    class Answer(models.TextChoices):
        YES = 'yes', 'Sim'
        PARTIALLY = 'partially', 'Em parte'
        NO = 'no', 'Nao'

    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text='Avaliacao geral de 1 a 5.',
    )
    made_sense = models.CharField(
        max_length=10, choices=Answer.choices, blank=True, default='',
        help_text='O resultado da analise fez sentido?',
    )
    summary_clear = models.CharField(
        max_length=10, choices=Answer.choices, blank=True, default='',
        help_text='O resumo foi facil de entender?',
    )
    problem = models.TextField(blank=True, default='', help_text='Problema encontrado.')
    suggestion = models.TextField(blank=True, default='', help_text='Sugestao.')
    name = models.CharField(max_length=120, blank=True, default='', help_text='Opcional.')
    contact = models.CharField(max_length=200, blank=True, default='', help_text='Opcional.')
    app_version = models.CharField(max_length=40, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'feedbacks'
        ordering = ['-created_at', '-id']
        verbose_name = 'Feedback'
        verbose_name_plural = 'Feedbacks'

    def __str__(self):
        return f'Feedback #{self.pk} - nota {self.rating}'
