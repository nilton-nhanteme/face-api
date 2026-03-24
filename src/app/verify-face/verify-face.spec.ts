import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerifyFace } from './verify-face';

describe('VerifyFace', () => {
  let component: VerifyFace;
  let fixture: ComponentFixture<VerifyFace>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerifyFace],
    }).compileComponents();

    fixture = TestBed.createComponent(VerifyFace);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
