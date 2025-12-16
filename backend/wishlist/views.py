from django.views.generic import TemplateView

class WishlistView(TemplateView):
    template_name = 'wishlist/wishlist.html'
