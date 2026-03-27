import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { fetchUserProjects } from "@/lib/api";

export const useProjectStore = create(
  persist(
    (set, get) => ({
      projects: [],
      currentProject: null,
      editorCache: {}, // { [projectId]: content }
      loading: false,
      error: null,

      fetchProjects: async (userId) => {
        if (!userId) return;
        set({ loading: true });
        try {
          const { projects } = await fetchUserProjects(userId);
          set({ projects, loading: false });
        } catch (err) {
          set({ error: err.message, loading: false });
        }
      },

      setCurrentProject: (project) => set({ currentProject: project }),

      deleteProject: async (projectId) => {
        try {
          const { deleteProject: apiDeleteProject } = await import("@/lib/api");
          await apiDeleteProject(projectId);
          set((state) => ({
            projects: state.projects.filter((p) => p.id !== projectId),
            currentProject:
              state.currentProject?.id === projectId
                ? null
                : state.currentProject,
          }));
          // Also clear from cache
          get().clearCache(projectId);
        } catch (err) {
          set({ error: err.message });
          throw err;
        }
      },

      updateEditorCache: (projectId, content) => {
        set((state) => ({
          editorCache: {
            ...state.editorCache,
            [projectId]: content,
          },
        }));
      },

      getEditorCache: (projectId) => {
        return get().editorCache[projectId] || null;
      },

      clearCache: (projectId) => {
        set((state) => {
          const newCache = { ...state.editorCache };
          delete newCache[projectId];
          return { editorCache: newCache };
        });
      },
    }),
    {
      name: "story-brain-projects",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ editorCache: state.editorCache }), // Only persist editorCache to localStorage
    },
  ),
);
