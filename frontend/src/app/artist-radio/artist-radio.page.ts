import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { NgFor, CommonModule } from '@angular/common';
import { IonContent, IonButton, IonIcon, ToastController } from '@ionic/angular/standalone';
import { TitleScreenComponent } from '../components/shared/titleScreen/titleScreen.component';
import { MusicService } from '../services/music.service';
import { Product } from '../models/product.model';
import { addIcons } from 'ionicons';
import { heart, heartOutline, logInOutline } from 'ionicons/icons';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-artist-radio',
  templateUrl: './artist-radio.page.html',
  styleUrls: ['./artist-radio.page.scss'],
  standalone: true,
  imports: [
    NgFor,
    CommonModule,
    IonContent,
    IonButton,
    IonIcon,
    TitleScreenComponent,
    RouterModule
  ]
})
export class ArtistRadioPage implements OnInit {
  private route = inject(ActivatedRoute);
  private music = inject(MusicService);
  private authService = inject(AuthService);
  private toastController = inject(ToastController);

  artist_radio: any = null;
  products: Product[] = [];
  isLiked: boolean = false;
  currentType: string = '';
  currentId!: number;

  constructor() {
    addIcons({ heart, heartOutline, logInOutline });
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.currentType = params.get('type') || 'artist';
      this.currentId = Number(params.get('id'));

      if (this.currentType === 'radio') {
        this.loadRadioData(this.currentId);
      } else {
        this.loadArtistData(this.currentId);
      }
    });
  }

  loadArtistData(id: number) {
    this.music.getArtistByID(id).subscribe(res => {
      this.artist_radio = res;
      this.checkLikeStatus(id);
    });

    this.music.getProductsByArtist(id).subscribe(res => {
      this.products = res.slice(0, 4);
    });
  }

  loadRadioData(id: number) {
    this.music.getRadioByID(id).subscribe(res => {
      this.artist_radio = res;
    });
  }

  checkLikeStatus(id: number) {
    const token = this.authService.getToken();
    if (token) {
      this.music.checkIfLiked(id).subscribe({
        next: (res) => this.isLiked = !!res?.liked,
        error: () => this.isLiked = false
      });
    }
  }

  scrollTo(sectionId: string) {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  }

  async showLoginToast() {
    const toast = await this.toastController.create({
      message: 'Effettua il login per i preferiti',
      duration: 3000,
      position: 'bottom',
      color: 'dark',
      icon: 'log-in-outline'
    });
    await toast.present();
  }

  toggleLike() {
    if (!this.authService.getToken()) {
      this.showLoginToast();
      return;
    }

    const action = this.isLiked
      ? this.music.unlikeArtist(this.currentId)
      : this.music.likeArtist(this.currentId);

    action.subscribe({
      next: () => {
        this.isLiked = !this.isLiked;
        if (this.artist_radio && typeof this.artist_radio.likeCount === 'number') {
          this.artist_radio.likeCount += this.isLiked ? 1 : -1;
        }
      }
    });
  }
}