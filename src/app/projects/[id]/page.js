"use client";

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

const OVERVIEW_FORM_KEYS = new Set([
  'date',
  'title',
  'projectName',
  'projectType',
  'client',
  'reviewingDepartment',
  'contactName',
  'contactTelephone',
  'email',
  'ownerEmail',
  'status',
]);

function formatLabel(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[-_]/g, ' ')
    .replace(/^./, (char) => char.toUpperCase())
    .trim();
}

function formatValue(value) {
  if (value === null || value === undefined || value === '') {
    return 'Not provided';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

function slugify(value = '') {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export default function ProjectDetailsPage() {
  const params = useParams();
  const projectId = params?.id;
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!projectId) {
      setError('Project id is missing in the URL');
      setLoading(false);
      return;
    }

    const loadProject = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}`, { cache: 'no-store' });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          setError(payload.error || 'Failed to load project details');
          return;
        }

        const data = await response.json();
        setProject(data);
      } catch (err) {
        setError('Error loading project details');
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [projectId]);

  const { generalRows, reviewingDepartmentRows } = useMemo(() => {
    if (!project?.formData) {
      return { generalRows: [], reviewingDepartmentRows: [] };
    }

    const selectedDepartmentSlug = slugify(project.reviewingDepartment || '');
    const departmentPrefix = selectedDepartmentSlug
      ? `deptReview_${selectedDepartmentSlug}_`
      : '';

    const filteredEntries = Object.entries(project.formData)
      .filter(([key]) => !OVERVIEW_FORM_KEYS.has(key))
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => ({ key, value }));

    const reviewingDepartmentRows = filteredEntries
      .filter(({ key }) => departmentPrefix && key.startsWith(departmentPrefix))
      .map(({ key, value }) => ({
        label: formatLabel(key.slice(departmentPrefix.length)),
        value: formatValue(value),
      }));

    const generalRows = filteredEntries
      .filter(({ key }) => !key.startsWith('deptReview_'))
      .map(({ key, value }) => ({
        label: formatLabel(key),
        value: formatValue(value),
      }));

    return { generalRows, reviewingDepartmentRows };
  }, [project]);

  const contactDisplay = useMemo(() => {
    const title = project?.formData?.title ? String(project.formData.title).trim() : '';
    const name = project?.contactName ? String(project.contactName).trim() : '';

    return [title, name].filter(Boolean).join(' ') || 'Not specified';
  }, [project]);

  if (loading) {
    return <div className="p-6">Loading project details...</div>;
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-600 mb-4">{error}</p>
        <Link href="/projects" className="text-blue-600 hover:underline">
          Back to All Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Project Summary</h1>
        <Link href="/projects" className="text-blue-600 hover:underline">
          Back to All Projects
        </Link>
      </div>

      <section className="border rounded-lg p-4 bg-white shadow-sm">
        <h2 className="text-lg font-semibold mb-3">Overview</h2>
        <div className="grid md:grid-cols-2 gap-3 text-sm">
          <p><span className="font-semibold">Date:</span> {project.date || 'Not specified'}</p>
          <p><span className="font-semibold">Project Name:</span> {project.projectName}</p>
          <p><span className="font-semibold">Project Type:</span> {project.projectType}</p>
          <p><span className="font-semibold">Client:</span> {project.client}</p>
          <p><span className="font-semibold">Reviewing Department:</span> {project.reviewingDepartment}</p>
          <p><span className="font-semibold">Contact:</span> {contactDisplay}</p>
          <p><span className="font-semibold">Contact Telephone:</span> {project.contactTelephone}</p>
          <p><span className="font-semibold">Owner Email:</span> {project.email}</p>
          <p><span className="font-semibold">Status:</span> {project.status}</p>
        </div>
      </section>

      <section className="border rounded-lg p-4 bg-white shadow-sm">
        <h2 className="text-lg font-semibold mb-3">Form Data Summary</h2>
        {generalRows.length === 0 && reviewingDepartmentRows.length === 0 ? (
          <p className="text-sm text-gray-600">No additional form fields were captured for this project.</p>
        ) : (
          <div className="space-y-6">
            {generalRows.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="text-left border-b p-2">Field</th>
                      <th className="text-left border-b p-2">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {generalRows.map((row, index) => (
                      <tr key={`${row.label}-${index}`}>
                        <td className="align-top border-b p-2 text-sm font-medium">{row.label}</td>
                        <td className="align-top border-b p-2 text-sm text-gray-700 break-words">{row.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {reviewingDepartmentRows.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-base font-semibold">
                  Reviewing Department: {project.reviewingDepartment || 'Not selected'}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="text-left border-b p-2">Field</th>
                        <th className="text-left border-b p-2">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reviewingDepartmentRows.map((row, index) => (
                        <tr key={`${row.label}-${index}`}>
                          <td className="align-top border-b p-2 text-sm font-medium">{row.label}</td>
                          <td className="align-top border-b p-2 text-sm text-gray-700 break-words">{row.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
