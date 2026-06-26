import { Component, Input, Output, EventEmitter, AfterViewInit, OnDestroy, ViewChild, TemplateRef, ApplicationRef, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Ticket } from '../../models/ticket.model';
import L from 'leaflet';

const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';
const iconDefault = L.icon({
  iconRetinaUrl, iconUrl, shadowUrl,
  iconSize: [25, 41], iconAnchor: [12, 41],
  popupAnchor: [1, -34], tooltipAnchor: [16, -28], shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = iconDefault;

@Component({
  selector: 'app-event-map',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements AfterViewInit, OnDestroy, OnChanges {
  @Input() tickets: Ticket[] = [];
  @Output() buyTicket = new EventEmitter<Ticket>();
  
  @ViewChild('mapPopupTemplate', { static: false }) mapPopupTemplate!: TemplateRef<any>;

  private map!: L.Map;
  private markersGroup!: L.LayerGroup;
  private popupsToDestroy: any[] = [];

  constructor(
    private http: HttpClient,
    private appRef: ApplicationRef
  ) {}

  ngAfterViewInit() {
    this.initMap();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['tickets'] && !changes['tickets'].firstChange) {
      this.plotTickets();
    }
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.off();
      this.map.remove();
    }
    this.destroyPendingPopups();
  }

  private destroyPendingPopups() {
    this.popupsToDestroy.forEach(viewRef => {
      if (!viewRef.destroyed) {
        this.appRef.detachView(viewRef);
        viewRef.destroy();
      }
    });
    this.popupsToDestroy = [];
  }

  private initMap() {
    this.map = L.map('map').setView([41.9028, 12.4964], 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.markersGroup = L.layerGroup().addTo(this.map);

    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
      }
    }, 100);

    this.setupUserLocation();
    this.plotTickets();
  }

  private setupUserLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const myLat = position.coords.latitude;
          const myLng = position.coords.longitude;
          this.map.setView([myLat, myLng], 11);

          const myLocationIcon = L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
          });

          L.marker([myLat, myLng], { icon: myLocationIcon })
            .addTo(this.map)
            .bindPopup('<b>Ti trovi qui</b>')
            .openPopup();
        },
        (error) => console.warn(error),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
  }

  private plotTickets() {
    if (!this.markersGroup) return;
    this.markersGroup.clearLayers();
    this.destroyPendingPopups();

    if (!this.tickets || this.tickets.length === 0) return;

    const ticketsByPlace: { [key: string]: Ticket[] } = {};
    
    this.tickets.forEach(ticket => {
      if (ticket.place) {
        const normalizedPlace = ticket.place.trim();
        if (!ticketsByPlace[normalizedPlace]) {
          ticketsByPlace[normalizedPlace] = [];
        }
        ticketsByPlace[normalizedPlace].push(ticket);
      }
    });

    Object.keys(ticketsByPlace).forEach(place => {
      const ticketsInThisPlace = ticketsByPlace[place];
      this.geocodeAndAddGroupMarker(place, ticketsInThisPlace);
    });
  }

  private geocodeAndAddGroupMarker(place: string, tickets: Ticket[]) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}&limit=1`;

    this.http.get<any[]>(url).subscribe({
      next: (results) => {
        if (results && results.length > 0) {
          const lat = parseFloat(results[0].lat);
          const lon = parseFloat(results[0].lon);

          const defaultIcon = L.icon({
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            iconSize: [25, 41], iconAnchor: [12, 41]
          });

          const viewRef = this.mapPopupTemplate.createEmbeddedView({ tickets: tickets });
          this.appRef.attachView(viewRef);
          this.popupsToDestroy.push(viewRef);

          const popupHtml = viewRef.rootNodes[0] as HTMLElement;

          const marker = L.marker([lat, lon], { icon: defaultIcon })
            .addTo(this.markersGroup)
            .bindPopup(popupHtml, { maxWidth: 260, className: 'custom-leaflet-popup' });

          marker.on('popupclose', () => {
            if (!viewRef.destroyed) {
              this.appRef.detachView(viewRef);
              viewRef.destroy();
            }
          });
        }
      },
      error: (err) => console.error(err)
    });
  }

  public focusOnPlace(place: string) {
    if (!this.map) return;
    
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}&limit=1`;
    this.http.get<any[]>(url).subscribe(results => {
      if (results && results.length > 0) {
        const lat = parseFloat(results[0].lat);
        const lon = parseFloat(results[0].lon);
        this.map.setView([lat, lon], 14); 

        this.markersGroup.eachLayer((layer: any) => {
          if (layer instanceof L.Marker) {
            const markerLatLng = layer.getLatLng();
            const isSameLat = Math.abs(markerLatLng.lat - lat) < 0.001;
            const isSameLng = Math.abs(markerLatLng.lng - lon) < 0.001;

            if (isSameLat && isSameLng) {
              setTimeout(() => {
                layer.openPopup();
                layer.getPopup()?.update();
              }, 100);
            }
          }
        });
      }
    });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  triggerBuyTicket(ticket: Ticket) {
    this.buyTicket.emit(ticket);
  }
}