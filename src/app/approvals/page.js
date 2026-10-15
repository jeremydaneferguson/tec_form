"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ApprovalsPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch('/tec/api/approvals', { cache: 'no-store' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load approvals');
        if (!cancelled) setRecords(data);
      } catch (failure) {
        if (!cancelled) setError(failure.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);
  const pending = records.filter((record) => record.status !== 'approved');
  const approved = records.filter((record) => record.status === 'approved');
  const renderRecords = (items, empty) => items.length ? (
    <ul className="mt-4 space-y-3">{items.map((record) => (
      <li key={record.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#ddd8d1] bg-white p-4">
        <div><h3 className="font-semibold text-[#1f2a44]">{record.name}</h3>
          <p className="mt-1 text-sm text-[#6a7388]">{record.email} · {record.department}</p>
          {record.approval && <p className="mt-1 text-sm text-emerald-700">Approved by {record.approval.approvedBy} on {new Date(record.approval.approvedAt).toLocaleDateString()}</p>}
        </div>
        <div className="flex gap-3 text-sm font-semibold">
          <Link href={`/projects/${record.id}`} className="text-[#546077] underline">View submission</Link>
          {record.status !== 'approved' && <Link href={`/approvals/${record.id}`} className="rounded-lg bg-[#991b1e] px-3 py-2 text-white">Assess form</Link>}
        </div>
      </li>
    ))}</ul>
  ) : <p className="mt-4 text-sm text-[#6a7388]">{empty}</p>;
  return <div className="space-y-6 p-6">
    <header><h1 className="text-3xl font-bold text-[#1f2a44]">Approvals</h1><p className="mt-2 text-sm text-[#6a7388]">Assess completed Requestor submissions using steps 3–6.</p></header>
    {loading ? <p>Loading approvals...</p> : error ? <p role="alert" className="text-red-700">{error}</p> : <>
      <section><h2 className="text-xl font-semibold">Pending assessment ({pending.length})</h2>{renderRecords(pending, 'No forms are awaiting approval.')}</section>
      <section><h2 className="text-xl font-semibold">Approved ({approved.length})</h2>{renderRecords(approved, 'No approved forms yet.')}</section>
    </>}
  </div>;
}
