import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AttachmentType } from '../../../models/attachment-type';

@Injectable({ providedIn: 'root' })
export class CustomerRequestService {
  private baseUrl = `${environment.apiUrl}/api/customer/requests`;

  constructor(private http: HttpClient) {}

  // ✅ Token'lı header oluştur
  private getAuthHeaders() {
    const token = localStorage.getItem('customerToken');
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`
      })
    };
  }

  createRequest(formData: FormData): Observable<any> {
    return this.http.post(this.baseUrl, formData, this.getAuthHeaders());
  }

  getMyRequests(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl, this.getAuthHeaders());
  }

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl, this.getAuthHeaders());
  }

  getDetail(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}`, this.getAuthHeaders());
  }

  cancel(id: number, reason: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/${id}/cancel`, { reason }, this.getAuthHeaders());
  }

  getRequestById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}`, this.getAuthHeaders());
  }

  // ✅ Dosya yükleme (type parametresi artık backend'de int olarak gidiyor)
  uploadFiles(requestId: number, files: File[], type: number) {
    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file); // backend [FromForm] List<IFormFile> files
    }
    formData.append('type', type.toString()); // backend [FromForm] int type

    return this.http.post(`${this.baseUrl}/${requestId}/attachments`, formData, this.getAuthHeaders());
  }
}
