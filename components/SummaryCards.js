'use client';

import React from 'react';
import { Users, Sparkles, Repeat, CheckCircle } from 'lucide-react';

export default function SummaryCards({ summary = {}, loading = false }) {
  const cards = [
    {
      title: 'TOTAL REGISTRATIONS',
      count: summary?.totalRegistrations ?? 0,
      description: 'Live records registered',
      icon: Users,
      gradient: 'from-rose-500 to-rose-600',
      bgLight: 'bg-rose-50',
      border: 'border-rose-200',
      textColor: 'text-rose-600',
    },
    {
      title: 'FIRST-TIME DONORS',
      count: summary?.firstTimeDonors ?? 0,
      description: 'Previous Donation = No',
      icon: Sparkles,
      gradient: 'from-blue-500 to-indigo-600',
      bgLight: 'bg-blue-50',
      border: 'border-blue-200',
      textColor: 'text-blue-600',
    },
    {
      title: 'REPEAT DONORS',
      count: summary?.repeatDonors ?? 0,
      description: 'Previous Donation = Yes',
      icon: Repeat,
      gradient: 'from-emerald-500 to-teal-600',
      bgLight: 'bg-emerald-50',
      border: 'border-emerald-200',
      textColor: 'text-emerald-600',
    },
    {
      title: 'CONTACT CONSENTS',
      count: summary?.contactConsents ?? 0,
      description: 'Contact Consent = Yes',
      icon: CheckCircle,
      gradient: 'from-amber-500 to-orange-600',
      bgLight: 'bg-amber-50',
      border: 'border-amber-200',
      textColor: 'text-amber-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`relative overflow-hidden rounded-2xl bg-white border ${card.border} p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                {card.title}
              </span>
              <div className={`p-2.5 rounded-xl ${card.bgLight} ${card.textColor}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-4 flex items-baseline">
              {loading ? (
                <div className="h-9 w-16 bg-slate-200 animate-pulse rounded"></div>
              ) : (
                <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                  {card.count}
                </span>
              )}
            </div>

            <p className="mt-1 text-xs text-slate-400 font-medium">
              {card.description}
            </p>

            {/* Subtle decorative bottom gradient line */}
            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient}`} />
          </div>
        );
      })}
    </div>
  );
}
