import { AGREEMENT_LABELS, COMMITTEES, DETAIL_GROUPS, RATING_FIELDS, RECOMMENDATION_STAGES, detailLabel, normalizeFormDetails } from '@/lib/form-details';

function ReadableValue({ value }) {
  if (value === null || value === undefined || value === '') return <span className="text-[#7a8498]">Not provided</span>;
  if (typeof value === 'boolean') return <span>{value ? 'Yes' : 'No'}</span>;
  if (Array.isArray(value)) return value.length ? <ul className="flex flex-wrap gap-2">{value.map((item, index) => <li key={index} className="rounded-lg border border-[#ddd8d1] bg-white px-2.5 py-1"><ReadableValue value={item} /></li>)}</ul> : <span className="text-[#7a8498]">No selections recorded</span>;
  if (typeof value === 'object') return <dl className="space-y-2">{Object.entries(value).map(([key, child]) => <div key={key}><dt className="font-medium">{detailLabel(key)}</dt><dd className="mt-1 pl-3"><ReadableValue value={child} /></dd></div>)}</dl>;
  return <span className="whitespace-pre-wrap break-words">{String(value)}</span>;
}

function Detail({ field, value }) {
  const rating = RATING_FIELDS[field];
  const validRating = rating && Number.isInteger(value) && value >= 1 && value <= rating.max;
  return <div className="min-w-0 rounded-xl border border-[#e2ddd5] bg-[#fbfaf8] p-4">
    <dt className="text-sm font-semibold text-[#546077]">{detailLabel(field)}</dt>
    <dd className="mt-2 text-sm text-[#1f2a44]">{validRating ? <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2"><span className="text-xl font-bold">{value}<span className="text-sm font-normal text-[#6a7388]"> / {rating.max}</span></span>{rating.max === 5 && <span className="rounded-full border border-[#ddd8d1] bg-white px-2.5 py-1 text-xs">{AGREEMENT_LABELS[value]}</span>}</div>
      <meter min="0" max={rating.max} value={value} aria-label={`${rating.label}: ${value} out of ${rating.max}`} className="h-3 w-full accent-[#991b1e]" />
    </div> : <ReadableValue value={value} />}</dd>
  </div>;
}

export default function ProjectFormDetails({ rows }) {
  const data = normalizeFormDetails(Object.fromEntries(rows.map((row) => [row.key, row.rawValue])));
  const present = (field) => Object.hasOwn(data, field) && data[field] !== null && data[field] !== undefined && data[field] !== '';
  const handled = new Set(['approvalsRecommendations', 'approvalsRecommendationsOther', ...DETAIL_GROUPS.flatMap((group) => group.fields)]);
  const groups = [...DETAIL_GROUPS, { title: 'Other proposal details', fields: Object.keys(data).filter((key) => !handled.has(key)) }];
  const matrix = data.approvalsRecommendations;
  const isMatrix = matrix && typeof matrix === 'object' && !Array.isArray(matrix);
  const names = isMatrix ? [...COMMITTEES.filter((name) => Object.hasOwn(matrix, name)), ...Object.keys(matrix).filter((name) => !COMMITTEES.includes(name))] : [];
  return <>
    {groups.map((group) => group.fields.some(present) && <section key={group.title} className="rounded-2xl border border-[#d9d5cd] bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-[#1f2a44]">{group.title}</h2>
      <dl className="mt-4 grid gap-3 md:grid-cols-2">{group.fields.filter(present).map((field) => <Detail key={field} field={field} value={data[field]} />)}</dl>
    </section>)}
    {(present('approvalsRecommendations') || present('approvalsRecommendationsOther')) && <section className="rounded-2xl border border-[#d9d5cd] bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-[#1f2a44]">Approvals &amp; recommendations</h2>
      <p className="mt-1 text-sm text-[#6a7388]">Recorded committee stage selections.</p>
      {names.length > 0 ? <div className="mt-4 overflow-x-auto"><table className="w-full text-sm">
        <caption className="sr-only">Committee recommendations by stage</caption>
        <thead><tr className="border-b text-left text-xs uppercase tracking-wide text-[#6a7388]"><th scope="col" className="px-3 py-3">Committee</th>{RECOMMENDATION_STAGES.map((stage, index) => <th scope="col" key={stage} className="px-3 py-3 text-center">Stage {index + 1}</th>)}</tr></thead>
        <tbody>{names.map((name) => <tr key={name} className="border-b border-[#eeeae3] last:border-0"><th scope="row" className="px-3 py-3 text-left font-medium text-[#1f2a44]">{name}</th>{RECOMMENDATION_STAGES.map((stage) => <td key={stage} className="px-3 py-3 text-center">{matrix[name]?.[stage] === true ? <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">Selected</span> : <span className="text-[#7a8498]" aria-label="Not selected">—</span>}</td>)}</tr>)}</tbody>
      </table></div> : <div className="mt-3"><ReadableValue value={matrix} /></div>}
      {present('approvalsRecommendationsOther') && <p className="mt-4 whitespace-pre-wrap text-sm text-[#35415d]">Other committee: {String(data.approvalsRecommendationsOther)}</p>}
    </section>}
  </>;
}
