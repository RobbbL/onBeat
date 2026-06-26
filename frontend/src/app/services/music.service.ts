import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { DecadeText } from '../models/decadetext.model';
import { Artist } from '../models/artist.model';
import { Radio } from '../models/radio.model';
import { Product } from '../models/product.model';
import { Ticket } from '../models/ticket.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})

export class MusicService {

  constructor(private http: HttpClient,
              private authService: AuthService
  ) {}

  private readonly api = `${environment.apiUrl}`;

  getDecadeInfo(year: string): Observable<DecadeText | undefined> {
    return this.http.get<DecadeText[]>('assets/data/texts.json').pipe(
      map(data => data.find(d => d.year === year))
    );
  }

  getArtistsByDecade(year: string): Observable<Artist[]> {
    return this.http.get<Artist[]>(`${this.api}/artists/decade/${year}`).pipe(
      map(artists =>
        artists.map(a => ({
          ...a,
          image: this.fixUrl(a.image),
          titleimg: this.fixUrl(a.titleimg)
        }))
      )
    );
  }

  getRadiosByDecade(year: string): Observable<Radio[]> {
    return this.http.get<Radio[]>(`${this.api}/radios/decade/${year}`).pipe(
      map(radios =>
        radios.map(r => ({
          ...r,
          image: this.fixUrl(r.image)
        }))
      )
    );
  }

  getArtistByID(id: number): Observable<Artist | null> {
    return this.http.get<Artist>(`${this.api}/artists/${id}`).pipe(
      map(a => ({
        ...a,
        image: this.fixUrl(a.image),
        titleimg: this.fixUrl(a.titleimg)
      }))
    );
  }

  getRadioByID(id: number): Observable<Radio | null> {
    return this.http.get<Radio>(`${this.api}/radios/${id}`).pipe(
      map(r => ({
        ...r,
        image: this.fixUrl(r.image),
        titleimg: this.fixUrl(r.titleimg)
      }))
    );
  }

  getProductByID(id: number): Observable<Product | null> {
    return this.http.get<Product>(`${this.api}/merchandising/${id}`).pipe(
      map(p => ({...p, image: this.fixUrl(p.image)}))
    );
  }

  getProductsByArtist(artistId: number): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.api}/merchandising/artist/${artistId}`).pipe(
      map(prods => prods.map(p => ({ ...p, image: this.fixUrl(p.image) })))
    );
  }

  searchArtists(term: string): Observable<Artist[]> {
    return this.http.get<Artist[]>(
      `${this.api}/artists/search/${encodeURIComponent(term)}`
    ).pipe(
      map(artists =>
        artists.map(a => ({
          ...a,
          image: this.fixUrl(a.image),
        }))
      )
    );
  }

  searchRadios(term: string): Observable<any[]> {
    return this.http.get<Radio[]>(
      `${this.api}/radios/search/${encodeURIComponent(term)}`
    ).pipe(
      map(radios =>
        radios.map(r => ({
          ...r,
          image: this.fixUrl(r.image)
        }))
      )
    );
  }

  searchMerch(term: string): Observable<any[]> {
    return this.http.get<Product[]>(`${this.api}/merchandising/search/${encodeURIComponent(term)}`).pipe(
      map(prods => prods.map(p => ({ ...p, image: this.fixUrl(p.image) })))
    );
  }

  searchTickets(term: string): Observable<any[]> {
    return this.http.get<Ticket[]>(`${this.api}/tickets/search/${encodeURIComponent(term)}`);
  }

  createArtist(body: FormData): Observable<any> {
    const token = this.authService.getToken();

    return this.http.post(
      `${this.api}/artists`, 
      body, 
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
  }

  createRadio(body: FormData): Observable<any> {
    const token = this.authService.getToken();
    return this.http.post(`${this.api}/radios`, body, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  createMerch(body: FormData): Observable<any> {
    const token = this.authService.getToken();
    return this.http.post(`${this.api}/merchandising`, body, {
      headers: { 
        Authorization: `Bearer ${token}` 
      }
    });
  }

  createTicket(body: FormData): Observable<any> {
    const token = this.authService.getToken();
    return this.http.post(`${this.api}/tickets`, body, {
      headers: { 
        Authorization: `Bearer ${token}` 
      }
    });
  }

  updateArtist(id: number, changes: any): Observable<any> {
    const token = this.authService.getToken();
    return this.http.patch(`${this.api}/artists/${id}`, changes, {
      headers: { 
        Authorization: `Bearer ${token}` 
      }
    });
  }

  updateRadio(id: number, changes: any): Observable<any> {
    const token = this.authService.getToken();
    return this.http.patch(`${this.api}/radios/${id}`, changes, {
      headers: { 
        Authorization: `Bearer ${token}`
       }
    });
  }

  updateMerch(id: number, changes: any): Observable<any> {
    const token = this.authService.getToken();
    return this.http.patch(`${this.api}/merchandising/${id}`, changes, {
      headers: { 
        Authorization: `Bearer ${token}`
       }
    });
  }

  updateTicket(id: number, changes: any): Observable<any> {
    const token = this.authService.getToken();
    return this.http.patch(`${this.api}/tickets/${id}`, changes, {
      headers: { 
        Authorization: `Bearer ${token}` 
      }
    });
  }

  deleteArtist(id: number): Observable<any> {
    const token = this.authService.getToken();

    return this.http.delete(
      `${this.api}/artists/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
  }

  deleteRadio(id: number): Observable<any> {
    const token = this.authService.getToken();

    return this.http.delete(
      `${this.api}/radios/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
  }

  deleteMerch(id: number): Observable<any> {
    const token = this.authService.getToken();
    return this.http.delete(`${this.api}/merchandising/${id}`, {
      headers: { 
        Authorization: `Bearer ${token}` }
    });
  }

  deleteTicket(id: number): Observable<any> {
    const token = this.authService.getToken();
    return this.http.delete(`${this.api}/tickets/${id}`, {
      headers: { 
        Authorization: `Bearer ${token}`
      }
    });
  }

  getTopArtists(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/artists/top`).pipe(
      map((artists: Artist[]) => {
        return artists.map(artist => ({
          ...artist,
          image: artist.image ? this.fixUrl(artist.image) : artist.image
        }));
      })
    );
  }

  likeArtist(artistId: number): Observable<any> {
    const token = this.authService.getToken();
    return this.http.post(
      `${this.api}/artists/like`, 
      { artistId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  }

  unlikeArtist(artistId: number): Observable<any> {
    const token = this.authService.getToken();
    return this.http.post(
      `${this.api}/artists/unlike`, 
      { artistId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  }

  checkIfLiked(artistId: number): Observable<{ liked: boolean }> {
    const token = this.authService.getToken();
    return this.http.get<{ liked: boolean }>(
      `${this.api}/artists/is-liked/${artistId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
  }

  public fixUrl(path: string): string {
    if (!path) 
      return '';
    
    if (path.startsWith('http')) 
      return path;

    return `${this.api}${path.startsWith('/') ? '' : '/'}${path}`;
  }
}