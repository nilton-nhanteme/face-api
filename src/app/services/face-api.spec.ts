import { TestBed } from '@angular/core/testing';

import { FaceApiService } from './face-api';

describe('FaceApiService', () => {
  let service: FaceApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FaceApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
