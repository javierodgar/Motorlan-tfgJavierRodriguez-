import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisplayPequeComponent } from './display-peque.component';

describe('DisplayPequeComponent', () => {
  let component: DisplayPequeComponent;
  let fixture: ComponentFixture<DisplayPequeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisplayPequeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DisplayPequeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
