import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import { HttpClientModule } from '@angular/common/http';
import { MusicService } from '../services/music.service';
import { CartService } from '../services/cart.service';
import { Ticket } from '../models/ticket.model'; 
import { SearchBarComponent } from '../components/shared/search-bar/search-bar.component';
import { TitleSpaceComponent } from '../components/shared/title-space/title-space.component';
import { MapComponent } from '../components/map/map.component';

@Component({
  selector: 'app-ticket',
  templateUrl: './ticket.page.html',
  styleUrl: './ticket.page.scss',
  standalone: true,
  imports: [
    IonContent, 
    CommonModule, 
    FormsModule, 
    HttpClientModule, 
    SearchBarComponent, 
    TitleSpaceComponent,
    MapComponent
  ]
})
export class TicketPage implements OnInit {

  @ViewChild(MapComponent) eventMap!: MapComponent;

  tickets: Ticket[] = [];
  showMap: boolean = false;
  selectedArtistName: string | null = null;
  filteredTickets: Ticket[] = [];
  uniqueArtists: { id: number | string, name: string }[] = [];
  selectedArtistId: number | string = '';

  constructor(
    private musicService: MusicService,
    private cartService: CartService             
  ) { }

  ngOnInit() {
    this.loadAllTickets();
  }

  loadAllTickets() {
    this.musicService.searchTickets('all_events_list').subscribe({
      next: (data: Ticket[]) => {
        this.tickets = data;
        this.filteredTickets = data;
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  goToArtist(artist: any) { 
    if (!artist || !artist.name) {
      this.resetFilter();
      return;
    }
    this.selectedArtistName = artist.name;
    this.filteredTickets = this.tickets.filter(
      ticket => ticket.artist_name?.toLowerCase().trim() === artist.name.toLowerCase().trim()
    );
  }

  resetFilter() {
    this.selectedArtistName = null;
    this.filteredTickets = this.tickets;
  }

  toggleMap() {
    this.showMap = !this.showMap;
  }

  focusOnEvent(ticket: any) {
    if (!ticket || !ticket.place) return;
    this.showMap = true;
    
    setTimeout(() => {
      if (this.eventMap) {
        this.eventMap.focusOnPlace(ticket.place);
      }
    }, 200);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  onBuyTicket(ticket: Ticket) {
    const itemForCart = {
      id: ticket.id,
      name: ticket.event_name,
      price: ticket.price,
      type: 'ticket',
      place: ticket.place,
      date: ticket.date
    };
    this.cartService.addToCart(itemForCart);
  }
}