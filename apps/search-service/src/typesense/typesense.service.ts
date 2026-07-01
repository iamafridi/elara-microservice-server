import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Typesense from 'typesense';

export interface TypesenseSearchParams {
  q: string;
  query_by: string;
  filter_by?: string;
  sort_by?: string;
  per_page?: number;
  page?: number;
  facet_by?: string;
  max_facet_values?: number;
}

@Injectable()
export class TypesenseService implements OnModuleInit {
  private readonly logger = new Logger(TypesenseService.name);
  private client: any;

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('TYPESENSE_HOST', 'localhost');
    const port = this.configService.get<number>('TYPESENSE_PORT', 8108);
    const apiKey = this.configService.get<string>('TYPESENSE_API_KEY', 'dev_typesense_key');

    this.client = new Typesense.Client({
      nodes: [
        {
          host,
          port,
          protocol: 'http',
        },
      ],
      apiKey,
      connectionTimeoutSeconds: 10,
    });

    this.logger.log(`Typesense client initialized: ${host}:${port}`);
  }

  async onModuleInit() {
    try {
      const health = await this.client.health.retrieve();
      this.logger.log(`Typesense health check: ${health.ok ? 'OK' : 'FAILED'}`);
    } catch (error) {
      this.logger.error('Typesense health check failed', error.message);
    }
  }

  /**
   * Get Typesense client
   */
  getClient(): any {
    return this.client;
  }

  /**
   * Create or update collection schema
   */
  async createOrUpdateCollection(collectionName: string, schema: any) {
    try {
      // Try to get existing collection
      await this.client.collections(collectionName).retrieve();
      this.logger.log(`Collection '${collectionName}' already exists`);
      return { exists: true };
    } catch (error) {
      // Collection doesn't exist, create it
      try {
        const collection = await this.client.collections().create(schema);
        this.logger.log(`Created collection '${collectionName}'`);
        return { created: true, collection };
      } catch (createError) {
        this.logger.error(`Failed to create collection '${collectionName}'`, createError.message);
        throw createError;
      }
    }
  }

  /**
   * Index a document
   */
  async indexDocument(collectionName: string, document: any) {
    try {
      const result = await this.client
        .collections(collectionName)
        .documents()
        .upsert(document);

      this.logger.log(`Indexed document in '${collectionName}': ${document.id}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to index document in '${collectionName}'`, error.message);
      throw error;
    }
  }

  /**
   * Index multiple documents
   */
  async indexDocuments(collectionName: string, documents: any[]) {
    try {
      const result = await this.client
        .collections(collectionName)
        .documents()
        .import(documents, { action: 'upsert' });

      this.logger.log(`Indexed ${documents.length} documents in '${collectionName}'`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to index documents in '${collectionName}'`, error.message);
      throw error;
    }
  }

  /**
   * Search documents
   */
  async search(collectionName: string, searchParams: TypesenseSearchParams) {
    try {
      const result = await this.client
        .collections(collectionName)
        .documents()
        .search(searchParams as any);

      return result;
    } catch (error) {
      this.logger.error(`Search failed in '${collectionName}'`, error.message);
      throw error;
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(collectionName: string, documentId: string) {
    try {
      await this.client
        .collections(collectionName)
        .documents(documentId)
        .delete();

      this.logger.log(`Deleted document from '${collectionName}': ${documentId}`);
    } catch (error) {
      this.logger.error(`Failed to delete document from '${collectionName}'`, error.message);
      throw error;
    }
  }

  /**
   * Delete collection
   */
  async deleteCollection(collectionName: string) {
    try {
      await this.client.collections(collectionName).delete();
      this.logger.log(`Deleted collection '${collectionName}'`);
    } catch (error) {
      this.logger.error(`Failed to delete collection '${collectionName}'`, error.message);
      throw error;
    }
  }

  /**
   * Get collection stats
   */
  async getCollectionStats(collectionName: string) {
    try {
      const collection = await this.client.collections(collectionName).retrieve();
      return {
        name: collection.name,
        numDocuments: collection.num_documents,
        fields: collection.fields,
      };
    } catch (error) {
      this.logger.error(`Failed to get stats for '${collectionName}'`, error.message);
      throw error;
    }
  }
}
