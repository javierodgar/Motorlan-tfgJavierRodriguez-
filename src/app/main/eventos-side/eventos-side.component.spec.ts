import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventosSideComponent } from './eventos-side.component';

describe('EventosSideComponent', () => {
  let component: EventosSideComponent;
  let fixture: ComponentFixture<EventosSideComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventosSideComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventosSideComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
