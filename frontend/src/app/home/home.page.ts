import { Component, Injector, inject, ViewChild, ElementRef } from '@angular/core';
import { IonContent, IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowForwardOutline } from 'ionicons/icons';
import { FloatingBallComponent } from '../components/floatingBall/floatingBall.component';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../services/user.service';
import { User } from '../models/user.model';
import { SearchBarComponent } from '../components/shared/search-bar/search-bar.component';
import { Router } from '@angular/router';
import { MusicService } from '../services/music.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonButton,
    IonIcon,
    FloatingBallComponent,
    RouterModule,
    CommonModule,
    FormsModule,
    SearchBarComponent
  ],
})

export class HomePage {
  private router = inject(Router);
  private injector = inject(Injector); 

  @ViewChild('bgVideo', {static: false}) bgVideo!: ElementRef<HTMLVideoElement>;

  user: User | null = null;
  topArtists: any[] = [];

  constructor() {
    addIcons({ arrowForwardOutline });
  }

  ionViewWillEnter() {
    const userService = this.injector.get(UserService);
    const musicService = this.injector.get(MusicService);

    userService.currentUser$.subscribe(user => {
      this.user = user;
    });

    musicService.getTopArtists().subscribe({
      next: (res) => {
        this.topArtists = [...res, ...res];
      },
      error: (err) => console.error("Errore recupero top artisti in Home:", err)
    });
  }

  ionViewDidEnter() {
    this.playVideo();
  }

  playVideo() {
    if (this.bgVideo && this.bgVideo.nativeElement) {
      const video = this.bgVideo.nativeElement;
      
      video.muted = true; 
      
      video.play().then(() => {
        console.log('Background in riproduzione');
      }).catch((error) => {
        console.warn('Autoplay bloccato dal browser:', error);
      });
    }
  }

  isAdmin(): boolean {
    return this.user?.role === 'admin';
  }
  
  goToArtist(artist: any) {
    this.router.navigate(['/artist', artist.id]);
  }
}