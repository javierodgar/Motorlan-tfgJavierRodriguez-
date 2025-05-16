import { TestBed } from '@angular/core/testing';

import { PalabrasProhibidasService } from './palabras-prohibidas.service';

describe('PalabrasProhibidasService', () => {
  let service: PalabrasProhibidasService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PalabrasProhibidasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
