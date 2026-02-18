/**
 * Database Schema Verification Script
 * 
 * This script connects to the Neon database and verifies that all tables
 * and columns exist as expected after the migration.
 */

import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
dotenv.config({ path: resolve(__dirname, '../.env.local') });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const sql = neon(process.env.DATABASE_URL);

async function verifySchema() {
  console.log('🔍 Verifying Neon Database Schema...\n');

  try {
    // Query to get all tables and their columns
    const result = await sql`
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position;
    `;

    // Group columns by table
    const tables: Record<string, any[]> = {};
    for (const row of result) {
      if (!tables[row.table_name]) {
        tables[row.table_name] = [];
      }
      tables[row.table_name].push(row);
    }

    // Display results
    console.log('📊 Database Tables and Columns:\n');
    
    for (const [tableName, columns] of Object.entries(tables)) {
      console.log(`\n✅ Table: ${tableName} (${columns.length} columns)`);
      console.log('─'.repeat(80));
      
      for (const col of columns) {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        console.log(`  • ${col.column_name.padEnd(30)} ${col.data_type.padEnd(20)} ${nullable}${defaultVal}`);
      }
    }

    // Verify expected tables exist
    console.log('\n\n🎯 Verification Summary:\n');
    
    const expectedTables = ['events', 'organizations', 'volunteers', 'registrations'];
    const actualTables = Object.keys(tables);
    
    for (const expectedTable of expectedTables) {
      if (actualTables.includes(expectedTable)) {
        console.log(`✅ ${expectedTable} table exists (${tables[expectedTable].length} columns)`);
      } else {
        console.log(`❌ ${expectedTable} table MISSING`);
      }
    }

    // Check for critical columns
    console.log('\n🔑 Critical Columns Check:\n');
    
    const criticalChecks = [
      { table: 'events', column: 'modified_at', description: 'Events modified timestamp' },
      { table: 'organizations', column: 'event_id', description: 'Organizations event foreign key' },
      { table: 'organizations', column: 'is_disability_group', description: 'Organizations disability flag' },
      { table: 'volunteers', column: 'id', description: 'Volunteers table exists' },
      { table: 'registrations', column: 'group_leader_participating', description: 'Registrations group leader field' },
      { table: 'registrations', column: 'sync_status', description: 'Registrations sync status' },
    ];

    for (const check of criticalChecks) {
      if (tables[check.table]) {
        const hasColumn = tables[check.table].some(col => col.column_name === check.column);
        if (hasColumn) {
          console.log(`✅ ${check.description}`);
        } else {
          console.log(`❌ ${check.description} - MISSING`);
        }
      } else {
        console.log(`❌ ${check.description} - TABLE MISSING`);
      }
    }

    console.log('\n✅ Database schema verification complete!\n');

  } catch (error) {
    console.error('❌ Error verifying database schema:', error);
    process.exit(1);
  }
}

verifySchema();

