import { TestBed } from '@angular/core/testing';

import { PostUpdateService } from './post-update.service';

describe('PostUpdateService', () => {
  let service: PostUpdateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PostUpdateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
