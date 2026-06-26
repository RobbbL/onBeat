import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { TitleSpaceComponent } from '../components/shared/title-space/title-space.component';

@Component({
  selector: 'app-forum-list',
  templateUrl: './forum-list.page.html',
  styleUrls: ['./forum-list.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, TitleSpaceComponent]
})
export class ForumListPage {

  decades = [
    { id: '60s', name: "Anni '60", description: "La rivoluzione beat, il rock psichedelico e Woodstock." },
    { id: '70s', name: "Anni '70", description: "I giganti del rock, il punk e la nascita della disco music." },
    { id: '80s', name: "Anni '80", description: "L'esplosione del pop elettronico, dei synth e di MTV." },
    { id: '90s', name: "Anni '90", description: "L'era del grunge, dell'hip-hop d'oro e del britpop." },
    { id: '2000s', name: 'Anni 2000', description: "L'avvento della musica digitale, indie rock e R&B moderno." }
  ];

  constructor(private router: Router) {}

  goToForum(category: string) {
    this.router.navigate(['/forum', category]);
  }
}
