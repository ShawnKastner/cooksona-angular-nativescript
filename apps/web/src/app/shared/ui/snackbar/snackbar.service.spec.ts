import { TestBed } from '@angular/core/testing';
import { take } from 'rxjs/operators';
import { SnackbarService } from './snackbar.service';

describe('SnackbarService', () => {
  it('emits messages and can clear', (done) => {
    const svc = TestBed.inject(SnackbarService);
    svc.message$.pipe(take(1)).subscribe((msg) => {
      expect(msg?.text).toBe('Hello');
      svc.clear();
      svc.message$.pipe(take(1)).subscribe((m2) => {
        expect(m2).toBeNull();
        done();
      });
    });
    svc.show('Hello', 'info', 1000);
  });
});
