"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingProjectId, setDeletingProjectId] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/tec/api/projects');
        if (response.ok) {
          const data = await response.json();
          setProjects(data);
        } else {
          console.error('Failed to fetch projects');
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const handleDeleteProject = async (project) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${project.name}"? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setDeletingProjectId(project.id);

    try {
      const response = await fetch(`/tec/api/projects/${project.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete project');
      }

      setProjects((currentProjects) =>
        currentProjects.filter((currentProject) => currentProject.id !== project.id)
      );
    } catch (error) {
      window.alert(error.message);
    } finally {
      setDeletingProjectId(null);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">All Projects</h1>
      {projects.length === 0 ? (
        <p>No projects found.</p>
      ) : (
        <ul className="space-y-4">
          {projects.map((project) => (
            <li key={project.id}>
              <div className="flex items-start justify-between gap-4 rounded border p-4 shadow transition hover:border-blue-300 hover:shadow-md">
                <Link href={`/projects/${project.id}`} className="min-w-0 flex-1">
                  <h2 className="text-xl font-semibold">{project.name}</h2>
                  <p className="text-gray-600">{project.description}</p>
                  <p className="text-sm text-gray-500">Created on: {new Date(project.createdAt).toLocaleDateString()}</p>
                  <p className="mt-2 text-sm text-blue-600">View project summary</p>
                </Link>
                <button
                  type="button"
                  onClick={() => handleDeleteProject(project)}
                  disabled={deletingProjectId === project.id}
                  className="shrink-0 rounded border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deletingProjectId === project.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}