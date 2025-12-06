/**
 * Supabase Metadata Service
 * Fetches tables, storage buckets, and other metadata from Supabase projects
 */

export interface SupabaseMetadata {
  tables: TableInfo[];
  buckets: BucketInfo[];
  functions: FunctionInfo[];
}

export interface TableInfo {
  name: string;
  schema: string;
  columns?: ColumnInfo[];
  rowCount?: number;
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
}

export interface BucketInfo {
  id: string;
  name: string;
  public: boolean;
  created_at: string;
  updated_at: string;
  file_size_limit?: number;
  allowed_mime_types?: string[];
}

export interface FunctionInfo {
  name: string;
  schema: string;
}

class SupabaseMetadataService {
  /**
   * Fetch all metadata from a Supabase project
   */
  async fetchMetadata(url: string, anonKey: string): Promise<SupabaseMetadata> {
    const [tables, buckets, functions] = await Promise.all([
      this.fetchTables(url, anonKey),
      this.fetchBuckets(url, anonKey),
      this.fetchFunctions(url, anonKey)
    ]);

    return { tables, buckets, functions };
  }

  /**
   * Fetch all tables from the database
   */
  async fetchTables(url: string, anonKey: string): Promise<TableInfo[]> {
    try {
      // Method 1: Try to get tables from OpenAPI spec
      const response = await fetch(`${url}/rest/v1/`, {
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const spec = await response.json();
        
        if (spec.definitions) {
          // Parse OpenAPI definitions to get table names
          const tables = Object.keys(spec.definitions)
            .filter(name => !name.startsWith('_'))
            .map(name => ({
              name,
              schema: 'public'
            }));
          
          return tables;
        }
      }

      // Method 2: Try to query information_schema (may fail due to RLS)
      const tablesResponse = await fetch(
        `${url}/rest/v1/rpc/get_tables`,
        {
          method: 'POST',
          headers: {
            'apikey': anonKey,
            'Authorization': `Bearer ${anonKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (tablesResponse.ok) {
        return await tablesResponse.json();
      }

      return [];
    } catch (error) {
      console.error('Error fetching tables:', error);
      return [];
    }
  }

  /**
   * Fetch table columns
   */
  async fetchTableColumns(url: string, anonKey: string, tableName: string): Promise<ColumnInfo[]> {
    try {
      // Query the table with limit 0 to get column info
      const response = await fetch(`${url}/rest/v1/${tableName}?limit=0`, {
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Prefer': 'return=representation'
        }
      });

      if (response.ok) {
        // Parse response headers to get column info
        // This is a simplified approach - full implementation would parse the response
        return [];
      }

      return [];
    } catch (error) {
      console.error(`Error fetching columns for ${tableName}:`, error);
      return [];
    }
  }

  /**
   * Fetch storage buckets
   */
  async fetchBuckets(url: string, anonKey: string): Promise<BucketInfo[]> {
    try {
      const response = await fetch(`${url}/storage/v1/bucket`, {
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`
        }
      });

      if (response.ok) {
        const buckets = await response.json();
        return buckets.map((bucket: any) => ({
          id: bucket.id,
          name: bucket.name,
          public: bucket.public || false,
          created_at: bucket.created_at,
          updated_at: bucket.updated_at,
          file_size_limit: bucket.file_size_limit,
          allowed_mime_types: bucket.allowed_mime_types
        }));
      }

      return [];
    } catch (error) {
      console.error('Error fetching buckets:', error);
      return [];
    }
  }

  /**
   * Fetch database functions
   */
  async fetchFunctions(url: string, anonKey: string): Promise<FunctionInfo[]> {
    try {
      // Try to get functions from RPC endpoint
      const response = await fetch(`${url}/rest/v1/rpc`, {
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`
        }
      });

      if (response.ok) {
        // Parse available RPC functions
        // This is a simplified approach
        return [];
      }

      return [];
    } catch (error) {
      console.error('Error fetching functions:', error);
      return [];
    }
  }

  /**
   * Get row count for a table
   */
  async getTableRowCount(url: string, anonKey: string, tableName: string): Promise<number> {
    try {
      const response = await fetch(`${url}/rest/v1/${tableName}?select=count`, {
        method: 'HEAD',
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Prefer': 'count=exact'
        }
      });

      if (response.ok) {
        const contentRange = response.headers.get('Content-Range');
        if (contentRange) {
          const match = contentRange.match(/\/(\d+)$/);
          if (match) {
            return parseInt(match[1], 10);
          }
        }
      }

      return 0;
    } catch (error) {
      console.error(`Error getting row count for ${tableName}:`, error);
      return 0;
    }
  }

  /**
   * Test connection to Supabase project
   */
  async testConnection(url: string, anonKey: string): Promise<boolean> {
    try {
      const response = await fetch(`${url}/rest/v1/`, {
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`
        }
      });

      return response.ok || response.status === 404;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get project info
   */
  async getProjectInfo(url: string, anonKey: string): Promise<any> {
    const metadata = await this.fetchMetadata(url, anonKey);
    
    return {
      url,
      tables: metadata.tables.length,
      buckets: metadata.buckets.length,
      functions: metadata.functions.length,
      connected: await this.testConnection(url, anonKey)
    };
  }
}

export const supabaseMetadataService = new SupabaseMetadataService();
