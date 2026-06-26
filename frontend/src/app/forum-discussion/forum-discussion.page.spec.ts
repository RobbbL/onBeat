import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ForumDiscussionPage } from './forum-discussion.page';

describe('ForumDiscussionPage', () => {
  let component: ForumDiscussionPage;
  let fixture: ComponentFixture<ForumDiscussionPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ForumDiscussionPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
