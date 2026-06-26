import { Routes } from '@angular/router';
import { AdminGuard } from './guards/admin.guard';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'forum',
    loadComponent: () => import('./forum-list/forum-list.page').then(m => m.ForumListPage)
  },
  {
    path: 'forum/:category',
    loadComponent: () => import('./forum-discussion/forum-discussion.page').then(m => m.ForumDetailPage)
  },
  {
    path: '',
    redirectTo: 'forum',
    pathMatch: 'full'
  },
  {
    path: 'products/:product',
    loadComponent: () => import('./products/products.page').then( m => m.ProductsPage)
  },
  {
    path: 'merchShop/:artist',
    loadComponent: () => import('./merchShop/merchShop.page').then((m) => m.MerchShopPage),
  },
  {
    path: 'decade/:year',
    loadComponent: () => import('./decade/decade.page').then((m) => m.DecadePage),
  },
  {
    path: 'admin/form/:type/:action',
    loadComponent: () => import('./admin-form/admin-form.page').then(m => m.AdminFormPage),
    canActivate: [AdminGuard]
  },
  {
    path: 'registration',
    loadComponent: () => import('./registration/registration.page').then( m => m.RegistrationPage)
  },
  {
    path: 'profile',
    loadComponent: () => import('./profile/profile.page').then( m => m.ProfilePage),
    canActivate: [AuthGuard]
  },
  {
    path: 'profileManagement',
    loadComponent: () => import('./profileManagement/profileManagement.page').then( m => m.ProfileManagementPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'payment',
    loadComponent: () => import('./payment/payment.page').then(m => m.PaymentPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'ticket',
    loadComponent: () => import('./ticket/ticket.page').then( m => m.TicketPage)
  },
  {
    path: 'admin-panel',
    loadComponent: () => import('./admin-panel/admin-panel.page').then(m => m.AdminPanelPage),
    canActivate: [AdminGuard]
  },
  {
    path: ':type/:id',
    loadComponent: () => import('./artist-radio/artist-radio.page').then((m) => m.ArtistRadioPage),
  },
  {
    path: '**',
    loadComponent: () => import('./not-found/not-found.page').then(m => m.NotFoundPage)
  },
  {
    path: 'not-found',
    loadComponent: () => import('./not-found/not-found.page').then( m => m.NotFoundPage)
  },
];