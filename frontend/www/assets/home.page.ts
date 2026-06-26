import { Component } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { FloatingBallComponent } from '../shared/floatingBall/floatingBall.component';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Artist } from '../models/artist.model';
import { MusicService } from '../services/music.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
            IonContent,
            FloatingBallComponent,
            RouterModule,
            CommonModule,
            FormsModule
           ],
})
export class HomePage {
  constructor(private musicService: MusicService) {}

  searchTerm: string = '';
  artists: Artist[] = [];

  artistsWrap = [
    { ID:'beatles', name: 'The Beatles', img: 'assets/beatles.png' },
    { ID:'bobMarley', name: 'Bob Marley', img: 'assets/bobmarley.png' },
    { ID:'michaelJackson', name: 'Michael Jackson', img: 'assets/michealjackson.png' },
    { ID:'nirvana', name: 'Nirvana', img: 'assets/nirvana.png' },
    { ID:'brunoMars', name: 'Bruno Mars', img: 'assets/brunomars.png' }
  ];

  onSearch() {

    const term = this.searchTerm.trim();

    if (!term) {
      this.artists = [];
      return;
    }

    this.musicService.searchArtists(term).subscribe(result => {
      this.artists = result;
    });

  }
}