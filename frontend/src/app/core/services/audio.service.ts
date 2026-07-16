import { Injectable, signal } from '@angular/core';

export type AudioState = 'waiting' | 'playing' | 'stopped';

const SONG_URL = '/welcome-song.mp3';
// The soft level is baked into the MP3 itself (ffmpeg volume=0.5) so it also
// applies on iOS, where HTMLMediaElement.volume is read-only and ignored.
const VOLUME = 1.0;

/**
 * Welcome song played once per visit. Browsers block unmuted autoplay, so
 * playback is armed on the first user gesture anywhere (pointerdown/keydown,
 * capture phase). Deliberately not persisted — the song greets every visit;
 * the header music button mutes/resumes it.
 */
@Injectable({ providedIn: 'root' })
export class AudioService {
  readonly state = signal<AudioState>('waiting');
  /** True once the song has actually played — used to stop nagging the user. */
  readonly hasPlayed = signal(false);

  private audio: HTMLAudioElement | null = null;
  private armed = false;

  /** Arm the one-time first-gesture listener. Safe to call more than once. */
  init(): void {
    if (this.armed) return;
    this.armed = true;

    const onFirstGesture = (e: Event) => {
      window.removeEventListener('pointerdown', onFirstGesture, true);
      window.removeEventListener('keydown', onFirstGesture, true);
      // A gesture on the music button itself is handled by its own click —
      // starting here too would make that click immediately pause the song.
      if ((e.target as Element | null)?.closest?.('.music-toggle')) return;
      this.play();
    };
    window.addEventListener('pointerdown', onFirstGesture, true);
    window.addEventListener('keydown', onFirstGesture, true);
  }

  toggle(): void {
    if (this.state() === 'playing') {
      this.audio?.pause();
      this.state.set('stopped');
    } else {
      this.play();
    }
  }

  private play(): void {
    const el = this.ensureAudio();
    el.play()
      .then(() => {
        this.state.set('playing');
        this.hasPlayed.set(true);
      })
      .catch(() => this.state.set('stopped')); // blocked/failed — the button still invites a manual play
  }

  private ensureAudio(): HTMLAudioElement {
    if (!this.audio) {
      this.audio = new Audio(SONG_URL);
      this.audio.loop = false;
      this.audio.volume = VOLUME;
      this.audio.preload = 'auto';
      this.audio.addEventListener('ended', () => this.state.set('stopped'));
    }
    return this.audio;
  }
}
