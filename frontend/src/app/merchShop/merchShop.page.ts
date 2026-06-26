import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgFor } from '@angular/common';
import { IonContent, IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonIcon } from '@ionic/angular/standalone';
import { MusicService } from '../services/music.service';
import { CartService } from '../services/cart.service';
import { Artist } from '../models/artist.model';
import { Product } from '../models/product.model';
import { RouterLink } from '@angular/router';
import { TitleSpaceComponent } from '../components/shared/title-space/title-space.component';

@Component({
  selector: 'app-merchShop',
  templateUrl: './merchShop.page.html',
  styleUrls: ['./merchShop.page.scss'],
  standalone: true,

  imports: [
    NgFor,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    RouterLink,
    TitleSpaceComponent
  ]
})
export class MerchShopPage {
    private route = inject(ActivatedRoute);
    private music = inject(MusicService);
    private cartService = inject(CartService);

    artist: Artist | null = null;
    description = '';
    products: Product[] = [];

  ngOnInit() {

    const artistID = Number(this.route.snapshot.paramMap.get('artist'));

    this.music.getArtistByID(artistID).subscribe(res => {
      this.artist = res;
    });

    this.music.getProductsByArtist(artistID).subscribe(res => {
      this.products = res;
    });
  }

  addToCart(product: Product) {
    this.cartService.addToCart(product);
  }
}