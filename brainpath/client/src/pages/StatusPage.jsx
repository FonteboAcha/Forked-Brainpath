import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../lib/db.js";
import { apiGet } from "../lib/api.js";
import { getConnectionHint } from "../lib/connection.js";

export default function StatusPage() {
  const [apiStatus, setApiStatus] = useState("checking...");
  const connection = getConnectionHint();

  // Reads straight from IndexedDB — updates automatically if Dexie data changes.
  const cachedCourses = useLiveQuery(() => db.courses.toArray(), []) ?? [];

  useEffect(() => {
    apiGet("/health")
      .then((data) => setApiStatus(`${data.status} (db: ${data.db})`))
      .catch(() => setApiStatus("unreachable — is the server running?"));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Brain<span className="text-brand-blue">Path</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">Frontend skeleton — wiring check</p>
        </div>

        <dl className="space-y-3 text-sm">
          <Row label="API connection" value={apiStatus} />
          <Row
            label="Cached courses (Dexie)"
            value={`${cachedCourses.length} stored locally`}
          />
          <Row
            label="Network hint"
            value={
              connection
                ? `${connection.effectiveType}${connection.saveData ? " · data saver on" : ""}`
                : "unavailable (expected on Safari/iOS)"
            }
          />
        </dl>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900">{value}</dd>
    </div>
  );
}
