import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PostComentsComponent } from './post-coments.component';

describe('PostComentsComponent', () => {
  let component: PostComentsComponent;
  let fixture: ComponentFixture<PostComentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostComentsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PostComentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
