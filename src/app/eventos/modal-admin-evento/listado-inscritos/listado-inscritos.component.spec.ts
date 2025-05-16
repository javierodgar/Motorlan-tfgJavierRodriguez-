import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListadoInscritosComponent } from './listado-inscritos.component';

describe('ListadoInscritosComponent', () => {
  let component: ListadoInscritosComponent;
  let fixture: ComponentFixture<ListadoInscritosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListadoInscritosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListadoInscritosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
