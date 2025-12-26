import React, { useState, useMemo } from 'react';
import { Users, AlertCircle, TrendingUp, ChevronRight, Search, Plus, X, PieChart as PieChartIcon, Activity } from 'lucide-react';
import { PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Student, Role } from '../types';

interface DashboardProps {
  currentRole: Role;
  onSelectStudent: (id: string) => void;
  showStats?: boolean;
  students: Student[];
  onAddStudent: (s: Student) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ currentRole, onSelectStudent, showStats = true, students, onAddStudent }) => {
  const isLeader = currentRole === 'LEADER' || currentRole === 'HEADMASTER';
  
  // Add Student Modal State
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  // Added 'id' to initial state
  const [newStudentData, setNewStudentData] = useState<Partial<Student>>({
    id: '', name: '', classId: '', gender: 'Male', isBoarder: false, publicTags: []
  });

  // --- Charts Data Preparation ---
  const studentDistributionData = useMemo(() => {
    let normal = 0;
    let focus = 0;
    let critical = 0;

    students.forEach(s => {
      // Determine status based on privacy rules similar to the list view
      const isPsychRisk = s.psychProfile?.status === 'At Risk';
      const isPsychCritical = s.psychProfile?.status === 'Critical';
      const isFamilyDifficult = s.familyBackground?.economicStatus === 'Difficult';
      
      // Logic: 
      // Critical Psych -> Critical
      // Leader View: Family Difficult + Psych Risk -> Critical/High Priority
      // Otherwise Risk/Difficult -> Focus
      // Else -> Normal
      
      if (isPsychCritical) {
         critical++;
      } else if (isLeader && isFamilyDifficult && isPsychRisk) {
         critical++;
      } else if (isPsychRisk || (isLeader && isFamilyDifficult)) {
         focus++;
      } else {
         normal++;
      }
    });

    return [
      { name: '状态平稳', value: normal, color: '#10b981' }, // Emerald-500
      { name: '需关注', value: focus, color: '#f59e0b' },   // Amber-500
      { name: '重点/高危', value: critical, color: '#ef4444' } // Red-500
    ].filter(item => item.value > 0);
  }, [students, isLeader]);

  const classAttendanceData = useMemo(() => {
    // Extract unique classes from student list
    const classes = Array.from(new Set(students.map(s => s.classId))).sort();
    
    // For visual appeal of Radar Chart, we generally need at least 3 axes.
    // If actual data has fewer than 3 classes, we'll mock a couple of nearby classes.
    let displayClasses: string[] = [...classes];
    if (displayClasses.length < 3) {
        const mockClasses = ['三年一班', '三年四班', '三年五班'];
        for(const m of mockClasses) {
            if(!displayClasses.includes(m) && displayClasses.length < 5) displayClasses.push(m);
        }
        displayClasses.sort();
    }
    
    // Deterministic pseudo-random based on class string char code for stability
    return displayClasses.map((cls) => {
      const seed = cls.charCodeAt(cls.length - 1) || 0;
      // Generate a rate between 92 and 99
      const rate = 92 + (seed % 8); 
      return {
        subject: cls,
        rate: rate,
        fullMark: 100
      };
    });
  }, [students]);

  const getTagColorClass = (color: string) => {
    switch(color) {
      case 'red': return 'bg-red-50 text-red-600 border-red-100';
      case 'blue': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'green': return 'bg-green-50 text-green-600 border-green-100';
      case 'amber': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'purple': return 'bg-purple-50 text-purple-600 border-purple-100';
      default: return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  const handleCreateStudent = () => {
    // Validate ID requirement
    if (!newStudentData.id || !newStudentData.name || !newStudentData.classId) {
      alert("请填写完整信息，包括学号、姓名和班级。");
      return;
    }

    // Check for duplicate ID (simple check)
    if (students.some(s => s.id === newStudentData.id)) {
      alert("该学号已存在，请检查输入。");
      return;
    }
    
    const newStudent: Student = {
      id: newStudentData.id!, // Use manual ID
      name: newStudentData.name!,
      gender: newStudentData.gender as 'Male' | 'Female',
      classId: newStudentData.classId!,
      avatar: `https://ui-avatars.com/api/?name=${newStudentData.name}&background=random`,
      isBoarder: newStudentData.isBoarder || false,
      publicTags: newStudentData.publicTags || [],
      familyBackground: { economicStatus: 'Average', guardianContact: '', notes: '待补充' },
      psychProfile: { status: 'Healthy', lastAssessment: '', notes: '待补充' }
    };
    
    onAddStudent(newStudent);
    setIsAddingStudent(false);
    setNewStudentData({ id: '', name: '', classId: '', gender: 'Male', isBoarder: false, publicTags: [] });
  };

  // Helper for Psych Status in Table
  const getPsychStatusDisplay = (status: string | undefined) => {
     if (status === 'Critical') return { label: '高危', class: 'bg-red-50 text-red-700 font-bold' };
     if (status === 'At Risk') return { label: '需关注', class: 'bg-orange-50 text-orange-600' };
     return { label: '稳定', class: 'bg-green-50 text-green-600' };
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto animate-fade-in relative">
      
      {/* Welcome Section */}
      {showStats && (
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800">
            欢迎回来, {currentRole === 'TEACHER' ? '老师' : '校长'}
          </h1>
          <p className="text-slate-500 mt-1">
            2023年秋季学期重点学生跟踪概览。
          </p>
        </div>
      )}

      {/* Stats Grid */}
      {showStats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Stat 1 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium uppercase tracking-wide">学生总数</p>
                <h3 className="text-3xl font-bold text-slate-800 mt-2">{students.length}</h3>
                <div className="flex items-center mt-2 text-green-600 text-sm font-medium">
                  <TrendingUp size={16} className="mr-1" /> +2.4%
                </div>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Users size={24} />
              </div>
            </div>

            {/* Stat 2 - Context Aware */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium uppercase tracking-wide">
                  {isLeader ? '高危/重点档案' : '需关注学生'}
                </p>
                <h3 className={`text-3xl font-bold mt-2 ${isLeader ? 'text-red-600' : 'text-slate-800'}`}>
                  {isLeader ? '12' : '28'}
                </h3>
                <p className="text-slate-400 text-xs mt-2">需要进行有效干预</p>
              </div>
              <div className={`p-3 rounded-xl ${isLeader ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
                <AlertCircle size={24} />
              </div>
            </div>
            
            {/* Stat 3 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between">
               <div>
                <p className="text-slate-400 text-sm font-medium uppercase tracking-wide">平均出勤率</p>
                <h3 className="text-3xl font-bold text-slate-800 mt-2">94.2%</h3>
                <p className="text-slate-400 text-xs mt-2">三年二班出勤率第一</p>
              </div>
              <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                <TrendingUp size={24} />
              </div>
            </div>
          </div>

          {/* New Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
             {/* Chart 1: Student Status Distribution */}
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                <div className="mb-4">
                   <h3 className="font-bold text-slate-800 flex items-center gap-2">
                     <PieChartIcon className="text-indigo-500" size={20} />
                     学生状态分布概览
                   </h3>
                   <p className="text-xs text-slate-400">基于心理评估与行为记录的综合分层</p>
                </div>
                <div className="flex-1 min-h-[250px] w-full relative">
                   <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                         <Pie 
                            data={studentDistributionData} 
                            cx="50%" 
                            cy="50%" 
                            innerRadius={60} 
                            outerRadius={80} 
                            paddingAngle={5} 
                            dataKey="value"
                         >
                            {studentDistributionData.map((entry, index) => (
                               <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                         </Pie>
                         <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                         <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                   </ResponsiveContainer>
                   {/* Center Text */}
                   <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[60%] text-center pointer-events-none">
                      <span className="text-3xl font-bold text-slate-700">{students.length}</span>
                      <span className="block text-xs text-slate-400">总人数</span>
                   </div>
                </div>
             </div>

             {/* Chart 2: Class Attendance Radar */}
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                <div className="mb-4">
                   <h3 className="font-bold text-slate-800 flex items-center gap-2">
                     <Activity className="text-blue-500" size={20} />
                     各班级出勤率维度
                   </h3>
                   <p className="text-xs text-slate-400">本月各班级平均出勤情况对比</p>
                </div>
                <div className="flex-1 min-h-[250px] w-full">
                   <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={classAttendanceData}>
                         <PolarGrid gridType="polygon" />
                         <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#64748b' }} />
                         <PolarRadiusAxis angle={30} domain={[80, 100]} tick={false} axisLine={false} />
                         <Radar
                            name="出勤率"
                            dataKey="rate"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            fill="#3b82f6"
                            fillOpacity={0.4}
                         />
                         <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            formatter={(value: number) => [`${value}%`, '出勤率']}
                         />
                      </RadarChart>
                   </ResponsiveContainer>
                </div>
             </div>
          </div>
        </>
      )}

      {/* Focus List Header if not showing stats */}
      {!showStats && (
         <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800">
              学生档案列表
            </h1>
         </div>
      )}

      {/* Focus List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-800">
             {showStats ? '重点跟踪名单' : '全校学生列表'}
          </h2>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="搜索学生姓名..." 
                className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-100 w-full md:w-64 outline-none"
              />
            </div>
            {isLeader && (
              <button 
                onClick={() => setIsAddingStudent(true)}
                className="flex items-center gap-1 bg-indigo-600 text-white px-3 py-2 rounded-xl text-sm hover:bg-indigo-700 transition-colors"
              >
                <Plus size={16} /> 添加学生
              </button>
            )}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">学生信息</th>
                <th className="px-6 py-4 font-semibold">班级</th>
                <th className="px-6 py-4 font-semibold">状态</th>
                <th className="px-6 py-4 font-semibold">
                  {isLeader ? '风险因素 (绝密)' : '公开标签'}
                </th>
                <th className="px-6 py-4 font-semibold text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {students.map((student) => {
                 // Dynamic Risk Calculation for Leader View
                 const isPsychRisk = student.psychProfile?.status === 'At Risk' || student.psychProfile?.status === 'Critical';
                 const isFamilyRisk = student.familyBackground?.economicStatus === 'Difficult';
                 const isHighRisk = isPsychRisk || isFamilyRisk;
                 
                 let riskReason = "";
                 if(isPsychRisk && isFamilyRisk) riskReason = "家庭 & 心理双重风险";
                 else if(isPsychRisk) riskReason = "心理高危";
                 else if(isFamilyRisk) riskReason = "家庭经济困难";

                 const psychDisplay = getPsychStatusDisplay(student.psychProfile?.status);

                 return (
                <tr key={student.id} className="hover:bg-slate-50/80 transition-colors group cursor-pointer" onClick={() => onSelectStudent(student.id)}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={student.avatar} alt="" className="w-10 h-10 rounded-full object-cover border border-slate-100" />
                      <div>
                        <p className="font-semibold text-slate-700">{student.name}</p>
                        <p className="text-xs text-slate-400 font-mono">学号: {student.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-sm">
                    {student.classId}
                  </td>
                  <td className="px-6 py-4">
                     <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${psychDisplay.class}`}>
                      {psychDisplay.label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {isLeader && isHighRisk ? (
                        <span className="px-2 py-1 bg-amber-50 text-amber-700 text-xs rounded border border-amber-100 font-medium">
                           ⚠ {riskReason} (绝密)
                        </span>
                      ) : (
                        student.publicTags.map((tag, idx) => (
                          <span key={idx} className={`px-2 py-1 text-xs rounded border ${getTagColorClass(tag.color)}`}>
                            {tag.label}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-slate-400 group-hover:text-blue-600 transition-colors flex items-center ml-auto">
                      详情 <ChevronRight size={16} />
                    </button>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Student Modal */}
      {isAddingStudent && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">添加新学生档案</h3>
              <button onClick={() => setIsAddingStudent(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* ID Input */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">学号 (唯一标识)</label>
                <input 
                  type="text" 
                  value={newStudentData.id}
                  onChange={e => setNewStudentData({...newStudentData, id: e.target.value})}
                  placeholder="例如: 20230101"
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">姓名</label>
                <input 
                  type="text" 
                  value={newStudentData.name}
                  onChange={e => setNewStudentData({...newStudentData, name: e.target.value})}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">班级</label>
                <input 
                  type="text" 
                  value={newStudentData.classId}
                  onChange={e => setNewStudentData({...newStudentData, classId: e.target.value})}
                  placeholder="例如: 三年二班"
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                   <label className="text-xs font-bold text-slate-500 uppercase block mb-1">性别</label>
                   <select 
                      value={newStudentData.gender}
                      onChange={e => setNewStudentData({...newStudentData, gender: e.target.value as any})}
                      className="w-full p-2 border border-slate-200 rounded-lg"
                   >
                     <option value="Male">男</option>
                     <option value="Female">女</option>
                   </select>
                </div>
                 <div className="flex-1">
                   <label className="text-xs font-bold text-slate-500 uppercase block mb-1">住宿情况</label>
                   <select 
                      value={newStudentData.isBoarder ? 'yes' : 'no'}
                      onChange={e => setNewStudentData({...newStudentData, isBoarder: e.target.value === 'yes' })}
                      className="w-full p-2 border border-slate-200 rounded-lg"
                   >
                     <option value="no">走读</option>
                     <option value="yes">住宿</option>
                   </select>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button 
                onClick={() => setIsAddingStudent(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-medium"
              >
                取消
              </button>
              <button 
                onClick={handleCreateStudent}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
              >
                创建档案
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;