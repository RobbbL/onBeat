import { Component, OnInit, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { NavbarComponent } from './components/shared/navbar/navbar.component';
import { CartComponent } from './components/cart/cart.component';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { UserService } from './services/user.service';
import { CartService } from './services/cart.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [
    IonApp, 
    IonRouterOutlet, 
    NavbarComponent,
    CartComponent,
    CommonModule
  ],
})
export class AppComponent implements OnInit {

  private authService = inject(AuthService);
  private userService = inject(UserService);
  private cartService = inject(CartService);
  
  showNavbar = true;
  cartNotification$ = this.cartService.notification$;

  ngOnInit() {
    this.initializeApp();
  }

  initializeApp() {
    const token = this.authService.getToken();

    if (token) {
      this.userService.getProfile().subscribe({
        next: (user) => {
          this.userService.setCurrentUser(user);
        },
        error: () => {
          console.log("Token non valido al refresh, pulizia in corso...");
          this.authService.logout();
        }
      });
    } else {
      this.userService.setCurrentUser(null);
    }
  }

  constructor(private router: Router) {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((event: any) => {
        const hiddenRoutes = ['/registration', '/payment'];
        this.showNavbar = !hiddenRoutes.includes(event.url);
      });
  }
}