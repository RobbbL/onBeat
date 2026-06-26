import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import { Product } from '../models/product.model';
import { MusicService } from '../services/music.service';
import { CartService } from '../services/cart.service';
import { ActivatedRoute } from '@angular/router';
import { TitleSpaceComponent } from '../components/shared/title-space/title-space.component';

@Component({
  selector: 'app-products',
  templateUrl: './products.page.html',
  styleUrls: ['./products.page.scss'],
  standalone: true,
  imports: [
    IonContent, 
    CommonModule, 
    FormsModule, 
    TitleSpaceComponent
  ]
})
export class ProductsPage {
  private music = inject(MusicService);
  private cartService = inject(CartService);
  private route = inject(ActivatedRoute);
  product: Product | null = null;

  constructor() { 
    
  }

  ngOnInit() {
    const productID = Number(this.route.snapshot.paramMap.get('product'));

    this.music.getProductByID(productID).subscribe(res => {
      this.product = res;
    });
  }

  addToCart() {
    if (this.product) {
      this.cartService.addToCart(this.product);
    }
  }
}
