import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventosFinalizadosParticipadosSideComponent } from './eventos-finalizados-participados-side.component';

describe('EventosFinalizadosParticipadosSideComponent', () => {
  let component: EventosFinalizadosParticipadosSideComponent;
  let fixture: ComponentFixture<EventosFinalizadosParticipadosSideComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventosFinalizadosParticipadosSideComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventosFinalizadosParticipadosSideComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
