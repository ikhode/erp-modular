import React from 'react';
import {Activity, TrendingUp} from 'lucide-react';

interface StatItem {
    title: string;
    value: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    trend: 'up' | 'down' | 'stable';
    change: string;
}

interface DashboardStatsProps {
    stats: StatItem[];
    loading: boolean;
}

const getTrendIcon = (trend: string) => {
    switch (trend) {
        case 'up': return <TrendingUp className="h-3 w-3 text-green-600" />;
        case 'down': return <TrendingUp className="h-3 w-3 text-red-600 rotate-180" />;
        default: return <Activity className="h-3 w-3 text-gray-600" />;
    }
};

export const DashboardStats: React.FC<DashboardStatsProps> = ({ stats, loading }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading ? (
                // Loading skeleton
                Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 animate-pulse">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-gray-200 p-4 rounded-2xl w-16 h-16"></div>
                            <div className="bg-gray-200 px-3 py-1 rounded-full w-16 h-6"></div>
                        </div>
                        <div className="space-y-2">
                            <div className="bg-gray-200 h-4 w-24 rounded"></div>
                            <div className="bg-gray-200 h-8 w-20 rounded"></div>
                        </div>
                    </div>
                ))
            ) : (
                stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 group">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`${stat.color} p-4 rounded-2xl shadow-md group-hover:shadow-lg transition-all duration-300`}>
                                    <Icon className="h-8 w-8 text-white" />
                                </div>
                                <div className={`flex items-center space-x-1 text-sm px-3 py-1 rounded-full ${
                                    stat.trend === 'up' ? 'bg-green-100 text-green-700' :
                                        stat.trend === 'down' ? 'bg-red-100 text-red-700' :
                                            'bg-gray-100 text-gray-700'
                                }`}>
                                    {getTrendIcon(stat.trend)}
                                    <span className="font-medium">{stat.change}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{stat.title}</p>
                                <p className="text-4xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors duration-300">
                                    {stat.value}
                                </p>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
};
