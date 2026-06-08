import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, signal, viewChild } from '@angular/core';
import { HomeComponent } from './features/shabbat/pages/home/home.component';

const SPLASH_MS = 10000;

@Component({
  selector: 'app-root',
  imports: [HomeComponent],
  template: `
    @if (showSplash()) {
      <div class="splash-overlay">
        <video
          #splashVideo
          muted
          autoplay
          loop
          playsinline
          preload="auto"
          src="/splash.mp4"
        ></video>
        <button type="button" class="skip-btn" (click)="hideSplash()">
          דלג
        </button>
      </div>
    } @else {
      <app-home />
    }
  `,
  styles: [`
    .splash-overlay {
      position: fixed;
      inset: 0;
      background: #000;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    video {
      width: 100%;
      height: 100%;
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
    .skip-btn {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      bottom: calc(24px + env(safe-area-inset-bottom, 0px));
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 9px 22px;
      border: 1px solid rgba(255, 255, 255, 0.35);
      border-radius: 999px;
      background: rgba(0, 0, 0, 0.45);
      color: #fff;
      font-family: 'Heebo', sans-serif;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      -webkit-backdrop-filter: blur(4px);
      backdrop-filter: blur(4px);
      transition: background 0.15s, transform 0.1s;
    }
    .skip-btn:hover { background: rgba(0, 0, 0, 0.65); }
    .skip-btn:active { transform: translateX(-50%) scale(0.96); }
  `],
})
export class App implements OnInit, AfterViewInit, OnDestroy {
  showSplash = signal(true);
  private splashVideo = viewChild<ElementRef<HTMLVideoElement>>('splashVideo');
  private timer?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    // Auto-dismiss after the splash duration (video loops to fill the time).
    this.timer = setTimeout(() => this.showSplash.set(false), SPLASH_MS);
  }

  ngAfterViewInit(): void {
    const el = this.splashVideo()?.nativeElement;
    if (!el) return;
    // Set muted as a PROPERTY (the template attribute alone isn't reliable in
    // Angular) so the browser allows muted autoplay instead of a static frame.
    el.muted = true;
    el.play().catch(() => {
      // Autoplay blocked — the timer / skip button still transition through.
    });
  }

  hideSplash(): void {
    if (this.timer) clearTimeout(this.timer);
    this.showSplash.set(false);
  }

  ngOnDestroy(): void {
    if (this.timer) clearTimeout(this.timer);
  }
}
