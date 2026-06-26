import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { CartService } from '../services/cart.service';
import { UserService } from '../services/user.service';
import { OrdersService } from '../services/orders.service';
import { User } from '../models/user.model';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.page.html',
  styleUrls: ['./payment.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule]
})
export class PaymentPage implements OnInit {

  private cartService = inject(CartService);
  private userService = inject(UserService);
  private ordersService = inject(OrdersService);
  private router = inject(Router);

  currentStep = 1;
  cartItems: any[] = [];
  errorMessage: string | null = null;

  shippingData = {
    userId: null as number | null,
    nome: '',
    cognome: '',
    username: '',
    email: '',
    paese: '',
    provincia: '',
    citta: '',
    cap: '',
    via: '',
    civico: '',
    telefono: ''
  };

  paymentData = {
    intestatario: '',
    numeroCarta: '',
    scadenza: '',
    cvv: ''
  };

  ngOnInit() {
    this.cartService.items$.subscribe(items => {
      this.cartItems = items;
    });

    this.loadUserAddress();
  }

  loadUserAddress() {
    this.userService.getProfile().subscribe({
      next: (user: User) => {
        if (user && user.shippingAddress) {
          const addr = user.shippingAddress;
          this.shippingData = {
            userId: user.id || null,
            nome: user.firstName || '',
            cognome: user.lastName || '',
            username: user.username || '',
            email: user.email || '',
            paese: addr.country || '',
            provincia: addr.provinceCode || '',
            citta: addr.city || '',
            cap: addr.zipcode || '',
            via: addr.street || '',
            civico: addr.streetNumber !== undefined && addr.streetNumber !== null ? String(addr.streetNumber) : '',
            telefono: user.phone || ''
          };
        } else {
          this.handleAddressError("Nessun indirizzo associato a questo account. Verrai reindirizzato...");
        }
      },
      error: () => {
        this.handleAddressError("Errore nel recupero dei dati del profilo. Verrai reindirizzato...");
      }
    });
  }

  private handleAddressError(message: string) {
    this.errorMessage = message;
    this.currentStep = 0; 
    setTimeout(() => {
      this.router.navigate(['/home']);
    }, 3500);
  }

  validateAndNextStep1() {
    this.errorMessage = null;
    if (!this.shippingData.nome.trim() || 
        !this.shippingData.cognome.trim() || 
        !this.shippingData.username.trim() ||
        !this.shippingData.email.trim() ||
        !this.shippingData.paese.trim() ||
        !this.shippingData.provincia.trim() ||
        !this.shippingData.via.trim() ||
        !this.shippingData.civico.trim() ||
        !this.shippingData.citta.trim() || 
        !this.shippingData.cap.trim() ||
        !this.shippingData.telefono.trim()) {
      this.errorMessage = "Compila tutti i campi obbligatori di spedizione";
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.shippingData.email.trim())) {
      this.errorMessage = "Inserisci un indirizzo email valido";
      return;
    }

    if (this.shippingData.cap.trim().length !== 5 || isNaN(Number(this.shippingData.cap))) {
      this.errorMessage = "Inserisci un CAP valido composto da 5 cifre";
      return;
    }
    this.nextStep();
  }

  validateAndNextStep2() {
    this.errorMessage = null;
    if (!this.paymentData.intestatario.trim() || 
        !this.paymentData.numeroCarta.trim() || 
        !this.paymentData.scadenza.trim() || 
        !this.paymentData.cvv.trim()) {
      this.errorMessage = "Compila tutti i dati relativi al pagamento";
      return;
    }
    if (this.paymentData.numeroCarta.trim().length !== 16 || isNaN(Number(this.paymentData.numeroCarta))) {
      this.errorMessage = "Il numero di carta deve contenere esattamente 16 cifre";
      return;
    }

    const expiryRegex = /^(\d{2})\/(\d{2})$/;
    const match = this.paymentData.scadenza.trim().match(expiryRegex);
    if (!match) {
      this.errorMessage = "Formato scadenza non valido. Usa MM/AA";
      return;
    }

    const month = parseInt(match[1], 10);
    const year = parseInt(match[2], 10) + 2000; 

    if (month < 1 || month > 12) {
      this.errorMessage = "Il mese di scadenza deve essere compreso tra 01 e 12";
      return;
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      this.errorMessage = "La carta di credito è scaduta";
      return;
    }

    if (this.paymentData.cvv.trim().length !== 3 || isNaN(Number(this.paymentData.cvv))) {
      this.errorMessage = "Il codice CVV deve contenere esattamente 3 cifre";
      return;
    }
    this.nextStep();
  }

  nextStep() {
    if (this.currentStep < 3) {
      this.currentStep++;
      this.errorMessage = null;
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.errorMessage = null;
    }
  }

  calculateTotal(): number {
    return this.cartItems.reduce((acc, item) => acc + (item.price || 0), 0);
  }

  confirmOrder() {
    this.errorMessage = null;
    if (!this.cartItems || this.cartItems.length === 0) {
      this.errorMessage = "Nessun prodotto selezionato";
      return;
    }

    const orderPayload = {
      shipping: this.shippingData,
      products: this.cartItems,
      total: this.calculateTotal()
    };

    this.ordersService.createOrder(orderPayload).subscribe({
      next: () => {
        this.cartService.clearCart();
        this.currentStep = 4;
      },
      error: (err) => {
        if (err.status === 400 && err.error?.outOfStockItem) {
          const item = err.error.outOfStockItem;
          this.errorMessage = `Rimangono solo ${item.stock} articoli per il prodotto ${item.name}`;
        } else {
          this.errorMessage = err.error?.error || "Errore durante l'elaborazione dell'ordine. Riprova.";
        }
      }
    });
  }

  goHome() {
    this.router.navigate(['/home']);
  }
}