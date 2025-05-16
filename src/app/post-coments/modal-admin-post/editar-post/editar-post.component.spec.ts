import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditarPostComponent } from './editar-post.component';

describe('EditarPostComponent', () => {
  let component: EditarPostComponent;
  let fixture: ComponentFixture<EditarPostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditarPostComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditarPostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
