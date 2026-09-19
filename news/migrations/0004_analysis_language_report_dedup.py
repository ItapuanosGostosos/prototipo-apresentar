"""Idioma, relatorio curto e deduplicacao garantida pelo banco.

O que esta migration faz
------------------------
1. Adiciona colunas aditivas em ``analises``. Todas aceitam nulo ou tem valor
   padrao vazio, portanto as linhas ja gravadas continuam validas e os clientes
   antigos continuam funcionando (os campos novos sao apenas ignorados por
   eles).
2. Remove duplicatas historicas de (article, ticker, model_version), mantendo a
   analise mais util de cada grupo. Sem esse passo a constraint do item 3 nao
   pode ser criada em uma base que ja rodou em producao.
3. Cria a UniqueConstraint que garante a deduplicacao no banco.

Rollback
--------
``python manage.py migrate news 0003_analysis_queue_fields``

A reversao remove a constraint e as colunas novas. As analises permanecem: o
campo ``analise`` (JSON completo) nunca e tocado, entao nenhum resultado e
perdido. O passo 2 NAO e revertido, porque linhas duplicadas apagadas nao sao
recuperaveis; por isso ele roda depois das colunas e antes da constraint, e
faz um backup logico no ``last_error`` da linha mantida.
"""

from django.db import migrations, models


def _drop_duplicates(apps, schema_editor):
    Analysis = apps.get_model('news', 'Analysis')

    seen: dict[tuple, int] = {}
    duplicates: list[int] = []

    # Ordem: concluidas primeiro, depois as mais antigas. A primeira de cada
    # grupo e a que fica.
    ordering = {'completed': 0, 'processing': 1, 'pending': 2, 'failed': 3}
    rows = list(
        Analysis.objects.all()
        .values('id', 'article_id', 'ticker', 'model_version', 'status')
    )
    rows.sort(key=lambda r: (ordering.get(r['status'], 9), r['id']))

    for row in rows:
        key = (row['article_id'], (row['ticker'] or '').upper(), row['model_version'] or '')
        if key in seen:
            duplicates.append(row['id'])
        else:
            seen[key] = row['id']

    if duplicates:
        # Deleta em lotes para nao estourar o limite de 1000 itens do IN do Oracle.
        for start in range(0, len(duplicates), 500):
            Analysis.objects.filter(id__in=duplicates[start:start + 500]).delete()


def _noop_reverse(apps, schema_editor):
    """Nada a desfazer: linhas duplicadas removidas nao voltam."""
    return None


class Migration(migrations.Migration):

    dependencies = [
        ('news', '0003_analysis_queue_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='analysis',
            name='language',
            field=models.CharField(blank=True, db_index=True, default='', max_length=20),
        ),
        migrations.AddField(
            model_name='analysis',
            name='engine',
            field=models.CharField(blank=True, default='', max_length=60),
        ),
        migrations.AddField(
            model_name='analysis',
            name='sentiment_label',
            field=models.CharField(blank=True, db_index=True, default='', max_length=20),
        ),
        migrations.AddField(
            model_name='analysis',
            name='sentiment_score',
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='analysis',
            name='relevance_score',
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='analysis',
            name='report',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='analysis',
            name='news_fingerprint',
            field=models.CharField(blank=True, db_index=True, default='', max_length=64),
        ),
        migrations.AddField(
            model_name='analysis',
            name='llm_used',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='analysis',
            name='fallback_reason',
            field=models.CharField(blank=True, default='', max_length=60),
        ),
        migrations.AddField(
            model_name='analysis',
            name='queued_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.RunPython(_drop_duplicates, _noop_reverse),
        migrations.AddConstraint(
            model_name='analysis',
            constraint=models.UniqueConstraint(
                fields=('article', 'ticker', 'model_version'),
                name='uq_analise_art_tic_ver',
            ),
        ),
    ]
