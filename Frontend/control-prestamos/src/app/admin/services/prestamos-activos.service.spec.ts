import { TestBed } from '@angular/core/testing';

import { PrestamosActivosService } from './prestamos-activos.service';

describe('PrestamosActivosService', () => {
  let service: PrestamosActivosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PrestamosActivosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
