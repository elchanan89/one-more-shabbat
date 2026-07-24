import { Component } from '@angular/core';
import { HomeComponent } from './features/shabbat/pages/home/home.component';

@Component({
  selector: 'app-root',
  imports: [HomeComponent],
  template: `<app-home />`,
})
export class App {}
