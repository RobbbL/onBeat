import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { IonContent, IonButton, IonIcon } from '@ionic/angular/standalone';
import { PopoverController } from '@ionic/angular';
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';
import { OrdersPopoverComponent } from '../components/orders-popover/orders-popover.component';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonContent,
    IonButton,
    IonIcon
  ],
  providers: [PopoverController]
})
export class ProfilePage implements OnInit {
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private popoverController = inject(PopoverController);

  user$ = this.userService.currentUser$;
  profileImageUrl: string = 'assets/default.png';

  ngOnInit() {
    this.user$.subscribe(user => {
      this.profileImageUrl = this.userService.getProfileImageUrl(user);
    });
  }

  goToProfileManagement() {
    this.router.navigate(["/profileManagement"]);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/home']);
  }

  async openOrdersPopover() {
  const popover = await this.popoverController.create({
    component: OrdersPopoverComponent,
    cssClass: 'orders-popover-custom',
    htmlAttributes: {
      style: '--width: 90vw; --max-width: 500px; --height: 70vh; --max-height: 70vh;'
    },
  });
  await popover.present();
}
}