import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { catchError, finalize, of, timeout } from 'rxjs';
import { Story } from '../../models/story.model';
import { StoryItem } from '../../models/story-item.model';
import { StoryService } from '../../services/story.service';

@Component({
  selector: 'admin-stories-list',
  templateUrl: './stories-list.component.html',
  styleUrls: ['./stories-list.component.css'],
  standalone: false
})
export class StoriesListComponent implements OnInit {
  stories: Story[] = [];
  storyItems: StoryItem[] = [];
  expandedStoryId: number | null = null;

  loadingStories = false;
  loadingStoryItems = false;
  savingStory = false;
  savingStoryItem = false;
  storyItemSavingMap: Record<number, boolean> = {};

  storyItemDrafts: Record<number, {
    storyLink: string;
    isActive: boolean;
    like: number;
    comment: string;
    createdAt: string;
    endDate: string;
    file?: File;
  }> = {};

  newStory = {
    description: '',
    isActive: true,
    createdAt: this.toDateTimeLocal(new Date()),
    endDate: this.toDateTimeLocal(this.addHours(new Date(), 24)),
    temp: true
  };

  constructor(
    private storyService: StoryService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.loadStories();
    this.loadStoryItems();
  }

  loadStories() {
    this.loadingStories = true;
    this.storyService.getStories()
      .pipe(
        timeout(10000),
        catchError(() => of([])),
        finalize(() => {
          this.ngZone.run(() => {
            this.loadingStories = false;
            this.cdr.detectChanges();
          });
        })
      )
      .subscribe(res => {
        this.ngZone.run(() => {
          this.stories = this.normalizeArray<any>(res).map(item => this.mapStory(item));
          this.cdr.detectChanges();
        });
      });
  }

  loadStoryItems() {
    this.loadingStoryItems = true;
    this.storyService.getStoryItems()
      .pipe(
        timeout(10000),
        catchError(() => of([])),
        finalize(() => {
          this.ngZone.run(() => {
            this.loadingStoryItems = false;
            this.cdr.detectChanges();
          });
        })
      )
      .subscribe(res => {
        this.ngZone.run(() => {
          this.storyItems = this.normalizeArray<any>(res).map(item => this.mapStoryItem(item));
          this.cdr.detectChanges();
        });
      });
  }

  toggleStoryItemsPanel(storyId: number) {
    if (this.expandedStoryId === storyId) {
      this.expandedStoryId = null;
      return;
    }

    this.expandedStoryId = storyId;
    this.ensureStoryItemDraft(storyId);
  }

  createStory() {
    if (!this.newStory.description?.trim()) {
      return;
    }

    this.applyStoryTempEndDateRule();

    this.savingStory = true;
    const formData = new FormData();
    this.appendIfPresent(formData, 'Description', this.newStory.description);
    formData.append('IsActive', String(this.newStory.isActive));
    this.appendIfPresent(formData, 'CreatedAt', this.toIsoString(this.newStory.createdAt));
    if (this.newStory.temp) {
      this.appendIfPresent(formData, 'EndDate', this.toIsoString(this.newStory.endDate));
    }
    formData.append('Temp', String(this.newStory.temp));

    this.storyService.createStory(formData)
      .pipe(finalize(() => (this.savingStory = false)))
      .subscribe({
        next: () => {
          const createdAt = this.newStory.createdAt;
          const endDate = this.newStory.endDate;
          const temp = this.newStory.temp;
          const description = this.newStory.description;

          this.newStory = {
            description: '',
            isActive: true,
            createdAt: this.toDateTimeLocal(new Date()),
            endDate: this.toDateTimeLocal(this.addHours(new Date(), 24)),
            temp: true
          };

          // Optimistically show the new row immediately, then sync with backend.
          this.stories = [
            {
              id: Date.now(),
              description,
              isActive: true,
              createdAt,
              endDate,
              temp
            },
            ...this.stories
          ];

          this.loadStories();
          setTimeout(() => this.loadStories(), 700);
        }
      });
  }

  onStoryTempChanged() {
    this.applyStoryTempEndDateRule();
  }

  onStoryCreatedAtChanged() {
    if (this.newStory.temp) {
      this.applyStoryTempEndDateRule();
    }
  }

  onStoryItemFileSelected(storyId: number, event: Event) {
    this.ensureStoryItemDraft(storyId);
    const file = (event.target as HTMLInputElement).files?.[0];
    this.storyItemDrafts[storyId].file = file;
  }

  createStoryItem(storyId: number) {
    this.ensureStoryItemDraft(storyId);
    const draft = this.storyItemDrafts[storyId];

    const parentStory = this.stories.find(s => s.id === storyId);
    if (parentStory?.endDate && this.isEnded(parentStory.endDate)) {
      return;
    }

    if (parentStory?.endDate && draft.endDate) {
      const parentEnd = new Date(parentStory.endDate).getTime();
      const childEnd = new Date(draft.endDate).getTime();
      if (!Number.isNaN(parentEnd) && !Number.isNaN(childEnd) && childEnd > parentEnd) {
        draft.endDate = this.toDateTimeLocal(new Date(parentEnd));
      }
    }

    this.savingStoryItem = true;
    this.storyItemSavingMap[storyId] = true;
    const formData = new FormData();
    formData.append('StoryId', String(storyId));
    this.appendIfPresent(formData, 'StoryLink', draft.storyLink);
    formData.append('IsActive', String(draft.isActive));
    formData.append('Like', String(draft.like ?? 0));
    this.appendIfPresent(formData, 'Comment', draft.comment);
    this.appendIfPresent(formData, 'CreatedAt', this.toIsoString(draft.createdAt));
    this.appendIfPresent(formData, 'EndDate', this.toIsoString(draft.endDate));
    if (draft.file) {
      formData.append('file', draft.file);
    }

    this.storyService.createStoryItem(formData)
      .pipe(finalize(() => {
        this.savingStoryItem = false;
        this.storyItemSavingMap[storyId] = false;
      }))
      .subscribe({
        next: () => {
          // Optimistic insert for immediate UI feedback.
          this.storyItems = [
            {
              id: Date.now(),
              storyId,
              storyLink: draft.storyLink,
              isActive: draft.isActive,
              like: draft.like,
              comment: draft.comment,
              createdAt: draft.createdAt,
              endDate: draft.endDate
            },
            ...this.storyItems
          ];

          this.storyItemDrafts[storyId] = {
            storyLink: '',
            isActive: true,
            like: 0,
            comment: '',
            createdAt: this.toDateTimeLocal(new Date()),
            endDate: this.toDateTimeLocal(this.addHours(new Date(), 24)),
            file: undefined
          };

          this.loadStoryItems();
          setTimeout(() => this.loadStoryItems(), 700);
        }
      });
  }

  toggleStory(story: Story) {
    this.storyService.toggleStory(story.id).subscribe(() => this.loadStories());
  }

  toggleStoryItem(item: StoryItem) {
    this.storyService.toggleStoryItem(item.id).subscribe(() => this.loadStoryItems());
  }

  getStoryTitle(storyId?: number): string {
    if (!storyId) {
      return '-';
    }
    const story = this.stories.find(s => s.id === storyId);
    return story?.description || String(storyId);
  }

  trackById(_: number, item: { id: number }) {
    return item.id;
  }

  getStoryItemsByStoryId(storyId: number): StoryItem[] {
    return this.storyItems.filter(item => item.storyId === storyId);
  }

  isStoryItemSaving(storyId: number): boolean {
    return !!this.storyItemSavingMap[storyId];
  }

  getStoryItemDraft(storyId: number) {
    this.ensureStoryItemDraft(storyId);
    return this.storyItemDrafts[storyId];
  }

  private appendIfPresent(formData: FormData, key: string, value?: string) {
    if (value && value.trim().length > 0) {
      formData.append(key, value.trim());
    }
  }

  private normalizeArray<T>(res: any): T[] {
    if (Array.isArray(res)) {
      return res;
    }
    if (Array.isArray(res?.data)) {
      return res.data;
    }
    if (Array.isArray(res?.items)) {
      return res.items;
    }
    if (Array.isArray(res?.result)) {
      return res.result;
    }
    if (Array.isArray(res?.value)) {
      return res.value;
    }
    return [];
  }

  private ensureStoryItemDraft(storyId: number) {
    if (this.storyItemDrafts[storyId]) {
      return;
    }

    this.storyItemDrafts[storyId] = {
      storyLink: '',
      isActive: true,
      like: 0,
      comment: '',
      createdAt: this.toDateTimeLocal(new Date()),
      endDate: this.toDateTimeLocal(this.addHours(new Date(), 24)),
      file: undefined
    };
  }

  private mapStory(raw: any): Story {
    return {
      id: raw?.id ?? raw?.Id,
      description: raw?.description ?? raw?.Description,
      isActive: raw?.isActive ?? raw?.IsActive ?? false,
      createdAt: raw?.createdAt ?? raw?.CreatedAt,
      endDate: raw?.endDate ?? raw?.EndDate,
      temp: raw?.temp ?? raw?.Temp,
      updatedAt: raw?.updatedAt ?? raw?.UpdatedAt
    };
  }

  private mapStoryItem(raw: any): StoryItem {
    return {
      id: raw?.id ?? raw?.Id,
      storyId: raw?.storyId ?? raw?.StoryId ?? 0,
      storyLink: raw?.storyLink ?? raw?.StoryLink,
      isActive: raw?.isActive ?? raw?.IsActive ?? false,
      like: raw?.like ?? raw?.Like,
      comment: raw?.comment ?? raw?.Comment,
      createdAt: raw?.createdAt ?? raw?.CreatedAt,
      endDate: raw?.endDate ?? raw?.EndDate,
      fileUrl: raw?.fileUrl ?? raw?.FileUrl,
      updatedAt: raw?.updatedAt ?? raw?.UpdatedAt
    };
  }

  private toIsoString(value: string): string {
    return value ? new Date(value).toISOString() : '';
  }

  private applyStoryTempEndDateRule() {
    if (this.newStory.temp) {
      const created = this.newStory.createdAt ? new Date(this.newStory.createdAt) : new Date();
      this.newStory.endDate = this.toDateTimeLocal(this.addHours(created, 24));
      return;
    }

    // Open-ended story: no end date.
    this.newStory.endDate = '';
  }

  private toDateTimeLocal(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const min = pad(date.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  }

  private addHours(date: Date, hours: number): Date {
    return new Date(date.getTime() + hours * 60 * 60 * 1000);
  }

  private isEnded(endDate?: string): boolean {
    if (!endDate) {
      return false;
    }
    const end = new Date(endDate).getTime();
    if (Number.isNaN(end)) {
      return false;
    }
    return end <= Date.now();
  }

}
