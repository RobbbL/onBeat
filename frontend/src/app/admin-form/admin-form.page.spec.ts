import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminFormPage } from './admin-form.page';

describe('AdminFormPage', () => {
  let component: AdminFormPage;
  let fixture: ComponentFixture<AdminFormPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminFormPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
