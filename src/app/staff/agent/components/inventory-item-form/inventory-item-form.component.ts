import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import {
  CreateInventoryItemRequest,
  InventoryItem,
  UpdateInventoryItemRequest
} from '../../../models/inventory.model';
import { InventoryItemService } from '../../../services/inventory-item.service';

interface InventoryItemFormControls {
  code: FormControl<string>;
  name: FormControl<string>;
  costPrice: FormControl<number | null>;
  sellingPrice: FormControl<number | null>;
  isActive: FormControl<boolean>;
}

type InventoryItemFormGroup = FormGroup<InventoryItemFormControls>;

interface InventoryHeaderParticle {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  alpha: number;
  phase: number;
  pulse: number;
  link: boolean;
}

@Component({
  selector: 'app-inventory-item-form',
  templateUrl: './inventory-item-form.component.html',
  styleUrls: ['./inventory-item-form.component.scss'],
  standalone: false
})
export class InventoryItemFormComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('inventoryScale') private readonly inventoryScaleRef?: ElementRef<HTMLDivElement>;
  @ViewChild('inventoryBoard') private readonly inventoryBoardRef?: ElementRef<HTMLElement>;
  @ViewChild('holoCanvas') private readonly holoCanvasRef?: ElementRef<HTMLCanvasElement>;

  itemForm: InventoryItemFormGroup;
  isEditMode = false;
  itemId: number | null = null;
  isLoading = false;
  isSaving = false;
  error = '';

  private readonly destroy$ = new Subject<void>();
  private inventoryHeroViewReady = false;
  private inventoryHeroAnimationFrame = 0;
  private inventoryHeroRunId = 0;
  private inventoryHeroParticles: InventoryHeaderParticle[] = [];
  private readonly inventoryHeroResizeObservers: ResizeObserver[] = [];
  private readonly currencyFormatter = new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly inventoryItemService: InventoryItemService,
    private readonly ngZone: NgZone
  ) {
    this.itemForm = this.fb.group<InventoryItemFormControls>({
      code: this.fb.nonNullable.control('', {
        validators: [Validators.required, Validators.maxLength(64)]
      }),
      name: this.fb.nonNullable.control('', {
        validators: [Validators.required, Validators.maxLength(160)]
      }),
      costPrice: this.fb.control<number | null>(null, {
        validators: [Validators.required, Validators.min(0)]
      }),
      sellingPrice: this.fb.control<number | null>(null, {
        validators: [Validators.required, Validators.min(0)]
      }),
      isActive: this.fb.nonNullable.control(true)
    });
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const routeId = params.get('id');
      const parsedId = Number(routeId);
      this.isEditMode = routeId !== null && Number.isFinite(parsedId);
      this.itemId = this.isEditMode ? parsedId : null;

      if (this.isEditMode && this.itemId !== null) {
        this.loadItem(this.itemId);
      }
    });
  }

  ngAfterViewInit(): void {
    this.inventoryHeroViewReady = true;
    this.queueInventoryHeroSetup();
  }

  ngOnDestroy(): void {
    this.destroyInventoryHero();
    this.destroy$.next();
    this.destroy$.complete();
  }

  get profitPreview(): number | null {
    const costPrice = this.itemForm.controls.costPrice.value;
    const sellingPrice = this.itemForm.controls.sellingPrice.value;

    if (costPrice === null || sellingPrice === null) {
      return null;
    }

    return sellingPrice - costPrice;
  }

  onSubmit(): void {
    if (this.itemForm.invalid) {
      this.itemForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.error = '';

    if (this.isEditMode && this.itemId !== null) {
      this.inventoryItemService.update(this.itemId, this.buildUpdatePayload()).subscribe({
        next: () => this.handleSaveSuccess(),
        error: () => this.handleSaveError()
      });
      return;
    }

    this.inventoryItemService.create(this.buildCreatePayload()).subscribe({
      next: () => this.handleSaveSuccess(),
      error: () => this.handleSaveError()
    });
  }

  formatCurrency(value: number | null | undefined): string {
    return value === null || value === undefined ? '-' : `${this.currencyFormatter.format(value)} TL`;
  }

  private queueInventoryHeroSetup(): void {
    if (!this.inventoryHeroViewReady) {
      return;
    }

    window.setTimeout(() => this.setupInventoryHero());
  }

  private setupInventoryHero(): void {
    const scaleWrap = this.inventoryScaleRef?.nativeElement;
    const board = this.inventoryBoardRef?.nativeElement;
    const canvas = this.holoCanvasRef?.nativeElement;
    const scene = canvas?.parentElement;
    const ctx = canvas?.getContext('2d');

    if (!scaleWrap || !board || !canvas || !scene || !ctx) {
      return;
    }

    this.destroyInventoryHero();
    const runId = ++this.inventoryHeroRunId;

    const fitInventoryHeader = () => {
      const scale = scaleWrap.clientWidth / 2048;
      scaleWrap.style.height = `${278 * scale}px`;
      board.style.transform = `scale(${scale})`;
    };

    const scaleObserver = new ResizeObserver(fitInventoryHeader);
    scaleObserver.observe(scaleWrap);
    this.inventoryHeroResizeObservers.push(scaleObserver);
    fitInventoryHeader();

    let width = 804;
    let height = 205;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const rand = (min: number, max: number) => Math.random() * (max - min) + min;

    const createParticles = () => {
      const count = 86;

      this.inventoryHeroParticles = Array.from({ length: count }, (_, i) => ({
        x: rand(90, width - 90),
        y: rand(26, height - 36),
        r: rand(0.8, 2.35),
        vx: rand(-0.14, 0.14),
        vy: rand(-0.10, 0.10),
        alpha: rand(0.18, 0.70),
        phase: rand(0, Math.PI * 2),
        pulse: rand(0.010, 0.028),
        link: i % 5 === 0
      }));
    };

    const resizeCanvas = () => {
      width = scene.clientWidth;
      height = scene.clientHeight;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      createParticles();
    };

    const drawSoftBackground = () => {
      const gradient = ctx.createRadialGradient(
        width / 2,
        height * 0.76,
        0,
        width / 2,
        height * 0.76,
        width * 0.43
      );

      gradient.addColorStop(0, 'rgba(35, 218, 230, .18)');
      gradient.addColorStop(0.34, 'rgba(35, 218, 230, .055)');
      gradient.addColorStop(1, 'rgba(35, 218, 230, 0)');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    };

    const drawLinks = () => {
      const cx = width / 2;
      const cy = height * 0.72;

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      for (const particle of this.inventoryHeroParticles) {
        if (!particle.link) continue;

        const dx = particle.x - cx;
        const dy = particle.y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 270) {
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(particle.x, particle.y);
          ctx.strokeStyle = `rgba(43, 219, 230, ${Math.max(0, 0.115 - dist / 2500)})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      ctx.restore();
    };

    const draw = (time: number) => {
      if (runId !== this.inventoryHeroRunId) {
        return;
      }

      ctx.clearRect(0, 0, width, height);

      drawSoftBackground();
      drawLinks();

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      for (const particle of this.inventoryHeroParticles) {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < 62 || particle.x > width - 62) particle.vx *= -1;
        if (particle.y < 18 || particle.y > height - 22) particle.vy *= -1;

        const alpha = Math.max(0.05, particle.alpha + Math.sin(time * particle.pulse + particle.phase) * 0.20);

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(42, 226, 236, ${alpha})`;
        ctx.shadowColor = 'rgba(42, 226, 236, .72)';
        ctx.shadowBlur = 10;
        ctx.fill();
      }

      ctx.restore();

      this.inventoryHeroAnimationFrame = window.requestAnimationFrame(draw);
    };

    const canvasObserver = new ResizeObserver(resizeCanvas);
    canvasObserver.observe(scene);
    this.inventoryHeroResizeObservers.push(canvasObserver);

    this.ngZone.runOutsideAngular(() => {
      resizeCanvas();
      this.inventoryHeroAnimationFrame = window.requestAnimationFrame(draw);
    });
  }

  private destroyInventoryHero(): void {
    this.inventoryHeroRunId++;

    if (this.inventoryHeroAnimationFrame) {
      window.cancelAnimationFrame(this.inventoryHeroAnimationFrame);
      this.inventoryHeroAnimationFrame = 0;
    }

    while (this.inventoryHeroResizeObservers.length) {
      this.inventoryHeroResizeObservers.pop()?.disconnect();
    }
  }

  private loadItem(id: number): void {
    this.isLoading = true;
    this.error = '';

    this.inventoryItemService.getById(id).subscribe({
      next: (item) => {
        this.patchItem(item);
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Kayıt alınırken bir hata oluştu.';
        this.isLoading = false;
      }
    });
  }

  private patchItem(item: InventoryItem): void {
    this.itemForm.reset({
      code: item.code ?? '',
      name: item.name,
      costPrice: item.costPrice ?? null,
      sellingPrice: item.sellingPrice ?? null,
      isActive: item.isActive !== false
    });
  }

  private buildCreatePayload(): CreateInventoryItemRequest {
    const rawValue = this.itemForm.getRawValue();

    return {
      code: rawValue.code.trim(),
      name: rawValue.name.trim(),
      costPrice: this.requireNumber(rawValue.costPrice),
      sellingPrice: this.requireNumber(rawValue.sellingPrice),
      isActive: rawValue.isActive
    };
  }

  private buildUpdatePayload(): UpdateInventoryItemRequest {
    return {
      id: this.requireNumber(this.itemId),
      ...this.buildCreatePayload()
    };
  }

  private handleSaveSuccess(): void {
    this.isSaving = false;
    void this.router.navigate(['/staff/inventory/items']);
  }

  private handleSaveError(): void {
    this.error = 'Kayıt kaydedilirken bir hata oluştu.';
    this.isSaving = false;
  }

  private requireNumber(value: number | null): number {
    if (value === null || !Number.isFinite(value)) {
      throw new Error('Required numeric value is missing.');
    }

    return value;
  }
}
