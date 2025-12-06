/**
 * Supabase Diagnostics Tool
 * Helps diagnose setup issues with central Supabase
 */

import { notificationService } from './notificationService';
import { authService } from './authService';

export class SupabaseDiagnostics {
  /**
   * Run all diagnostic checks
   */
  static async runDiagnostics(): Promise<void> {
    console.log('🔍 Running Supabase Diagnostics...\n');
    
    const results = {
      envConfig: await this.checkEnvConfig(),
      connection: await this.checkConnection(),
      authentication: await this.checkAuthentication(),
      tableExists: await this.checkTableExists(),
      rlsPolicies: await this.checkRLSPolicies()
    };

    console.log('\n📊 Diagnostic Results:');
    console.log('Environment Config:', results.envConfig ? '✅' : '❌');
    console.log('Connection:', results.connection ? '✅' : '❌');
    console.log('Authentication:', results.authentication ? '✅' : '❌');
    console.log('Table Exists:', results.tableExists ? '✅' : '❌');
    console.log('RLS Policies:', results.rlsPolicies ? '✅' : '❌');

    const allPassed = Object.values(results).every(r => r);
    
    if (allPassed) {
      notificationService.success('✅ All diagnostics passed!');
    } else {
      notificationService.error('❌ Some diagnostics failed. Check console for details.');
    }

    return;
  }

  /**
   * Check if environment variables are configured
   */
  private static async checkEnvConfig(): Promise<boolean> {
    console.log('\n1️⃣ Checking Environment Configuration...');
    
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!url) {
      console.error('❌ VITE_SUPABASE_URL is not set in .env');
      return false;
    }

    if (!key) {
      console.error('❌ VITE_SUPABASE_ANON_KEY is not set in .env');
      return false;
    }

    console.log('✅ Environment variables configured');
    console.log('   URL:', url);
    console.log('   Key:', key.substring(0, 20) + '...');
    
    return true;
  }

  /**
   * Check if we can connect to Supabase
   */
  private static async checkConnection(): Promise<boolean> {
    console.log('\n2️⃣ Checking Connection to Supabase...');
    
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!url || !key) {
      console.error('❌ Cannot test connection: env vars not set');
      return false;
    }

    try {
      const response = await fetch(`${url}/rest/v1/`, {
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`
        }
      });

      if (response.ok || response.status === 404) {
        console.log('✅ Successfully connected to Supabase');
        return true;
      } else {
        console.error('❌ Connection failed:', response.status, response.statusText);
        return false;
      }
    } catch (error: any) {
      console.error('❌ Connection error:', error.message);
      return false;
    }
  }

  /**
   * Check if user is authenticated
   */
  private static async checkAuthentication(): Promise<boolean> {
    console.log('\n3️⃣ Checking Authentication...');
    
    const user = authService.getCurrentUser();

    if (!user) {
      console.error('❌ User is not signed in');
      console.log('   Please sign in with Firebase first');
      return false;
    }

    console.log('✅ User is authenticated');
    console.log('   User ID:', user.uid);
    console.log('   Email:', user.email);
    
    return true;
  }

  /**
   * Check if supabase_projects table exists
   */
  private static async checkTableExists(): Promise<boolean> {
    console.log('\n4️⃣ Checking if supabase_projects table exists...');
    
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!url || !key) {
      console.error('❌ Cannot check table: env vars not set');
      return false;
    }

    try {
      const response = await fetch(`${url}/rest/v1/supabase_projects?limit=0`, {
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        console.log('✅ Table supabase_projects exists');
        return true;
      } else if (response.status === 404) {
        console.error('❌ Table supabase_projects does not exist');
        console.log('   Please run the SQL schema from docs/SUPABASE_CENTRAL_SCHEMA.sql');
        console.log('   in your Supabase SQL Editor');
        return false;
      } else {
        const errorText = await response.text();
        console.error('❌ Error checking table:', response.status, errorText);
        return false;
      }
    } catch (error: any) {
      console.error('❌ Error checking table:', error.message);
      return false;
    }
  }

  /**
   * Check if RLS policies are working
   */
  private static async checkRLSPolicies(): Promise<boolean> {
    console.log('\n5️⃣ Checking Row Level Security policies...');
    
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const user = authService.getCurrentUser();

    if (!url || !key) {
      console.error('❌ Cannot check RLS: env vars not set');
      return false;
    }

    if (!user) {
      console.error('❌ Cannot check RLS: user not authenticated');
      return false;
    }

    try {
      // Try to query the table
      const response = await fetch(`${url}/rest/v1/supabase_projects?limit=1`, {
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        console.log('✅ RLS policies are configured (query succeeded)');
        return true;
      } else if (response.status === 401 || response.status === 403) {
        console.error('❌ RLS policies may be too restrictive or not configured');
        console.log('   Make sure RLS policies allow access for authenticated users');
        console.log('   Check docs/SUPABASE_CENTRAL_SCHEMA.sql for correct policies');
        return false;
      } else {
        const errorText = await response.text();
        console.warn('⚠️  Unexpected response:', response.status, errorText);
        return false;
      }
    } catch (error: any) {
      console.error('❌ Error checking RLS:', error.message);
      return false;
    }
  }

  /**
   * Test insert operation
   */
  static async testInsert(): Promise<boolean> {
    console.log('\n🧪 Testing Insert Operation...');
    
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const user = authService.getCurrentUser();

    if (!url || !key || !user) {
      console.error('❌ Cannot test insert: missing requirements');
      return false;
    }

    const testData = {
      user_id: user.uid,
      name: `Test Project ${Date.now()}`,
      description: 'Test project for diagnostics',
      project_url: 'https://test.supabase.co',
      anon_key: 'test_key',
      is_active: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      console.log('Attempting to insert test data...');
      
      const response = await fetch(`${url}/rest/v1/supabase_projects`, {
        method: 'POST',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(testData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Insert test successful!');
        console.log('   Inserted record:', result);
        
        // Clean up test data
        if (result && result[0]?.id) {
          await this.deleteTestRecord(result[0].id);
        }
        
        notificationService.success('Insert test passed!');
        return true;
      } else {
        const errorText = await response.text();
        console.error('❌ Insert test failed:', response.status);
        console.error('   Error:', errorText);
        
        try {
          const errorJson = JSON.parse(errorText);
          console.error('   Details:', errorJson);
        } catch {}
        
        notificationService.error('Insert test failed. Check console for details.');
        return false;
      }
    } catch (error: any) {
      console.error('❌ Insert test error:', error.message);
      notificationService.error(`Insert test error: ${error.message}`);
      return false;
    }
  }

  /**
   * Delete test record
   */
  private static async deleteTestRecord(id: string): Promise<void> {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!url || !key) return;

    try {
      await fetch(`${url}/rest/v1/supabase_projects?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`
        }
      });
      console.log('   Test record cleaned up');
    } catch (error) {
      console.warn('   Could not clean up test record');
    }
  }
}

// Export convenience function
export const runSupabaseDiagnostics = () => SupabaseDiagnostics.runDiagnostics();
export const testSupabaseInsert = () => SupabaseDiagnostics.testInsert();
