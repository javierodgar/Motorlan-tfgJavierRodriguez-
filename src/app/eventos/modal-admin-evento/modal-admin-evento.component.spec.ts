import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalAdminEventoComponent } from './modal-admin-evento.component';

describe('ModalAdminEventoComponent', () => {
  let component: ModalAdminEventoComponent;
  let fixture: ComponentFixture<ModalAdminEventoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalAdminEventoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalAdminEventoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
