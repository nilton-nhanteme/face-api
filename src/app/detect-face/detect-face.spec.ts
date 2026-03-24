import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetectFace } from './detect-face';

describe('DetectFace', () => {
  let component: DetectFace;
  let fixture: ComponentFixture<DetectFace>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetectFace],
    }).compileComponents();

    fixture = TestBed.createComponent(DetectFace);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
