import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { EmailTemplate, Section, TemplateComponents, TemplateVersion } from '../models/template-components';

@Injectable({ providedIn: 'root' })
export class TemplateComponentService {
  private readonly emptyTemplate: EmailTemplate = {
    id: '',
    name: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    sections: [],
  };

  private _templateComponents = new BehaviorSubject<EmailTemplate>(this.emptyTemplate);
  templateComponents$ = this._templateComponents.asObservable();

  constructor(private client: HttpClient) {}

  /**
   * Loads the template data for the given template ID from the API.
   * Must be called once after the component initializes with the route param.
   */
  public loadTemplate(id: string): void {
    this.client.get<{ data: any }>(`/api/templates/${id}`).subscribe({
      next: (res) => {
        const apiTemplate = res.data;
        const latestVersion = apiTemplate.versions?.[0];
        
        const template: EmailTemplate = {
          id: apiTemplate.id,
          name: apiTemplate.name,
          workspace_id: apiTemplate.workspace_id,
          createdAt: apiTemplate.created_at ? new Date(apiTemplate.created_at) : new Date(),
          updatedAt: apiTemplate.updated_at ? new Date(apiTemplate.updated_at) : new Date(),
          versions: apiTemplate.versions || [],
          sections: latestVersion?.snapshot_json?.sections || []
        };
        this._templateComponents.next(this.cloneTemplate(template));
      },
      error: () => {
        this._templateComponents.next(this.cloneTemplate(this.emptyTemplate));
      },
    });
  }

  public saveTemplate(id: string, sections: Section[]): Observable<{ data: TemplateVersion }> {
    const currentTemplate = this._templateComponents.getValue();
    const latestVersion = currentTemplate.versions?.[0];
    const versionNumber = latestVersion ? latestVersion.version_number : 1;

    return this.client.put<{ data: TemplateVersion }>(
      `/api/templates/${id}/versions/${versionNumber}`,
      { content: { sections } }
    ).pipe(
      tap((res) => {
        const updatedVersion = res.data;
        const updatedTemplate = { ...currentTemplate };
        if (updatedTemplate.versions && updatedTemplate.versions.length > 0) {
          updatedTemplate.versions[0] = updatedVersion;
        } else {
          updatedTemplate.versions = [updatedVersion];
        }
        updatedTemplate.sections = updatedVersion.snapshot_json?.sections || [];
        this._templateComponents.next(this.cloneTemplate(updatedTemplate));
      })
    );
  }

  public publishTemplate(id: string, versionNumber: number): Observable<{ data: TemplateVersion }> {
    return this.client.post<{ data: TemplateVersion }>(
      `/api/templates/${id}/versions/${versionNumber}/publish`,
      {}
    ).pipe(
      tap((res) => {
        const updatedVersion = res.data;
        const currentTemplate = this._templateComponents.getValue();
        const updatedTemplate = { ...currentTemplate };
        if (updatedTemplate.versions && updatedTemplate.versions.length > 0) {
          const idx = updatedTemplate.versions.findIndex(v => v.version_number === versionNumber);
          if (idx >= 0) {
            updatedTemplate.versions[idx] = updatedVersion;
          }
        }
        this._templateComponents.next(this.cloneTemplate(updatedTemplate));
      })
    );
  }

  public createDraftVersion(id: string): Observable<{ data: TemplateVersion }> {
    return this.client.post<{ data: TemplateVersion }>(
      `/api/templates/${id}/versions`,
      {}
    ).pipe(
      tap((res) => {
        const newVersion = res.data;
        const currentTemplate = this._templateComponents.getValue();
        const updatedTemplate = { ...currentTemplate };
        if (updatedTemplate.versions) {
          updatedTemplate.versions = [newVersion, ...updatedTemplate.versions];
        } else {
          updatedTemplate.versions = [newVersion];
        }
        updatedTemplate.sections = newVersion.snapshot_json?.sections || [];
        this._templateComponents.next(this.cloneTemplate(updatedTemplate));
      })
    );
  }

  public deleteTemplate(id: string): Observable<void> {
    return this.client.delete<void>(`/api/templates/${id}`);
  }

  public createTemplate(name: string): Observable<{ data: any }> {
    return this.client.post<{ data: any }>(`/api/templates`, { name });
  }

  public listTemplates(): Observable<{ data: any[] }> {
    return this.client.get<{ data: any[] }>(`/api/templates`);
  }

  public loadData(): void {
    this._templateComponents.next(this.cloneTemplate(this._templateComponents.getValue()));
  }

  public addComponent(component: TemplateComponents, sectionName: string): void {
    const sectionIndex = this.getSectionIndex(sectionName);
    if (sectionIndex < 0) {
      console.error(`Section "${sectionName}" not found.`);
      return;
    }

    this.updateTemplate((currentTemplate) => {
      currentTemplate.sections[sectionIndex].components.push({ ...component });
      return currentTemplate;
    });
  }

  public updateComponentPosition(
    component: TemplateComponents,
    section: string,
    posX: number,
    posY: number,
    reload: boolean = true
  ): void {
    this.updateTemplate((currentTemplate) => {
      const targetSection = this.findSection(currentTemplate, section);
      if (!targetSection) {
        console.error(`Section "${section}" not found.`);
        return currentTemplate;
      }

      const componentIndex = targetSection.components.findIndex((c) => c.blockId === component.blockId);
      if (componentIndex < 0) {
        targetSection.components.push({ ...component, posX, posY, sectionName: section });
      } else {
        targetSection.components[componentIndex] = {
          ...targetSection.components[componentIndex],
          posX,
          posY,
          sectionName: section,
        };
      }

      return currentTemplate;
    }, reload);
  }

  public moveComponentToSection(
    component: TemplateComponents,
    fromSection: string,
    toSection: string,
    posX: number,
    posY: number
  ): void {
    this.updateTemplate((currentTemplate) => {
      const sourceSection = this.findSection(currentTemplate, fromSection);
      const targetSection = this.findSection(currentTemplate, toSection);

      if (!sourceSection || !targetSection) {
        console.error(`Could not move component ${component.blockId} from "${fromSection}" to "${toSection}".`);
        return currentTemplate;
      }

      const sourceIndex = sourceSection.components.findIndex((c) => c.blockId === component.blockId);
      if (sourceIndex < 0) {
        return currentTemplate;
      }

      const [removedComponent] = sourceSection.components.splice(sourceIndex, 1);
      targetSection.components.push({
        ...removedComponent,
        posX,
        posY,
        sectionName: toSection,
      });

      return currentTemplate;
    });
  }

  public removeComponent(component: TemplateComponents, section?: string): void {
    this.updateTemplate((currentTemplate) => {
      if (section) {
        const targetSection = this.findSection(currentTemplate, section);
        if (targetSection) {
          targetSection.components = targetSection.components.filter((c) => c.blockId !== component.blockId);
        }
        return currentTemplate;
      }

      currentTemplate.sections.forEach((s) => {
        s.components = s.components.filter((c) => c.blockId !== component.blockId);
      });

      return currentTemplate;
    });
  }

  public removeUsedComponent(component: TemplateComponents, section?: string): void {
    this.updateTemplate((currentTemplate) => {
      const clearPosition = (candidate: TemplateComponents): TemplateComponents => {
        if (candidate.blockId !== component.blockId) {
          return candidate;
        }

        return {
          ...candidate,
          posX: undefined,
          posY: undefined,
        };
      };

      if (section) {
        const targetSection = this.findSection(currentTemplate, section);
        if (targetSection) {
          targetSection.components = targetSection.components.map(clearPosition);
        }
        return currentTemplate;
      }

      currentTemplate.sections.forEach((s) => {
        s.components = s.components.map(clearPosition);
      });

      return currentTemplate;
    });
  }

  getLastComponentId(): number {
    return this._templateComponents
      .getValue()
      .sections.flatMap((section) => section.components)
      .reduce((maxId, component) => Math.max(maxId, component.blockId), 0);
  }

  getComponentSection(component: TemplateComponents): string[] {
    return this._templateComponents
      .getValue()
      .sections.filter((section) => section.components.some((c) => c.blockId === component.blockId))
      .map((section) => section.sectionName);
  }

  getSections(): string[] {
    return this._templateComponents.getValue().sections.map((section) => section.sectionName);
  }

  swapSectionPositions(): void {
    this.loadData();
  }

  addSection(sectionName: string | Section): void {
    this.updateTemplate((currentTemplate) => {
      if (typeof sectionName === 'object') {
        currentTemplate.sections.push({ ...sectionName, components: [...sectionName.components] });
        return currentTemplate;
      }

      currentTemplate.sections.push({ sectionName, components: [] });
      return currentTemplate;
    });
  }

  editComponent(component: TemplateComponents): void {
    this.updateTemplate((currentTemplate) => {
      for (const section of currentTemplate.sections) {
        const index = section.components.findIndex((c) => c.blockId === component.blockId);
        if (index >= 0) {
          section.components[index] = { ...component };
          break;
        }
      }

      return currentTemplate;
    });
  }

  public editSection(section: Section): void {
    this.updateTemplate((currentTemplate) => {
      const index = currentTemplate.sections.findIndex((s) => s.sectionName === section.sectionName);
      if (index >= 0) {
        currentTemplate.sections[index] = { ...section, components: [...section.components] };
      }
      return currentTemplate;
    });
  }

  public removeSection(section: Section): void {
    this.updateTemplate((currentTemplate) => {
      currentTemplate.sections = currentTemplate.sections.filter((s) => s.sectionName !== section.sectionName);
      return currentTemplate;
    });
  }

  private updateTemplate(mutator: (template: EmailTemplate) => EmailTemplate, notify: boolean = true): void {
    const draft = this.cloneTemplate(this._templateComponents.getValue());
    const updated = mutator(draft);
    if (notify) {
      this._templateComponents.next(this.cloneTemplate(updated));
    }
  }

  private findSection(template: EmailTemplate, sectionName: string): Section | undefined {
    return template.sections.find(
      (section) => section.sectionName.toLocaleLowerCase() === sectionName.toLocaleLowerCase()
    );
  }

  private getSectionIndex(sectionName: string): number {
    return this._templateComponents
      .getValue()
      .sections.findIndex(
        (section) => section.sectionName.toLocaleLowerCase() === sectionName.toLocaleLowerCase()
      );
  }

  private cloneTemplate(template: EmailTemplate): EmailTemplate {
    return {
      ...template,
      createdAt: template.createdAt ? new Date(template.createdAt) : new Date(),
      updatedAt: template.updatedAt ? new Date(template.updatedAt) : new Date(),
      versions: template.versions ? template.versions.map((v) => ({
        ...v,
        snapshot_json: v.snapshot_json ? {
          sections: v.snapshot_json.sections.map((s) => ({
            ...s,
            components: s.components.map((c) => ({ ...c })),
          })),
        } : undefined,
      })) : [],
      sections: template.sections.map((section) => ({
        ...section,
        components: section.components.map((component) => ({ ...component })),
      })),
    };
  }
}
