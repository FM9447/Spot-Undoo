import { useEffect, useState } from 'react';
import { IndianRupee } from 'lucide-react';

export default function PlanHistory() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetch('/api/plans')
      .then((res) => res.json())
      .then(setHistory)
      .catch(console.error);
  }, []);

  if (!history.length) return null;

  return (
    <div className="mt-6 space-y-4">
      <h3 className="text-sm font-bold text-white">Past Plans</h3>
      {history.map((item) => (
        <div key={item._id || item.insertedId} className="bg-[#1a1a24] rounded-xl p-3 border border-white/10">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-purple-400">{new Date(item.createdAt).toLocaleString()}</span>
            <span className="text-xs text-gray-400">{item.hub}</span>
          </div>
          {item.plans && item.plans.map((plan, i) => (
            <div key={i} className="mb-2">
              <div className="text-sm font-medium text-white">{plan.label}</div>
              <div className="flex items-center text-xs text-gray-400">
                <IndianRupee size={12} className="text-orange-400" />
                <span className="ml-1">{plan.totalCost ?? 0}</span>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
