import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { NgFor } from '@angular/common';
import { IonContent, IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonIcon } from '@ionic/angular/standalone';
import { TitleScreenComponent } from '../components/shared/titleScreen/titleScreen.component';
import { MusicService } from '../services/music.service';
import { DecadeText } from '../models/decadetext.model';
import { Artist } from '../models/artist.model';
import { Radio } from '../models/radio.model';
import { addIcons } from 'ionicons';
import { heart } from 'ionicons/icons';

@Component({
  selector: 'app-decade',
  templateUrl: './decade.page.html',
  styleUrls: ['./decade.page.scss'],
  standalone: true,
  imports: [
    NgFor,
    RouterModule,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonIcon,
    TitleScreenComponent
  ]
})
export class DecadePage {

  private route = inject(ActivatedRoute);
  private music = inject(MusicService);

  artists: Artist[] = [];
  radios: Radio[] = [];
  decadeInfo: DecadeText | null = null;

  constructor() {
    addIcons({ heart });
  }

  ionViewWillEnter() {
    const year = this.route.snapshot.paramMap.get('year') || '';
    
    this.music.getDecadeInfo(year).subscribe(res => {
      this.decadeInfo = res ?? null;
    });
    
    this.music.getArtistsByDecade(year).subscribe({
      next: (res) => {
        this.artists = res;
      },
      error: (err) => {
        console.error("Errore nel caricamento degli artisti:", err);
      }
    });

    this.music.getRadiosByDecade(year).subscribe({
      next: (res) => {
        this.radios = res;
      },
      error: (err) => {
        console.error("Errore nel caricamento delle radio:", err);
      }
    });
  }
}