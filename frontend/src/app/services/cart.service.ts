import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private authService = inject(AuthService);
  
  private isCartOpen = new BehaviorSubject<boolean>(false);
  isCartOpen$ = this.isCartOpen.asObservable();
  cartOpen$ = this.isCartOpen.asObservable();

  private items = new BehaviorSubject<any[]>([]);
  items$ = this.items.asObservable();

  private notification = new BehaviorSubject<string | null>(null);
  notification$ = this.notification.asObservable();

  openCart() {
    this.isCartOpen.next(true);
  }

  closeCart() {
    this.isCartOpen.next(false);
  }

  addToCart(item: any) {
    const currentItems = this.items.value;
    this.items.next([...currentItems, item]);
    this.triggerFeedback("Aggiunto al carrello!");
  }

  removeItem(itemToRemove: any) {
    const currentItems = this.items.value;
    const index = currentItems.findIndex(item => item === itemToRemove);
    if (index !== -1) {
      const updatedItems = [...currentItems];
      updatedItems.splice(index, 1);
      this.items.next(updatedItems);
    }
  }

  verifyCheckout(): string | null {
    if (!this.authService.isLogged()) {
      return "Usa un account per effettuare ordini";
    }

    if (this.items.value.length === 0) {
      return "Il tuo carrello è vuoto";
    }

    return null;
  }

  clearCart() {
    this.items.next([]);
  }

  private triggerFeedback(msg: string) {
    this.notification.next(msg);
    setTimeout(() => this.notification.next(null), 2000);
  }
}