import { NgStyle } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { ChecklistModel } from '../../core/models';
import { TooltipService } from '../../core/services/tooltip.service';

@Component({
  selector: 'mkworld-collectible',
  templateUrl: './collectible.html',
  imports: [NgStyle],
  styleUrl: './collectible.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Collectible implements OnInit {
  private readonly tooltipService = inject(TooltipService);

  readonly checklistModel = input.required<ChecklistModel>();
  readonly checked = input.required<boolean>();
  readonly isPanning = input(false);
  readonly isFocused = input(false);
  readonly showCollected = input.required<boolean>();

  readonly imageUrl = computed(() => {
    const type = this.checklistModel().collectibleModel!.collectibleType;
    const suffix = this.checked() ? '-collected' : '';
    return `/imgs/${type}${suffix}.png`;
  });

  hovered = signal(false);
  readonly ready = signal(false);
  readonly disappearing = computed(() => this.checked() && !this.showCollected());

  ngOnInit(): void {
    setTimeout(() => this.ready.set(true), 0);
  }

  onClick(): void {
    if (this.isPanning()) {
      return;
    }

    this.tooltipService.setActiveTooltipData(this.checklistModel());
  }
}
