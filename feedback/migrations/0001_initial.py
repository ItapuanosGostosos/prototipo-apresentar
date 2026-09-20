import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):
    """Tabela 'feedbacks'. Rollback: python manage.py migrate feedback zero"""

    initial = True
    dependencies = []

    operations = [
        migrations.CreateModel(
            name='Feedback',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('rating', models.PositiveSmallIntegerField(
                    help_text='Avaliacao geral de 1 a 5.',
                    validators=[
                        django.core.validators.MinValueValidator(1),
                        django.core.validators.MaxValueValidator(5),
                    ],
                )),
                ('made_sense', models.CharField(blank=True, choices=[('yes', 'Sim'), ('partially', 'Em parte'), ('no', 'Nao')], default='', help_text='O resultado da analise fez sentido?', max_length=10)),
                ('summary_clear', models.CharField(blank=True, choices=[('yes', 'Sim'), ('partially', 'Em parte'), ('no', 'Nao')], default='', help_text='O resumo foi facil de entender?', max_length=10)),
                ('problem', models.TextField(blank=True, default='', help_text='Problema encontrado.')),
                ('suggestion', models.TextField(blank=True, default='', help_text='Sugestao.')),
                ('name', models.CharField(blank=True, default='', help_text='Opcional.', max_length=120)),
                ('contact', models.CharField(blank=True, default='', help_text='Opcional.', max_length=200)),
                ('app_version', models.CharField(blank=True, default='', max_length=40)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
            ],
            options={
                'verbose_name': 'Feedback',
                'verbose_name_plural': 'Feedbacks',
                'db_table': 'feedbacks',
                'ordering': ['-created_at', '-id'],
            },
        ),
    ]
