import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserPostsGeneralComponent } from './user-posts-general.component';

describe('UserPostsGeneralComponent', () => {
  let component: UserPostsGeneralComponent;
  let fixture: ComponentFixture<UserPostsGeneralComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserPostsGeneralComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserPostsGeneralComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
