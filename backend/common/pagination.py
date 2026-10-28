from rest_framework.pagination import PageNumberPagination


class StandardPageNumberPagination(PageNumberPagination):
    """`?page=1&page_size=25`; default 25, maximum 100 (API Design §14.1)."""

    page_size = 25
    page_size_query_param = "page_size"
    max_page_size = 100
