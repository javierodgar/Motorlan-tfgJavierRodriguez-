import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-alert',
  imports: [CommonModule],
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.css'],
})
export class AlertComponent implements OnInit {
  @Input() text: string = '';
  @Input() backgroundColor: string = 'lightblue'; 
  isVisible: boolean = false;

  ngOnInit(): void {
    this.show();
  }

  show(): void {
    this.isVisible = true;
    setTimeout(() => {
      this.hide();
    }, 3000); 
  }

  hide(): void {
    this.isVisible = false;
  }
}