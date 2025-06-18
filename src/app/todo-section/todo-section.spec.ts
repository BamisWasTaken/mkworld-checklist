import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TodoSection } from './todo-section';

describe('TodoSection', () => {
  let component: TodoSection;
  let fixture: ComponentFixture<TodoSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TodoSection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TodoSection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
