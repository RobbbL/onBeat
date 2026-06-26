import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ForumListPage } from './forum-list.page';

describe('ForumListPage', () => {
  let component: ForumListPage;
  let fixture: ComponentFixture<ForumListPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ForumListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
