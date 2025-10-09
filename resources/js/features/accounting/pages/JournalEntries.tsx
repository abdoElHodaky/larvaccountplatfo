/**
 * Journal Entries Page
 * Main page for managing journal entries
 */

import React from 'react';
import { JournalEntries } from '../components/organisms/JournalEntries';

export const JournalEntriesPage: React.FC = () => {
  const handleEntryClick = (entry: any) => {
    console.log('Entry clicked:', entry);
  };

  const handleEdit = (entry: any) => {
    console.log('Edit entry:', entry);
  };

  const handleDelete = (entryId: string) => {
    console.log('Delete entry:', entryId);
  };

  return (
    <div className="journal-entries-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Journal Entries</h1>
              <p className="mt-2 text-gray-600">
                View and manage your accounting journal entries
              </p>
            </div>
          </div>
        </div>

        {/* Journal Entries Component */}
        <JournalEntries
          onEntryClick={handleEntryClick}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
};

export default JournalEntriesPage;
