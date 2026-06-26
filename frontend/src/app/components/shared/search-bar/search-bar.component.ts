import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MusicService } from '../../../services/music.service';

@Component({
  selector: 'app-search-bar',
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule]
})
export class SearchBarComponent {

  @Input() searchType: 'artist' | 'radio' | 'merchandising' | 'ticket' = 'artist';
  @Output() selectItem = new EventEmitter<any>();

  searchTerm: string = '';
  results: any[] = [];

  constructor(private musicService: MusicService) { }

  ngOnInit() {}

  onSearch() {
    const term = this.searchTerm.trim();

    if (!term) {
      this.results = [];
      return;
    }

    let search$;

    if (this.searchType === 'radio') {
      search$ = this.musicService.searchRadios(term);
    } else if (this.searchType === 'merchandising') {
      search$ = this.musicService.searchMerch(term);
    } else if (this.searchType === 'ticket') {
      search$ = this.musicService.searchTickets(term);
    } else {
      search$ = this.musicService.searchArtists(term);
    }

    search$.subscribe({
      next: (res) => {
        this.results = res;
      },
      error: (err) => {
        console.error(`Errore (ricerca ${this.searchType}):`, err);
        this.results = [];
      }
    });
  }

  select(item: any) {
    this.selectItem.emit(item);
    this.results = [];
    this.searchTerm = '';
  }

  getPlaceholder(): string {
    switch (this.searchType) {
      case 'radio':
        return 'Cerca una radio...';
      case 'merchandising':
        return 'Cerca un prodotto...';
      case 'ticket':
        return 'Cerca un ticket...';
      default:
        return 'Cerca un artista...';
    }
  }

  getSubtitle(item: any): string {
    switch (this.searchType) {
      case 'radio':
        return item.hometown;
      case 'merchandising':
        return item.price ? `${item.price} €` : '';
      case 'ticket':
        return item.place ? `${item.place} - ${item.price}€` : '';
      default:
        return item.genre;
    }
  }
}