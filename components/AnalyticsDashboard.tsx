
import React, { useMemo } from 'react';
import { db } from '../services/db';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, Cell, PieChart, Pie
} from 'recharts';

const AnalyticsDashboard: React.FC = () => {
  const logs = db.getLogs();

  const chartData = useMemo(() => {
    return logs.slice(-20).map((log, i) => ({
      name: i + 1,
      responseTime: log.responseTimeMs,
      queryLength: log.userQuery.length,
      responseLength: log.llmResponse.length
    }));
  }, [logs]);

  const stats = useMemo(() => {
    const total = logs.length;
    const avgResponse = total > 0 ? logs.reduce((acc, curr) => acc + curr.responseTimeMs, 0) / total : 0;
    const uniqueSessions = new Set(logs.map(l => l.sessionId)).size;
    
    return {
      totalInteractions: total,
      avgResponseTime: Math.round(avgResponse),
      activeSessions: uniqueSessions,
    };
  }, [logs]);

  const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f97316'];

  return (
    <div className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full">
      <div className="mb-10">
        <h2 className="text-3xl font-bold text-zinc-100">System Analytics</h2>
        <p className="text-zinc-500 mt-1">Real-time performance metrics and interaction tracking (SQL Logs).</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {[
          { label: 'Total Inquiries', value: stats.totalInteractions, suffix: '', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
          { label: 'Avg Latency', value: stats.avgResponseTime, suffix: 'ms', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
          { label: 'Unique Users', value: stats.activeSessions, suffix: '', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
        ].map((stat, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-xl shadow-black/20">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-zinc-800 rounded-xl">
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                </svg>
              </div>
              <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter">Live Monitor</span>
            </div>
            <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-1">{stat.label}</p>
            <h3 className="text-3xl font-bold text-zinc-100">
              {stat.value}<span className="text-lg font-normal text-zinc-500 ml-1">{stat.suffix}</span>
            </h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Latency Chart */}
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
          <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
            Latency Trend (ms)
          </h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="name" hide />
                <YAxis stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
                  itemStyle={{ color: '#a5b4fc' }}
                />
                <Area type="monotone" dataKey="responseTime" stroke="#6366f1" fillOpacity={1} fill="url(#colorLatency)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Query Complexity vs Response */}
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
          <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-6">Token Usage Density (Chars)</h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="name" hide />
                <YAxis stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: '#27272a' }}
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
                />
                <Bar dataKey="queryLength" fill="#a855f7" radius={[4, 4, 0, 0]} name="Query Size" />
                <Bar dataKey="responseLength" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Response Size" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Interaction Log Table */}
      <div className="mt-10 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-zinc-800">
          <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Raw Interaction Logs</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-950 text-zinc-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Session ID</th>
                <th className="px-6 py-4">Latency</th>
                <th className="px-6 py-4">Query</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {logs.slice(-10).reverse().map((log, i) => (
                <tr key={i} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4 text-zinc-400 font-mono text-[10px] whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-zinc-400 font-mono text-[10px]">{log.sessionId}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${log.responseTimeMs > 2000 ? 'bg-red-900/20 text-red-400' : 'bg-emerald-900/20 text-emerald-400'}`}>
                      {log.responseTimeMs}ms
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-300 line-clamp-1 max-w-md">{log.userQuery}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-zinc-600">No interaction logs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
