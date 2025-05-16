import { TestBed } from '@angular/core/testing';

import { TraduccionesService } from './traducciones.service';

describe('TraduccionesService', () => {
  let service: TraduccionesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TraduccionesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
