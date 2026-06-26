import { Injectable, Injector, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '@environments/environment';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class OrdersService {
  
  private http = inject(HttpClient);
  private injector = inject(Injector);
  private readonly api = `${environment.apiUrl}/orders`;

  createOrder(orderData: { shipping: any; products: any[]; total: number }): Observable<any> {
    return this.http.post<any>(`${this.api}/create`, orderData);
  }

  getOrders(): Observable<any[]> {
    const authService = this.injector.get(AuthService);
    const token = authService.getToken();

    return this.http.get<any[]>(
      `${this.api}/user-orders`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
  }
}