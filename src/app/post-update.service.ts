import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PostUpdateService {
  private postCreatedSource = new Subject<void>();
  postCreated$ = this.postCreatedSource.asObservable();

  anouncePostCreated() {
    this.postCreatedSource.next();
  }
  constructor() { }
}
