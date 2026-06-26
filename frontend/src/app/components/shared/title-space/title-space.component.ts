import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-title-space',
  templateUrl: './title-space.component.html',
  styleUrls: ['./title-space.component.scss'],
  standalone: true
})
export class TitleSpaceComponent  implements OnInit {

  @Input() title: string = '';
  @Input() subtitle: string = '';

  constructor() { }

  ngOnInit() {}

}