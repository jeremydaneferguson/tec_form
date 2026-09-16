"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Building2,
  Calendar,
  Clock3,
  Edit2,
  Eye,
  ShieldCheck,
  Trash2,
  User,
} from 'lucide-react';

function formatDate(value) {
  if (!value) {
    return 'Not specified';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function titleCase(value = '') {
  return String(value)
    .replace(/[-_]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`)
    .join(' ');
}

function getStatusClasses(status = '') {
  const normalized = status.toLowerCase();

  if (normalized === 'submitted') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }

  if (normalized === 'reviewed') {
    return 'border-blue-200 bg-blue-50 text-blue-700';
  }

  return 'border-amber-200 bg-amber-50 text-amber-700';
}

function ProjectMeta({ icon: Icon, label, value }) {
  return (
    <div className="flex min-w-0 items-start gap-2 rounded-xl border border-[#e3ded7] bg-[#fbfaf8] px-3 py-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#991b1e]" />
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7a8498]">
          {label}
        </p>
        <p className="truncate text-sm font-semibold text-[#1f2a44]">{value}</p>
      </div>
    </div>
  );
}

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
    return <div className="p-6 text-sm text-[#6a7388]">Loading projects...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <header className="rounded-2xl border border-[#d9d5cd] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#991b1e]">
              TEC Portfolio
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#1f2a44]">
              All Projects
            </h1>
            <p className="mt-1 text-sm text-[#6a7388]">
              Review submitted TEC forms, reopen records for edits, and track recent updates.
            </p>
          </div>
          <span className="inline-flex w-fit rounded-full border border-[#d6d2ca] bg-[#f9f8f6] px-3 py-1 text-xs font-semibold text-[#546077]">
            {projects.length} project{projects.length === 1 ? '' : 's'}
          </span>
        </div>
      </header>

      {projects.length === 0 ? (
        <div className="rounded-2xl border border-[#d9d5cd] bg-white p-8 text-center text-sm text-[#6a7388] shadow-sm">
          No projects found.
        </div>
      ) : (
        <ul className="space-y-4">
          {projects.map((project) => (
            <li key={project.id}>
              <div className="rounded-2xl border border-[#d9d5cd] bg-white p-5 shadow-sm transition hover:border-[#c8bfb2] hover:shadow-md">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <Link href={`/projects/${project.id}`} className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-bold text-[#1f2a44]">{project.name}</h2>
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(project.status)}`}>
                        {titleCase(project.status)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[#6a7388]">
                      {project.projectType} request for {project.client}
                    </p>
                    <span className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#991b1e]">
                      <Eye className="h-4 w-4" />
                      View project summary
                    </span>
                  </Link>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Link
                      href={`/?editSubmissionId=${project.id}`}
                      className="inline-flex items-center gap-2 rounded-xl border border-[#d6d2ca] bg-white px-3 py-2 text-sm font-semibold text-[#2d3750] transition hover:border-[#991b1e] hover:text-[#991b1e]"
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit form
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDeleteProject(project)}
                      disabled={deletingProjectId === project.id}
                      className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      {deletingProjectId === project.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  <ProjectMeta
                    icon={Building2}
                    label="Department"
                    value={project.reviewingDepartment}
                  />
                  <ProjectMeta icon={User} label="Contact" value={project.contactName} />
                  <ProjectMeta icon={ShieldCheck} label="Client" value={project.client} />
                  <ProjectMeta
                    icon={Calendar}
                    label="Created on"
                    value={formatDate(project.createdAt)}
                  />
                  <ProjectMeta
                    icon={Clock3}
                    label="Updated on"
                    value={formatDate(project.updatedAt)}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
