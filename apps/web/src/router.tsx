import { useState } from 'react';
import { createRootRoute, createRoute, createRouter, Outlet } from '@tanstack/react-router';
import { CartDock } from './components/cart-dock';
import { CartDrawer } from './components/cart-drawer';
import { CatalogPage } from './routes/catalog-page';
import { CheckoutPage } from './routes/checkout';
import { OrderConfirmationPage } from './routes/order-confirmation';
import { GuestOrderPage } from './routes/guest-order';

function RootLayout() {
  const [cartOpen, setCartOpen] = useState(false);
  return (
    <>
      <Outlet />
      <CartDock onOpen={() => setCartOpen(true)} />
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}

const rootRoute = createRootRoute({ component: RootLayout });
const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: CatalogPage });
const catalogRoute = createRoute({ getParentRoute: () => rootRoute, path: '/catalog', component: CatalogPage });
const checkoutRoute = createRoute({ getParentRoute: () => rootRoute, path: '/checkout', component: CheckoutPage });
const confirmationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/order-confirmation',
  component: OrderConfirmationPage,
});
const guestOrderRoute = createRoute({ getParentRoute: () => rootRoute, path: '/orders/guest', component: GuestOrderPage });

const routeTree = rootRoute.addChildren([indexRoute, catalogRoute, checkoutRoute, confirmationRoute, guestOrderRoute]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
