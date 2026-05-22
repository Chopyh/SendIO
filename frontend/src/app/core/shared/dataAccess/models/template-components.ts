export interface TemplateComponents {
  blockId: number;
  blockName: string;
  type: 'text' | 'image' | 'button' | 'separator';
  content?: string; // Text content for text component and button component and alt text for image component
  url?: string; // URL for image or button redirect

  posX?: number;
  posY?: number;
  sizeX?: number; // Optional size for the component

  sectionName?: string; // Property to identify the section
  styles?: { [key: string]: string }; // Optional styles for the component
}

export interface Section {
  sectionName: string;
  components: TemplateComponents[];

  styles?: { [key: string]: string }; // Optional styles for the section
}

export interface TemplateVersion {
  id?: string;
  template_id?: string;
  version_number: number;
  state: 'draft' | 'published';
  snapshot_json?: { sections: Section[] };
  compliance_unsubscribe_url?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  workspace_id?: number;
  created_at?: string;
  updated_at?: string;
  createdAt?: Date;
  updatedAt?: Date;
  versions?: TemplateVersion[];
  sections: Section[];
}

