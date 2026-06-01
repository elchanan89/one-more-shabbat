import { AfterViewInit, Component, ElementRef, OnInit, signal, viewChild } from '@angular/core';
import { HomeComponent } from './features/shabbat/pages/home/home.component';

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
  `],
})
export class App implements OnInit, AfterViewInit {
  showSplash = signal(true);
  private splashVideo = viewChild<ElementRef<HTMLVideoElement>>('splashVideo');

  ngOnInit(): void {
    // Safety net: hide after 3s even if the video never fires 'ended'
    setTimeout(() => this.showSplash.set(false), 3000);
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
