import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SimilarFaceSearch } from './similar-face-search';

describe('SimilarFaceSearch', () => {
  let component: SimilarFaceSearch;
  let fixture: ComponentFixture<SimilarFaceSearch>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SimilarFaceSearch],
    }).compileComponents();

    fixture = TestBed.createComponent(SimilarFaceSearch);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
