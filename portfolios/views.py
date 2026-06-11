from django.db import IntegrityError
from rest_framework import generics, permissions, status
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Asset, Portfolio
from .serializers import AssetSerializer, PortfolioListSerializer, PortfolioSerializer


class PortfolioListCreateView(generics.ListCreateAPIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return PortfolioListSerializer
        return PortfolioSerializer

    def get_queryset(self):
        return Portfolio.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class PortfolioDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PortfolioSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Portfolio.objects.filter(user=self.request.user)


class AssetListCreateView(generics.ListCreateAPIView):
    serializer_class = AssetSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def _get_portfolio(self):
        try:
            return Portfolio.objects.get(pk=self.kwargs['portfolio_pk'], user=self.request.user)
        except Portfolio.DoesNotExist:
            raise NotFound('Portfolio not found.')

    def get_queryset(self):
        return Asset.objects.filter(portfolio=self._get_portfolio())

    def perform_create(self, serializer):
        try:
            asset = serializer.save(portfolio=self._get_portfolio())
        except IntegrityError:
            raise ValidationError({'ticker': 'This ticker already exists in the portfolio.'})


class AssetDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = AssetSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        try:
            portfolio = Portfolio.objects.get(pk=self.kwargs['portfolio_pk'], user=self.request.user)
        except Portfolio.DoesNotExist:
            raise NotFound('Portfolio not found.')
        return Asset.objects.filter(portfolio=portfolio)
