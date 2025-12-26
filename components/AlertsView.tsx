import React from 'react';
import { AlertTriangle, Shield, Eye, EyeOff, Bell } from 'lucide-react';
import { AlertItem, Role } from '../types';
import { MOCK_ALERTS } from '../constants';

interface AlertsViewProps {
  currentRole: Role;
  onSelectStudent: (id: string) => void;
}

const AlertsView: React.FC<AlertsViewProps> = ({ currentRole, onSelectStudent }) => {
  const isLeader = currentRole === 'LEADER' || currentRole === 'HEADMASTER';

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'High': return 'bg-red-50 border-red-200 text-red-700';
      case 'Medium': return 'bg-orange-50 border-orange-200 text-orange-700';
      default: return 'bg-blue-50 border-blue-200 text-blue-700';
    }
  };

  const getIconColor = (level: string) => {
    switch (level) {
      case 'High': return 'text-red-600';
      case 'Medium': return 'text-orange-600';
      default: return 'text-blue-600';
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto animate-fade-in">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Bell className="text-blue-600" />
            预警通知中心
          </h1>
          <p className="text-slate-500 mt-1">
            {isLeader ? '查看所有层级的异常预警（含绝密信息）。' : '查看学生日常行为及学业预警。'}
          </p>
        </div>
        <div className="text-xs text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm">
          {isLeader ? '当前模式: 全局监控 (隐私可见)' : '当前模式: 教学辅助 (隐私脱敏)'}
        </div>
      </div>

      <div className="space-y-4">
        {MOCK_ALERTS.map((alert) => (
          <div 
            key={alert.id} 
            className={`relative rounded-xl border p-5 shadow-sm transition-all hover:shadow-md cursor-pointer bg-white group`}
            onClick={() => onSelectStudent(alert.studentId)}
          >
            {/* Left Border Indicator */}
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl ${
              alert.level === 'High' ? 'bg-red-500' : alert.level === 'Medium' ? 'bg-orange-400' : 'bg-blue-400'
            }`}></div>

            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pl-4">
              {/* Main Content */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${getLevelColor(alert.level)}`}>
                    {alert.level === 'High' ? '高危预警' : alert.level === 'Medium' ? '重点关注' : '常规提醒'}
                  </span>
                  <span className="text-xs text-slate-400">{alert.date}</span>
                  {isLeader && alert.contentConfidential && (
                     <span className="flex items-center gap-1 text-[10px] bg-amber-100 text-amber-700 px-1.5 rounded border border-amber-200">
                       <Shield size={10} /> 绝密级
                     </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-bold text-slate-800 text-lg">{alert.studentName}</h3>
                  <span className="text-xs text-slate-400">#{alert.studentId.toUpperCase()}</span>
                </div>

                <div className="text-sm leading-relaxed">
                  {isLeader && alert.contentConfidential ? (
                    <div className="flex flex-col gap-1">
                      <p className="text-slate-800 font-medium flex items-start gap-2">
                        <span className="mt-1 min-w-[16px]"><Eye size={16} className="text-amber-600"/></span>
                        {alert.contentConfidential}
                      </p>
                      <p className="text-slate-400 text-xs pl-6">
                        (普通教师看到的版本: "{alert.contentPublic}")
                      </p>
                    </div>
                  ) : (
                    <p className="text-slate-600 flex items-start gap-2">
                       <span className="mt-1 min-w-[16px]"><EyeOff size={16} className="text-slate-400"/></span>
                       {alert.contentPublic}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="flex flex-col items-end justify-center min-w-[100px]">
                 <button className="text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors">
                   查看档案
                 </button>
                 {isLeader && alert.level === 'High' && (
                    <span className="text-[10px] text-red-500 mt-2 font-medium">建议立即干预</span>
                 )}
              </div>
            </div>
          </div>
        ))}

        {MOCK_ALERTS.length === 0 && (
          <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-slate-100 border-dashed">
            <AlertTriangle className="mx-auto mb-2 opacity-50" size={32} />
            暂无预警信息
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertsView;