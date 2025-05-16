import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalGestionUsuarioComponent } from './modal-gestion-usuario.component';

describe('ModalGestionUsuarioComponent', () => {
  let component: ModalGestionUsuarioComponent;
  let fixture: ComponentFixture<ModalGestionUsuarioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalGestionUsuarioComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalGestionUsuarioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
