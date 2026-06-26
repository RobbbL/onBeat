import { Component } from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CartService } from '../../services/cart.service';

@Component({
  imports: [IonButton, IonIcon, CommonModule, RouterModule],
  selector: 'app-cart',
  standalone: true,
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss'],
})
export class CartComponent {
  isOpen = false;
  items: any[] = [];
  errorMessage: string | null = null;

  constructor(
    private cartService: CartService,
    private router: Router
  ) {
    this.cartService.cartOpen$.subscribe(open => {
      this.isOpen = open;
      if (open) this.errorMessage = null; 
    });

    this.cartService.items$.subscribe(items => {
      this.items = items;
    });
  }

  closeCart() {
    this.cartService.closeCart();
  }

  removeItem(item: any) {
    this.cartService.removeItem(item);
  }

  calculateTotal(): number {
    return this.items.reduce((acc, item) => acc + (item.price || 0), 0);
  }

  checkout() {
    const error = this.cartService.verifyCheckout();
    
    if (error) {
      this.errorMessage = error;
      return;
    }

    this.errorMessage = null;
    this.closeCart();
    this.router.navigate(['/payment']);
  }
}