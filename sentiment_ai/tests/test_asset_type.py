"""O tipo do ativo decide o termo da busca, em vez do sufixo do ticker.

BOVA11, IVVB11 e SMAL11 sao ETFs e terminam em 11, igual aos FIIs. Enquanto o
fetcher deduzia pelo sufixo, eles eram pesquisados como "fundo imobiliario".
"""

from __future__ import annotations

from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase

from news.fetchers.google_news_fetcher import GoogleNewsFetcher
from news.fetchers.yfinance_fetcher import YFinanceFetcher
from portfolios.models import Asset, Portfolio


class QueryPorTipoTests(TestCase):
    """_query monta o termo a partir do tipo quando ele e conhecido."""

    def setUp(self):
        self.fetcher = GoogleNewsFetcher()

    def test_etf_nao_e_pesquisado_como_fundo_imobiliario(self):
        query = self.fetcher._query("IVVB11", "etf")
        self.assertNotIn("fundo imobiliário", query)
        self.assertIn("IVVB11", query)
        self.assertIn("ETF", query)

    def test_fii_continua_pesquisado_como_fundo_imobiliario(self):
        self.assertEqual(
            self.fetcher._query("MXRF11", "fii"), "MXRF11 fundo imobiliário"
        )

    def test_acao_pesquisa_so_o_ticker(self):
        self.assertEqual(self.fetcher._query("PETR4", "stock"), "PETR4")

    def test_cripto_e_bdr_ganham_o_proprio_termo(self):
        self.assertEqual(self.fetcher._query("BTC", "crypto"), "BTC criptomoeda")
        self.assertEqual(self.fetcher._query("AAPL34", "bdr"), "AAPL34 BDR")

    def test_sem_tipo_cai_no_palpite_pelo_sufixo(self):
        # O feed ao vivo e o beat chamam fetch() sem o tipo: o comportamento
        # antigo precisa continuar valendo para eles.
        self.assertEqual(
            self.fetcher._query("MXRF11", None), "MXRF11 fundo imobiliário"
        )
        self.assertEqual(self.fetcher._query("PETR4", None), "PETR4")

    def test_tipo_desconhecido_nao_quebra(self):
        self.assertEqual(self.fetcher._query("PETR4", "tipo-que-nao-existe"), "PETR4")


class InterfaceDosFetchersTests(TestCase):
    """Os dois fetchers aceitam asset_types sem quebrar quem nao passa."""

    def test_google_repassa_o_tipo_para_a_query(self):
        # Prova que o tipo chega de fetch() ate _query(), que e o ponto onde
        # ele muda o termo pesquisado.
        fetcher = GoogleNewsFetcher()
        vistos = []

        def espiao(ticker, asset_type):
            vistos.append((ticker, asset_type))
            return ticker

        with patch.object(fetcher, "_query", side_effect=espiao),              patch("news.fetchers.google_news_fetcher.requests.get",
                   side_effect=RuntimeError("sem rede no teste")):
            fetcher.fetch(["IVVB11"], asset_types={"IVVB11": "etf"})

        self.assertEqual(vistos, [("IVVB11", "etf")])

    def test_yfinance_aceita_e_ignora(self):
        self.assertIn("asset_types", YFinanceFetcher.fetch.__code__.co_varnames)

    def test_yfinance_nao_muda_o_simbolo_por_causa_do_tipo(self):
        # Decisao consciente: o Yahoo devolve a mesma feed generica de cripto
        # em qualquer forma do simbolo, entao nao ha o que corrigir aqui.
        self.assertEqual(YFinanceFetcher._yf_symbol("PETR4"), "PETR4.SA")
        self.assertEqual(YFinanceFetcher._yf_symbol("BTC"), "BTC")


class MapaDeTiposNaTaskTests(TestCase):
    """analyse_portfolio monta o mapa ticker -> tipo e repassa ao fetcher."""

    def setUp(self):
        user = get_user_model().objects.create_user(
            username="tipo-tester", password="x"
        )
        self.portfolio = Portfolio.objects.create(user=user, name="Mista")
        Asset.objects.create(
            portfolio=self.portfolio, ticker="IVVB11", name="ETF S&P 500",
            asset_type=Asset.AssetType.ETF,
        )
        Asset.objects.create(
            portfolio=self.portfolio, ticker="MXRF11", name="Maxi Renda",
            asset_type=Asset.AssetType.FII,
        )

    def test_a_task_passa_o_tipo_certo_de_cada_ativo(self):
        from portfolios.tasks import analyse_portfolio

        recebidos = {}

        def fake_fetch(self, tickers, asset_types=None):
            recebidos.update(asset_types or {})
            return []

        with patch.object(GoogleNewsFetcher, "fetch", fake_fetch), \
             patch.object(YFinanceFetcher, "fetch", fake_fetch):
            analyse_portfolio.apply(
                args=(self.portfolio.pk, ["IVVB11", "MXRF11"])
            ).get()

        self.assertEqual(recebidos.get("IVVB11"), "etf")
        self.assertEqual(recebidos.get("MXRF11"), "fii")
