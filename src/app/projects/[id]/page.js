"use client";

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle,
  Edit2,
  Mail,
  Phone,
  User,
} from 'lucide-react';

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

const ASSESSMENT_ORDER = [
  'adequate',
  'requires-improvement',
  'urgently-required',
  'non-existing',
];

const ASSESSMENT_LABELS = {
  adequate: 'Adequate',
  'non-existing': 'Non existing',
  'requires-improvement': 'Requires improvement',
  'urgently-required': 'Urgently required',
};

const ACRONYMS = new Set(['bdo', 'clo', 'cpo', 'cso', 'emd', 'hr', 'mits', 'sla']);

function titleCase(value = '') {
  return String(value)
    .replace(/[-_]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => {
      const normalized = word.toLowerCase();
      if (ACRONYMS.has(normalized)) {
        return normalized.toUpperCase();
      }

      return `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`;
    })
    .join(' ');
}

function formatLabel(key) {
  return titleCase(
    key
      .replace(/([A-Z])/g, ' $1')
      .replace(/[-_]/g, ' ')
      .trim()
  );
}

function normalizeValue(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeValue).join(', ');
  }

  if (value === null || value === undefined || value === '') {
    return 'Not provided';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

function normalizeAssessmentKey(value) {
  return normalizeValue(value).trim().toLowerCase().replace(/\s+/g, '-');
}

function formatValue(value) {
  const text = normalizeValue(value);
  const assessmentLabel = ASSESSMENT_LABELS[normalizeAssessmentKey(text)];

  return assessmentLabel || titleCase(text);
}

function formatDate(value, includeTime = false) {
  if (!value) {
    return 'Not specified';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(includeTime ? { hour: 'numeric', minute: '2-digit' } : {}),
  });
}

function slugify(value = '') {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
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

function getAssessmentClasses(value) {
  const normalized = normalizeAssessmentKey(value);

  if (normalized === 'adequate') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }

  if (normalized === 'requires-improvement') {
    return 'border-amber-200 bg-amber-50 text-amber-700';
  }

  if (normalized === 'urgently-required' || normalized === 'non-existing') {
    return 'border-rose-200 bg-rose-50 text-rose-700';
  }

  return 'border-slate-200 bg-slate-50 text-slate-700';
}

function isRatingRow(row) {
  return /rating|score|weighted average/i.test(row.label);
}

function isCommentRow(row) {
  return /comment|remark|note|recommendation/i.test(row.label);
}

function isAttentionRow(row) {
  return ['requires-improvement', 'urgently-required', 'non-existing'].includes(
    normalizeAssessmentKey(row.rawValue)
  );
}

function DetailItem({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border border-[#e2ddd5] bg-[#fbfaf8] p-3">
      <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7a8498]">
        {Icon && <Icon className="h-3.5 w-3.5 text-[#991b1e]" />}
        {label}
      </div>
      <p className="text-sm font-semibold text-[#1f2a44]">{value || 'Not specified'}</p>
    </div>
  );
}

function AssessmentPill({ value }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getAssessmentClasses(value)}`}>
      {formatValue(value)}
    </span>
  );
}

function ResponseTable({ rows, emptyText }) {
  if (rows.length === 0) {
    return <p className="text-sm text-[#6a7388]">{emptyText}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-[#e5e0d8] text-left text-xs uppercase tracking-[0.14em] text-[#6a7388]">
            <th className="px-3 py-3">Review Item</th>
            <th className="px-3 py-3">Assessment</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#eeeae3]">
          {rows.map((row, index) => (
            <tr key={`${row.label}-${index}`} className="align-top">
              <td className="px-3 py-3 font-medium text-[#1f2a44]">{row.label}</td>
              <td className="px-3 py-3 text-[#35415d]">
                <AssessmentPill value={row.rawValue} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
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
        const response = await fetch(`/tec/api/projects/${projectId}`, { cache: 'no-store' });
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

  const summary = useMemo(() => {
    if (!project?.formData) {
      return {
        generalRows: [],
        reviewingDepartmentRows: [],
        assessmentRows: [],
        ratingRows: [],
        commentRows: [],
        attentionRows: [],
        distribution: {},
      };
    }

    const selectedDepartmentSlug = slugify(project.reviewingDepartment || '');
    const departmentPrefix = selectedDepartmentSlug
      ? `deptReview_${selectedDepartmentSlug}_`
      : '';

    const filteredEntries = Object.entries(project.formData)
      .filter(([key]) => !OVERVIEW_FORM_KEYS.has(key))
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => ({ key, rawValue: value }));

    const reviewingDepartmentRows = filteredEntries
      .filter(({ key }) => departmentPrefix && key.startsWith(departmentPrefix))
      .map(({ key, rawValue }) => ({
        label: formatLabel(key.slice(departmentPrefix.length)),
        rawValue,
        value: formatValue(rawValue),
      }));

    const generalRows = filteredEntries
      .filter(({ key }) => !key.startsWith('deptReview_'))
      .map(({ key, rawValue }) => ({
        label: formatLabel(key),
        rawValue,
        value: formatValue(rawValue),
      }));

    const ratingRows = reviewingDepartmentRows.filter(isRatingRow);
    const commentRows = reviewingDepartmentRows.filter(isCommentRow);
    const assessmentRows = reviewingDepartmentRows.filter(
      (row) => !isRatingRow(row) && !isCommentRow(row)
    );
    const attentionRows = assessmentRows.filter(isAttentionRow);
    const distribution = assessmentRows.reduce((counts, row) => {
      const key = normalizeAssessmentKey(row.rawValue);
      if (ASSESSMENT_LABELS[key]) {
        counts[key] = (counts[key] || 0) + 1;
      }
      return counts;
    }, {});

    return {
      generalRows,
      reviewingDepartmentRows,
      assessmentRows,
      ratingRows,
      commentRows,
      attentionRows,
      distribution,
    };
  }, [project]);

  const contactDisplay = useMemo(() => {
    const title = project?.formData?.title ? String(project.formData.title).trim() : '';
    const name = project?.contactName ? String(project.contactName).trim() : '';

    return [title, name].filter(Boolean).join(' ') || 'Not specified';
  }, [project]);

  const reviewState = useMemo(() => {
    if (summary.attentionRows.some((row) => normalizeAssessmentKey(row.rawValue) === 'urgently-required')) {
      return {
        label: 'Urgent attention required',
        detail: 'At least one review item was marked urgently required.',
        className: 'border-rose-200 bg-rose-50 text-rose-700',
      };
    }

    if (summary.attentionRows.length > 0) {
      return {
        label: 'Follow-up recommended',
        detail: `${summary.attentionRows.length} item(s) need improvement or clarification.`,
        className: 'border-amber-200 bg-amber-50 text-amber-700',
      };
    }

    if (summary.assessmentRows.length > 0) {
      return {
        label: 'No major concerns flagged',
        detail: 'Captured departmental responses do not indicate immediate action items.',
        className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      };
    }

    return {
      label: 'Review details pending',
      detail: 'No departmental assessment responses have been captured yet.',
      className: 'border-slate-200 bg-slate-50 text-slate-700',
    };
  }, [summary.assessmentRows.length, summary.attentionRows]);

  const overallRating = summary.ratingRows[0];

  if (loading) {
    return <div className="p-6 text-sm text-[#6a7388]">Loading project details...</div>;
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="mb-4 text-red-600">{error}</p>
        <Link href="/projects" className="text-blue-600 hover:underline">
          Back to All Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <header className="rounded-2xl border border-[#d9d5cd] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#991b1e]">
              TEC Project Summary
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#1f2a44]">
              {project.projectName}
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-[#5f6b82]">
              {project.projectType} request for {project.client}, routed to{' '}
              <span className="font-semibold text-[#1f2a44]">
                {project.reviewingDepartment}
              </span>
              .
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/?editSubmissionId=${project.id}`}
              className="inline-flex items-center gap-2 rounded-xl border border-[#d6d2ca] bg-white px-3.5 py-2 text-sm font-semibold text-[#2d3750] transition hover:border-[#991b1e] hover:text-[#991b1e]"
            >
              <Edit2 className="h-4 w-4" />
              Edit form
            </Link>
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 rounded-xl border border-[#d6d2ca] bg-[#f9f8f6] px-3.5 py-2 text-sm font-semibold text-[#2d3750] transition hover:border-[#991b1e] hover:text-[#991b1e]"
            >
              <ArrowLeft className="h-4 w-4" />
              All Projects
            </Link>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(project.status)}`}>
            {titleCase(project.status)}
          </span>
          <span className="inline-flex rounded-full border border-[#eadfd5] bg-[#fbf8f4] px-3 py-1 text-xs font-semibold text-[#6a4a35]">
            {project.reviewingDepartment}
          </span>
          <span className="inline-flex rounded-full border border-[#d9e2f2] bg-[#f4f7fb] px-3 py-1 text-xs font-semibold text-[#31476b]">
            Updated {formatDate(project.updatedAt, true)}
          </span>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DetailItem label="Submitted Date" value={formatDate(project.date)} icon={Calendar} />
        <DetailItem label="Client" value={project.client} icon={User} />
        <DetailItem label="Contact" value={contactDisplay} icon={User} />
        <DetailItem label="Telephone" value={project.contactTelephone} icon={Phone} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border border-[#d9d5cd] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#1f2a44]">Review Snapshot</h2>
              <p className="mt-1 text-sm text-[#6a7388]">{reviewState.detail}</p>
            </div>
            <span className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${reviewState.className}`}>
              {summary.attentionRows.length > 0 ? (
                <AlertTriangle className="h-3.5 w-3.5" />
              ) : (
                <CheckCircle className="h-3.5 w-3.5" />
              )}
              {reviewState.label}
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-[#e2ddd5] bg-[#fbfaf8] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7a8498]">
                Overall Rating
              </p>
              <p className="mt-2 text-3xl font-bold text-[#1f2a44]">
                {overallRating ? normalizeValue(overallRating.rawValue) : '-'}
                {overallRating ? <span className="text-base font-semibold text-[#6a7388]"> / 10</span> : null}
              </p>
            </div>
            <div className="rounded-xl border border-[#e2ddd5] bg-[#fbfaf8] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7a8498]">
                Review Coverage
              </p>
              <p className="mt-2 text-3xl font-bold text-[#1f2a44]">
                {summary.assessmentRows.length}
              </p>
              <p className="text-xs text-[#6a7388]">departmental response(s)</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {ASSESSMENT_ORDER.map((key) => (
              <span
                key={key}
                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getAssessmentClasses(key)}`}
              >
                {ASSESSMENT_LABELS[key]}: {summary.distribution[key] || 0}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[#d9d5cd] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-[#1f2a44]">Items Needing Attention</h2>
          <p className="mt-1 text-sm text-[#6a7388]">
            Focus list for follow-up before committee closure.
          </p>

          {summary.attentionRows.length === 0 ? (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
              No improvement or urgent items were flagged in the captured review.
            </div>
          ) : (
            <ul className="mt-4 space-y-2">
              {summary.attentionRows.map((row, index) => (
                <li
                  key={`${row.label}-${index}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[#e2ddd5] bg-[#fbfaf8] px-3 py-2"
                >
                  <span className="text-sm font-semibold text-[#1f2a44]">{row.label}</span>
                  <AssessmentPill value={row.rawValue} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-[#d9d5cd] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-[#1f2a44]">Project Context</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <DetailItem label="Project Type" value={project.projectType} />
          <DetailItem label="Reviewing Department" value={project.reviewingDepartment} />
          <DetailItem label="Owner Email" value={project.email} icon={Mail} />
          <DetailItem label="Submitted Record" value={formatDate(project.createdAt, true)} />
        </div>
      </section>

      {summary.commentRows.length > 0 && (
        <section className="rounded-2xl border border-[#d9d5cd] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-[#1f2a44]">Reviewer Comments</h2>
          <div className="mt-4 space-y-3">
            {summary.commentRows.map((row, index) => (
              <div key={`${row.label}-${index}`} className="rounded-xl border border-[#e2ddd5] bg-[#fbfaf8] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7a8498]">
                  {row.label}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-[#35415d]">
                  {normalizeValue(row.rawValue)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-[#d9d5cd] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-[#1f2a44]">
          {project.reviewingDepartment} Assessment Responses
        </h2>
        <div className="mt-4">
          <ResponseTable
            rows={summary.assessmentRows}
            emptyText="No departmental assessment responses were captured for this project."
          />
        </div>
      </section>

      {summary.generalRows.length > 0 && (
        <section className="rounded-2xl border border-[#d9d5cd] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-[#1f2a44]">Additional Form Details</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#e5e0d8] text-left text-xs uppercase tracking-[0.14em] text-[#6a7388]">
                  <th className="px-3 py-3">Field</th>
                  <th className="px-3 py-3">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eeeae3]">
                {summary.generalRows.map((row, index) => (
                  <tr key={`${row.label}-${index}`}>
                    <td className="px-3 py-3 font-medium text-[#1f2a44]">{row.label}</td>
                    <td className="px-3 py-3 text-[#35415d]">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
