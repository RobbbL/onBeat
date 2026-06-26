import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { OrdersService } from '../../services/orders.service';
import { Order } from '../../models/order.model';

@Component({
  selector: 'app-orders-popover',
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon, IonSpinner],
  templateUrl: './orders-popover.component.html',
  styleUrls: ['./orders-popover.component.scss'],
})
export class OrdersPopoverComponent implements OnInit {
  private ordersService = inject(OrdersService);
  
  orders: Order[] = [];
  loading = true;

  ngOnInit() {
    this.ordersService.getOrders().subscribe({
      next: (data) => {
        this.orders = data || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }
}