import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionBloqueosComponent } from './gestion-bloqueos.component';

describe('GestionBloqueosComponent', () => {
  let component: GestionBloqueosComponent;
  let fixture: ComponentFixture<GestionBloqueosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionBloqueosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionBloqueosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
