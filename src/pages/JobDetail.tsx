import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { API_BASE } from '../api';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  open:         { label: 'Open — Accept to Claim',     color: '#0891b2', bg: '#ecfeff' },
  assigned:     { label: 'Claimed — Download & Work',  color: '#d97706', bg: '#fffbeb' },
  accepted:     { label: 'In Progress',                color: '#2563eb', bg: '#eff6ff' },
  uploaded:     { label: 'Submitted (Cooling Period)', color: '#7c3aed', bg: '#f5f3ff' },
  under_review: { label: 'Under Review',               color: '#6366f1', bg: '#eef2ff' },
  completed:    { label: 'Completed',                  color: '#059669', bg: '#ecfdf5' },
  cancelled:    { label: 'Cancelled',                  color: '#dc2626', bg: '#fef2f2' },
  rejected:     { label: 'Re-upload Required',         color: '#ea580c', bg: '#fff7ed' },
};

const TIMELINE_LABEL: Record<string, string> = {
  open:         'Job Posted',
  assigned:     'Job Assigned',
  accepted:     'Work Started',
  uploaded:     'Labels Submitted',
  under_review: 'Under Admin Review',
  completed:    'Job Completed',
  cancelled:    'Job Cancelled',
  rejected:     'Re-upload Requested',
  uploading:    'Upload In Progress',
};

const JobDetail: React.FC = () => {
  const { id }    = useParams<{ id: string }>();
  const { token } = useAuth();
  const { socket } = useSocket();
  const navigate  = useNavigate();

  const [job,            setJob]            = useState<any>(null);
  const [loading,        setLoading]        = useState(true);
  const [uploading,      setUploading]      = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [downloading,    setDownloading]    = useState(false);
  const [file,           setFile]           = useState<File | null>(null);
  const [fileError,      setFileError]      = useState('');
  const [error,          setError]          = useState('');
  const [success,        setSuccess]        = useState('');
  const [cooling,        setCooling]        = useState(0);
  const COOLING_TOTAL = 60;

  const headers = { Authorization: `Bearer ${token}` };

  const fetchJob = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/vendor-portal/jobs/${id}`, { headers });
      setJob(data.job);
    } catch {
      setError('Job not found or access denied.');
    } finally {
      setLoading(false);
    }
  }, [id, token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchJob(); }, [fetchJob]);

  // Socket: job-updated from admin (approve/reject)
  useEffect(() => {
    if (!socket) return;
    const handler = (payload: { jobId: string; status: string }) => {
      if (payload.jobId === id) fetchJob();
    };
    socket.on('job-updated', handler);
    return () => { socket.off('job-updated', handler); };
  }, [socket, id, fetchJob]);

  // Cooling countdown
  useEffect(() => {
    if (job?.status === 'uploaded' && job?.resultFile?.coolingDeadline) {
      const tick = () => {
        const rem = Math.max(0, Math.round((new Date(job.resultFile.coolingDeadline).getTime() - Date.now()) / 1000));
        setCooling(rem);
        if (rem === 0) fetchJob();
      };
      tick();
      const iv = setInterval(tick, 1000);
      return () => clearInterval(iv);
    }
  }, [job?.status, job?.resultFile?.coolingDeadline, fetchJob]);

  const handleAccept = async () => {
    setError(''); setSuccess('');
    try {
      await axios.put(`${API_BASE}/vendor-portal/jobs/${id}/accept`, {}, { headers });
      setSuccess('Job accepted! Download the request sheet and generate labels.');
      fetchJob();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not accept job.');
    }
  };

  const handleDownload = async () => {
    setDownloading(true); setError('');
    try {
      const res = await axios.get(`${API_BASE}/vendor-portal/jobs/${id}/download-request`, {
        headers, responseType: 'blob',
      });
      const filename = job?.requestFile?.originalName || `job-${id}.csv`;
      const url  = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href  = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      let message = 'Download failed. Please try again.';
      try {
        if (err?.response?.data instanceof Blob) {
          const text = await err.response.data.text();
          message = JSON.parse(text).message || message;
        } else if (err?.response?.data?.message) {
          message = err.response.data.message;
        }
      } catch {}
      setError(message);
    } finally {
      setDownloading(false);
    }
  };

  const validateFile = (f: File): string => {
    const ext = f.name.split('.').pop()?.toLowerCase();
    if (!['zip', 'pdf', 'csv'].includes(ext || '')) return 'Only ZIP, PDF, or CSV files are allowed.';
    if (f.size > 25 * 1024 * 1024) return `File too large (${(f.size / 1024 / 1024).toFixed(1)} MB). Max 25 MB.`;
    return '';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setFileError(f ? validateFile(f) : '');
  };

  const handleUpload = async () => {
    if (!file) { setError('Please select a file first.'); return; }
    const ve = validateFile(file);
    if (ve) { setFileError(ve); return; }
    setUploading(true); setUploadProgress(0); setError(''); setSuccess('');
    try {
      const form = new FormData();
      form.append('file', file);
      await axios.post(`${API_BASE}/vendor-portal/jobs/${id}/upload`, form, {
        headers: { Authorization: `Bearer ${token}` },
        onUploadProgress: e => {
          if (e.total) setUploadProgress(Math.round((e.loaded / e.total) * 100));
        },
      });
      setSuccess('File submitted! You have 1 minute to cancel if you spot an error.');
      setFile(null);
      setUploadProgress(0);
      fetchJob();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleCancelUpload = async () => {
    setError(''); setSuccess('');
    try {
      await axios.delete(`${API_BASE}/vendor-portal/jobs/${id}/upload`, { headers });
      setSuccess('Submission cancelled. You can re-upload a corrected file.');
      fetchJob();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not cancel upload.');
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center gap-2 min-h-64 text-slate-400 text-sm">
        <span className="w-4 h-4 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
        Loading…
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error || 'Job not found.'}
        </div>
      </div>
    );
  }

  const sc = STATUS_CONFIG[job.status] || { label: job.status, color: '#64748b', bg: '#f1f5f9' };
  const isWorkable = ['assigned', 'accepted', 'rejected'].includes(job.status);
  const coolingPct = COOLING_TOTAL > 0 ? Math.round((cooling / COOLING_TOTAL) * 100) : 0;

  return (
    <div className="p-5 md:p-6 max-w-2xl">

      {/* Back */}
      <button onClick={() => navigate('/jobs')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition mb-5">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6" /></svg>
        Back to Jobs
      </button>

      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-lg font-bold text-slate-900">Job #{job._id.slice(-8).toUpperCase()}</h1>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
        </div>
        <p className="text-slate-400 text-xs mt-1">Received {new Date(job.createdAt).toLocaleString()}</p>
      </div>

      {/* Alerts */}
      {error   && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">{error}</div>}
      {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-sm mb-4">{success}</div>}

      {/* Job details */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 mb-4">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Job Details</h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          {[
            { label: 'Carrier',      value: job.carrier },
            { label: 'Label Count',  value: job.requestFile?.labelCount ?? '—' },
            { label: 'Your Rate',    value: `$${(job.vendorEarning?.ratePerLabel ?? 0).toFixed(2)} / label` },
            { label: 'Your Earning', value: `$${(job.vendorEarning?.totalAmount ?? 0).toFixed(2)}` },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mb-0.5">{label}</div>
              <div className="text-sm font-bold text-slate-900">{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Open — accept */}
      {job.status === 'open' && (
        <div className="bg-white rounded-xl border-l-4 border-l-cyan-500 border border-slate-100 shadow-sm p-5 mb-4">
          <h3 className="font-semibold text-slate-800 mb-1">Available — Be the First to Accept</h3>
          <p className="text-slate-500 text-sm mb-4">Accept this job to claim it and start generating labels.</p>
          <button onClick={handleAccept} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition">
            Accept &amp; Claim Job
          </button>
        </div>
      )}

      {/* Workable — step guide + download + upload */}
      {isWorkable && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 mb-4">
          {job.status === 'rejected' && (
            <div className="bg-orange-50 border border-orange-200 text-orange-700 rounded-lg px-4 py-3 text-sm mb-5">
              <span className="font-semibold">Upload rejected:</span>{' '}
              {job.rejectionReason || 'Please review and re-upload the corrected file.'}
            </div>
          )}

          {/* Step guide */}
          <div className="flex items-start gap-0 mb-6">
            {[
              { n: '1', title: 'Download Sheet', desc: 'Get the request file below' },
              { n: '2', title: 'Generate Labels', desc: 'Process in your facility' },
              { n: '3', title: 'Upload Result', desc: 'Submit the completed file' },
            ].map((step, i) => (
              <React.Fragment key={step.n}>
                <div className="flex flex-col items-center flex-1 text-center">
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center mb-1.5">
                    {step.n}
                  </div>
                  <div className="text-xs font-semibold text-slate-700">{step.title}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{step.desc}</div>
                </div>
                {i < 2 && <div className="flex-none w-6 h-0.5 bg-slate-200 mt-3.5" />}
              </React.Fragment>
            ))}
          </div>

          {/* Step 1: Download */}
          <div className="mb-5">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Step 1 — Download Request Sheet</div>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 text-sm font-semibold rounded-lg transition disabled:opacity-60"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {downloading ? 'Downloading…' : `Download Sheet (${job.requestFile?.labelCount ?? '?'} rows)`}
            </button>
          </div>

          {/* Step 3: Upload */}
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Step 3 — Upload Completed Labels</div>
            <div className="flex gap-2 flex-wrap items-start">
              <div className="flex-1 min-w-48">
                <input
                  type="file"
                  accept=".zip,.pdf,.csv"
                  onChange={handleFileChange}
                  className="w-full text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-slate-200 file:text-xs file:font-semibold file:text-slate-600 file:bg-slate-50 hover:file:bg-slate-100 file:transition cursor-pointer"
                />
                {file && !fileError && (
                  <div className="text-[11px] text-slate-400 mt-1">{file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB</div>
                )}
                {fileError && <div className="text-[11px] text-red-500 mt-1">{fileError}</div>}
              </div>
              <button
                onClick={handleUpload}
                disabled={!file || uploading || !!fileError}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition whitespace-nowrap"
              >
                {uploading ? `Uploading ${uploadProgress}%` : 'Upload'}
              </button>
            </div>

            {/* Upload progress bar */}
            {uploading && (
              <div className="mt-3">
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-400 mt-1 text-right">{uploadProgress}% uploaded</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cooling period */}
      {job.status === 'uploaded' && cooling > 0 && (
        <div className="bg-white rounded-xl border-l-4 border-l-violet-500 border border-slate-100 shadow-sm p-5 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              <h3 className="font-semibold text-slate-800 text-sm">Cooling Period</h3>
            </div>
            <span className="text-sm font-bold text-violet-600">{cooling}s</span>
          </div>

          {/* Countdown bar */}
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${coolingPct}%`,
                background: coolingPct > 50 ? '#7c3aed' : coolingPct > 20 ? '#ea580c' : '#ef4444',
              }}
            />
          </div>

          <p className="text-slate-500 text-sm mb-3">Spotted a mistake? Cancel now and re-upload before the window closes.</p>
          <button onClick={handleCancelUpload} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition">
            Cancel Upload
          </button>
        </div>
      )}

      {/* Under review / cooling expired */}
      {['under_review', 'uploaded'].includes(job.status) && cooling === 0 && (
        <div className="bg-white rounded-xl border-l-4 border-l-indigo-500 border border-slate-100 shadow-sm p-5 mb-4">
          <p className="text-slate-600 text-sm">Your file has been submitted and is currently under review. You will be notified of the outcome.</p>
        </div>
      )}

      {/* Completed */}
      {job.status === 'completed' && (
        <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-5 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span className="text-emerald-700 font-semibold text-sm">Job Completed</span>
          </div>
          <p className="text-emerald-600 text-sm">${(job.vendorEarning?.totalAmount || 0).toFixed(2)} has been credited to your account.</p>
        </div>
      )}

      {/* Timeline */}
      {job.timeline?.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Activity Timeline</h3>
          <div className="space-y-4">
            {[...job.timeline].reverse().map((t: any, i: number) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1 shrink-0" />
                  {i < job.timeline.length - 1 && <div className="w-px flex-1 bg-slate-100 mt-1" />}
                </div>
                <div className="pb-2">
                  <div className="text-xs font-semibold text-slate-700">
                    {TIMELINE_LABEL[t.status] || t.status?.replace(/_/g, ' ')}
                  </div>
                  {t.note && <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">{t.note}</div>}
                  <div className="text-[10px] text-slate-400 mt-0.5">{new Date(t.timestamp).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDetail;
