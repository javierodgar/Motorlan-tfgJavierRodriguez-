import { TestBed } from '@angular/core/testing';

import { ServiciosEventosService } from './servicios-eventos.service';

describe('ServiciosEventosService', () => {
  let service: ServiciosEventosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServiciosEventosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
