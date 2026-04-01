import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { Story } from '../models/story.model';
import { StoryItem } from '../models/story-item.model';

@Injectable({ providedIn: 'root' })
export class StoryService {
  private storiesUrl = `${environment.apiUrl}/api/admin/stories`;
  private storyItemsUrl = `${environment.apiUrl}/api/admin/story-items`;

  constructor(private http: HttpClient) {}

  getStories(): Observable<Story[]> {
    return this.http.get<Story[]>(this.storiesUrl);
  }

  getStoryItems(): Observable<StoryItem[]> {
    return this.http.get<StoryItem[]>(this.storyItemsUrl);
  }

  createStory(formData: FormData) {
    return this.http.post(`${this.storiesUrl}/create`, formData);
  }

  createStoryItem(formData: FormData) {
    return this.http.post(`${this.storyItemsUrl}/create`, formData);
  }

  toggleStory(id: number) {
    return this.http.patch(`${this.storiesUrl}/${id}/toggle`, {});
  }

  toggleStoryItem(id: number) {
    return this.http.patch(`${this.storyItemsUrl}/${id}/toggle`, {});
  }
}
