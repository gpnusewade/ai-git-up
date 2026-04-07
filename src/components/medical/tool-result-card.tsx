'use client';

import type { Doctor, InsurancePlan, ContactInfo } from '@/types/medical-agent';

interface ToolResultCardProps {
  type: 'doctor' | 'insurance' | 'contact';
  data: Doctor[] | InsurancePlan[] | ContactInfo[];
}

export function ToolResultCard({ type, data }: ToolResultCardProps) {
  if (type === 'doctor') {
    return (
      <div className="rounded-xl p-4 bg-white shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#6366f1]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <h3 className="font-semibold text-gray-800">推荐医生</h3>
        </div>
        <div className="space-y-3">
          {(data as Doctor[]).map((doctor) => (
            <div
              key={doctor.id}
              className="p-3 rounded-lg border border-gray-200 bg-gray-50"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-gray-800">{doctor.name}</h4>
                  <p className="text-sm text-gray-500">{doctor.title} · {doctor.department}</p>
                  <p className="text-sm text-gray-500">{doctor.hospital}</p>
                </div>
                <div className="flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">{doctor.rating}</span>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {doctor.specialties.slice(0, 3).map((s) => (
                  <span
                    key={s}
                    className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-600"
                  >
                    {s}
                  </span>
                ))}
              </div>
              <div className="mt-2 text-xs text-gray-400">
                距离 {doctor.distance} · 可预约: {doctor.availableSlots[0]}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'insurance') {
    return (
      <div className="rounded-xl p-4 bg-white shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#6366f1]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <h3 className="font-semibold text-gray-800">推荐保险方案</h3>
        </div>
        <div className="space-y-3">
          {(data as InsurancePlan[]).map((plan) => (
            <div
              key={plan.id}
              className="p-3 rounded-lg border border-gray-200 bg-gray-50"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-gray-800">{plan.name}</h4>
                  <p className="text-sm text-gray-500">{plan.provider}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-[#6366f1]">¥{plan.monthlyPrice}</p>
                  <p className="text-xs text-gray-400">/月</p>
                </div>
              </div>
              <p className="text-sm mt-2 text-gray-600">{plan.matchReason}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {plan.coverage.slice(0, 4).map((c) => (
                  <span
                    key={c}
                    className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-600"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'contact') {
    return (
      <div className="rounded-xl p-4 bg-white shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#6366f1]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <h3 className="font-semibold text-gray-800">客服联系方式</h3>
        </div>
        <div className="space-y-2">
          {(data as ContactInfo[]).map((contact) => (
            <div
              key={contact.type}
              className="p-3 rounded-lg border border-gray-200 bg-gray-50"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-gray-800">{contact.label}</h4>
                  <p className="text-sm text-gray-500">{contact.description}</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-600">
                  {contact.available}
                </span>
              </div>
              <p className="mt-2 font-mono text-sm text-[#6366f1]">{contact.value}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
