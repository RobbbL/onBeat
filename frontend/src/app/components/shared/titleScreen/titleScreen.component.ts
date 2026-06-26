import { Component, Input} from '@angular/core';

@Component({
  selector: 'app-title-screen',
  standalone: true,
  templateUrl: './titleScreen.component.html',
  styleUrls: ['./titleScreen.component.scss'],
})
export class TitleScreenComponent {
  @Input() title!: string;
  @Input() subtitle!: string;
  @Input() imgBg!: string;

}