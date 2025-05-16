import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalAdminPostComponent } from './modal-admin-post.component';

describe('ModalAdminPostComponent', () => {
  let component: ModalAdminPostComponent;
  let fixture: ComponentFixture<ModalAdminPostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalAdminPostComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalAdminPostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
