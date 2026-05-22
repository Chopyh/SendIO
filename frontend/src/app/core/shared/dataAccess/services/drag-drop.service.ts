import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

interface DragItem {
  id: string;
  section: string;
}

@Injectable({
  providedIn: 'root',
})
export class DragDropService {
  private _idList: BehaviorSubject<DragItem[]> = new BehaviorSubject<DragItem[]>([]);
  $idList = this._idList.asObservable();

  private sectionById = new Map<string, string>();

  private isDragging: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  $isDragging = this.isDragging.asObservable();

  constructor() {}

  public genUUID(): string {
    return crypto.randomUUID();
  }

  public registerID(id: string, section: string): void {
    this.sectionById.set(id, section);
    this.emitIdList();
  }

  public registerIDs(ids: string[], section: string): void {
    ids.forEach((id) => this.sectionById.set(id, section));
    this.emitIdList();
  }

  startDragging(): void {
    this.isDragging.next(true);
  }

  finishDragging(): void {
    this.isDragging.next(false);
  }

  public unregisterID(id: string): void {
    this.sectionById.delete(id);
    this.emitIdList();
  }

  public getSection(id: string): string | null {
    return this.sectionById.get(id) ?? null;
  }

  public clearSection(section: string): void {
    for (const [id, currentSection] of this.sectionById.entries()) {
      if (currentSection === section) {
        this.sectionById.delete(id);
      }
    }

    this.emitIdList();
  }

  private emitIdList(): void {
    this._idList.next(
      Array.from(this.sectionById.entries()).map(([id, section]) => ({ id, section }))
    );
  }
}
