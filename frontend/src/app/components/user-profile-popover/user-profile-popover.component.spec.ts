import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { UserProfilePopoverComponent } from './user-profile-popover.component';

describe('UserProfilePopoverComponent', () => {
  let component: UserProfilePopoverComponent;
  let fixture: ComponentFixture<UserProfilePopoverComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [UserProfilePopoverComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UserProfilePopoverComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
