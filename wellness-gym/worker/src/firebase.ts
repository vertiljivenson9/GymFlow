interface FirebaseConfig {
  projectId: string;
  apiKey?: string;
}

interface FirestoreDocument<T> {
  name: string;
  fields: Record<string, { stringValue?: string; integerValue?: string; booleanValue?: boolean }>;
  createTime: string;
  updateTime: string;
}

function parseDocument<T extends Record<string, unknown>>(doc: FirestoreDocument<T>): T & { id: string } {
  const id = doc.name.split('/').pop() || '';
  const fields: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(doc.fields)) {
    if (value.stringValue !== undefined) {
      fields[key] = value.stringValue;
    } else if (value.integerValue !== undefined) {
      fields[key] = parseInt(value.integerValue, 10);
    } else if (value.booleanValue !== undefined) {
      fields[key] = value.booleanValue;
    }
  }
  
  return { id, ...fields } as T & { id: string };
}

export class FirebaseClient {
  private projectId: string;
  private baseUrl: string;

  constructor(config: FirebaseConfig) {
    this.projectId = config.projectId;
    this.baseUrl = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents`;
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Firebase error: ${error}`);
    }

    return response.json();
  }

  async getCollection<T extends Record<string, unknown>>(collection: string): Promise<Array<T & { id: string }>> {
    const response = await this.request<{ documents?: FirestoreDocument<T>[] }>(`/${collection}`);
    
    if (!response.documents) {
      return [];
    }

    return response.documents.map(doc => parseDocument<T>(doc));
  }

  async getDocument<T extends Record<string, unknown>>(collection: string, id: string): Promise<(T & { id: string }) | null> {
    try {
      const response = await this.request<FirestoreDocument<T>>(`/${collection}/${id}`);
      return parseDocument<T>(response);
    } catch {
      return null;
    }
  }

  async createDocument<T extends Record<string, unknown>>(
    collection: string, 
    data: T, 
    id?: string
  ): Promise<string> {
    const fields: Record<string, { stringValue?: string; integerValue?: string; booleanValue?: boolean }> = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        fields[key] = { stringValue: value };
      } else if (typeof value === 'number') {
        fields[key] = { integerValue: String(value) };
      } else if (typeof value === 'boolean') {
        fields[key] = { booleanValue: value };
      }
    }

    const path = id ? `/${collection}?documentId=${id}` : `/${collection}`;
    const response = await this.request<{ name: string }>(path, {
      method: 'POST',
      body: JSON.stringify({ fields }),
    });

    return response.name.split('/').pop() || '';
  }

  async updateDocument<T extends Record<string, unknown>>(
    collection: string, 
    id: string, 
    data: Partial<T>
  ): Promise<void> {
    const fields: Record<string, { stringValue?: string; integerValue?: string; booleanValue?: boolean }> = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        fields[key] = { stringValue: value };
      } else if (typeof value === 'number') {
        fields[key] = { integerValue: String(value) };
      } else if (typeof value === 'boolean') {
        fields[key] = { booleanValue: value };
      }
    }

    await this.request(`/${collection}/${id}?updateMask.fieldPaths=${Object.keys(fields).join('&updateMask.fieldPaths=')}`, {
      method: 'PATCH',
      body: JSON.stringify({ fields }),
    });
  }

  async queryCollection<T extends Record<string, unknown>>(
    collection: string,
    field: string,
    operator: string,
    value: string
  ): Promise<Array<T & { id: string }>> {
    const query = {
      structuredQuery: {
        from: [{ collectionId: collection }],
        where: {
          fieldFilter: {
            field: { fieldPath: field },
            op: operator.toUpperCase(),
            value: { stringValue: value },
          },
        },
      },
    };

    const response = await this.request<{ document?: FirestoreDocument<T>[] }>(
      `:runQuery`,
      {
        method: 'POST',
        body: JSON.stringify(query),
      }
    );

    if (!response.document) {
      return [];
    }

    return response.document.map(doc => parseDocument<T>(doc));
  }
}
