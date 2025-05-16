import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserEventsGeneralComponent } from './user-events-general.component';

describe('UserEventsGeneralComponent', () => {
  let component: UserEventsGeneralComponent;
  let fixture: ComponentFixture<UserEventsGeneralComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserEventsGeneralComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserEventsGeneralComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
