import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { CartService } from '../../../services/cart.service';
import { UserService } from '../../../services/user.service';
import { map } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';
import { PopoverController } from '@ionic/angular';
import { LoginPopoverComponent } from '../../login-popover/login-popover.component';

@Component({
  selector: 'app-navbar',
  standalone: true,

  imports: [
    CommonModule,
    RouterModule
  ],

  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})

export class NavbarComponent {

  cartCount$ = this.cartService.items$.pipe(
    map(items => items.length)
  );

  user$ = this.userService.currentUser$;

  profileImageUrl: string = 'assets/login.png';

  constructor(
    private cartService: CartService,
    private userService: UserService,
    private popoverController: PopoverController,
    private router: Router
  ) {}

  ngOnInit()
  {
    this.user$.subscribe(user => {
      if (user?.profileImage) {
        this.profileImageUrl = this.userService.getProfileImageUrl(user);
      } else {
        this.profileImageUrl = 'assets/login.png';
      }
    });
  }

  openCart() {
    this.cartService.openCart();
  }

  openProfile() {
    this.router.navigate(['/profile']);
  }

  async openLogin() {
    const popover = await this.popoverController.create({
      component: LoginPopoverComponent,
      showBackdrop: true,
    });

    await popover.present();
  }

  handleAuthClick() {
    const user = this.userService.getCurrentUser();

    if (user)
      this.openProfile();
    else
      this.openLogin();
  }
}