import { AfterViewInit, Component, ElementRef, inject, OnInit, signal, viewChild } from '@angular/core';
import { HomeComponent } from './features/shabbat/pages/home/home.component';
import { AudioService } from './core/services/audio.service';

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
          playsinline
          preload="auto"
          src="/splash.mp4"
          (ended)="hideSplash()"
        ></video>
        <button class="splash-skip" type="button" (click)="hideSplash()">
          <span class="skip-text">דלג</span>
          <span class="skip-arrow">‹</span>
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
    .splash-skip {
      position: absolute;
      bottom: 34px;
      left: 50%;
      transform: translateX(-50%);
      direction: rtl;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 13px 30px;
      border-radius: 999px;
      border: 1.5px solid rgba(212, 175, 55, 0.9);
      background: rgba(10, 14, 26, 0.82);
      -webkit-backdrop-filter: blur(4px);
      backdrop-filter: blur(4px);
      color: #f5e6b8;
      font-family: 'Heebo', sans-serif;
      font-size: 17px;
      font-weight: 700;
      letter-spacing: 0.03em;
      cursor: pointer;
      opacity: 0;
      box-shadow: 0 6px 24px rgba(0, 0, 0, 0.6), 0 0 16px rgba(212, 175, 55, 0.25);
      animation: skip-fade-in 0.5s ease 1s forwards;
      transition: background 0.2s, border-color 0.2s, transform 0.15s, box-shadow 0.2s;
    }
    .splash-skip:hover {
      background: rgba(10, 14, 26, 0.95);
      border-color: rgba(212, 175, 55, 1);
      box-shadow: 0 6px 28px rgba(0, 0, 0, 0.7), 0 0 22px rgba(212, 175, 55, 0.45);
    }
    .splash-skip:active {
      transform: translateX(-50%) scale(0.95);
    }
    .skip-text {
      line-height: 1;
    }
    .skip-arrow {
      font-size: 22px;
      line-height: 1;
      margin-top: -2px;
      /* '‹' is bidi-mirrored: inside the RTL button it would flip to point
         right. Isolate it in LTR so the glyph keeps pointing left. */
      direction: ltr;
      unicode-bidi: isolate;
    }
    @keyframes skip-fade-in {
      to { opacity: 1; }
    }
    @media (max-width: 480px) {
      .splash-skip {
        bottom: 26px;
        padding: 12px 26px;
        font-size: 16px;
      }
    }
  `],
})
export class App implements OnInit, AfterViewInit {
  showSplash = signal(true);
  private splashVideo = viewChild<ElementRef<HTMLVideoElement>>('splashVideo');
  private audio = inject(AudioService);

  constructor() {
    // Arm the first-gesture music listener at the root so a tap during the
    // splash (e.g. the skip button) starts the song — Home mounts too late.
    this.audio.init();
  }

  ngOnInit(): void {
    // Show only the first 5s of the clip, then transition to the app. Also
    // acts as the safety net if the video never plays (autoplay blocked).
    setTimeout(() => this.showSplash.set(false), 5000);
  }

  ngAfterViewInit(): void {
    const el = this.splashVideo()?.nativeElement;
    if (!el) return;
    // Set muted as a PROPERTY (the template attribute alone isn't reliable in
    // Angular) so the browser allows muted autoplay instead of showing a
    // static first frame.
    el.muted = true;
    el.play().catch(() => {
      // Autoplay still blocked — just let the 3s timer transition through.
    });
  }

  hideSplash(): void {
    this.showSplash.set(false);
  }
}
