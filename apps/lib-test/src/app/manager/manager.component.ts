import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'test-manager',
  template: `
    <button class="btn btn-start" (click)="onClickStart()">Start</button>
  `,
  styleUrls: ['./manager.component.scss']
})
export class ManagerComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

  onClickStart(): void {

  }

}
