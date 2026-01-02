import { Folder, Plus, Edit2, Trash2, ChevronRight } from 'lucide-react';
import { useCollectionStore } from '../store/collectionStore';
import { useState, useEffect } from 'react';
import CreateCollectionModal from './createCollectionModal';
import { useAlertStore } from '../store/alertStore';

export default function CollectionSidebar({
  onSelectCollection,
  currentUserId,
}) {
  const {
    collections,
    fetchCollections,
    activeCollectionId,
    setActiveCollection,
    clearActiveCollection,
    deleteCollection,
  } = useCollectionStore();

  const { showAlert } = useAlertStore();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);

  useEffect(() => {
    if (currentUserId) {
      fetchCollections();
    }
  }, [currentUserId, fetchCollections]);

  const handleSelectAll = () => {
    clearActiveCollection();
    onSelectCollection(null);
  };

  const handleSelectCollection = (collectionId) => {
    setActiveCollection(collectionId);
    onSelectCollection(collectionId);
  };

  const handleEdit = (e, collection) => {
    e.stopPropagation();
    setEditingCollection(collection);
    setIsCreateModalOpen(true);
  };

  const handleDelete = async (e, collection) => {
    e.stopPropagation();

    if (
      !confirm(
        `Hapus collection "${collection.name}"?\n\nSnippet tidak akan terhapus, hanya dihapus dari collection ini.`,
      )
    ) {
      return;
    }

    try {
      await deleteCollection(collection.id);
      showAlert('success', 'Terhapus', 'Collection berhasil dihapus');

      // If deleted collection was active, clear selection
      if (activeCollectionId === collection.id) {
        handleSelectAll();
      }
    } catch (error) {
      showAlert('error', 'Gagal', error.message);
    }
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setEditingCollection(null);
  };

  return (
    <>
      <div className="w-64 bg-white dark:bg-pastel-dark-surface border-r border-gray-200 dark:border-pastel-dark-border flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-pastel-dark-border">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Folder size={18} className="text-indigo-500" />
              Collections
            </h3>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition group"
              title="New Collection"
            >
              <Plus
                size={18}
                className="text-indigo-500 group-hover:scale-110 transition"
              />
            </button>
          </div>

          {/* All Snippets (default view) */}
          <button
            onClick={handleSelectAll}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition ${
              activeCollectionId === null
                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md'
                : 'hover:bg-gray-50 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">📚</span>
              <span className="text-sm font-bold">All Snippets</span>
            </div>
            {activeCollectionId === null && (
              <ChevronRight size={16} className="animate-pulse" />
            )}
          </button>
        </div>

        {/* Collections List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
          {collections.length === 0 ? (
            <div className="text-center py-8 px-4">
              <Folder
                size={32}
                className="mx-auto text-gray-300 dark:text-gray-600 mb-2"
              />
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Belum ada collection
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-3 text-xs text-indigo-500 hover:underline"
              >
                Buat yang pertama
              </button>
            </div>
          ) : (
            collections.map((collection) => (
              <div
                key={collection.id}
                onClick={() => handleSelectCollection(collection.id)}
                onMouseEnter={() => setHoveredId(collection.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`group relative flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition ${
                  activeCollectionId === collection.id
                    ? 'shadow-sm'
                    : 'hover:shadow-sm'
                }`}
                style={{
                  backgroundColor:
                    activeCollectionId === collection.id
                      ? collection.color + '20'
                      : hoveredId === collection.id
                        ? collection.color + '10'
                        : 'transparent',
                  borderLeft:
                    activeCollectionId === collection.id
                      ? `3px solid ${collection.color}`
                      : '3px solid transparent',
                }}
              >
                {/* Icon & Name */}
                <span className="text-xl flex-shrink-0">{collection.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800 dark:text-white truncate">
                    {collection.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {collection.snippet_count} snippet
                    {collection.snippet_count !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Action Buttons (show on hover) */}
                {hoveredId === collection.id && (
                  <div className="flex gap-1 absolute right-2 bg-white dark:bg-pastel-dark-surface pr-1">
                    <button
                      onClick={(e) => handleEdit(e, collection)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded transition"
                      title="Edit"
                    >
                      <Edit2 size={14} className="text-gray-500" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, collection)}
                      className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                      title="Delete"
                    >
                      <Trash2 size={14} className="text-red-500" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer Info */}
        <div className="p-3 border-t border-gray-100 dark:border-pastel-dark-border">
          <p className="text-xs text-gray-400 text-center">
            {collections.length} collection{collections.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Modals */}
      <CreateCollectionModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseModal}
        editCollection={editingCollection}
      />
    </>
  );
}