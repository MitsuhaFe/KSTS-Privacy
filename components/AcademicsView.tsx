import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { GraduationCap, TrendingDown, AlertCircle, Table, BarChart3, Download, Upload, Filter, Search, FileSpreadsheet, ArrowUpDown, ArrowUp, ArrowDown, Radar as RadarIcon, Calendar, School, FileText } from 'lucide-react';
import { MOCK_CLASS_STATS, MOCK_GRADES } from '../constants';
import { Role, GradeRecord, Student } from '../types';

interface AcademicsViewProps {
  currentRole: Role;
  onSelectStudent: (id: string) => void;
  studentsData: Student[];
}

// Helper Type for Sorting
type SortKey = 'studentId' | 'studentName' | 'classId' | 'subject' | 'examName' | 'score' | 'date';
type SortDirection = 'asc' | 'desc';

const AcademicsView: React.FC<AcademicsViewProps> = ({ currentRole, onSelectStudent, studentsData }) => {
  const isLeader = currentRole === 'LEADER' || currentRole === 'HEADMASTER';
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  
  // Table View State
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterExam, setFilterExam] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('all');
  const [filterStudentName, setFilterStudentName] = useState<string>('');
  const [globalGrades, setGlobalGrades] = useState<GradeRecord[]>(MOCK_GRADES);

  // Radar Chart Filter State
  const [radarFilterGrade, setRadarFilterGrade] = useState<string>('all'); // '三年'
  const [radarFilterClass, setRadarFilterClass] = useState<string>('all'); // '二班'
  const [radarFilterExam, setRadarFilterExam] = useState<string>('average'); // New Exam Filter

  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>(null);

  // Identify students with recent drops (mock logic)
  const studentsWithDrops = studentsData.filter(s => s.id === 's1'); 

  // Unique values for dropdowns (Table View)
  const uniqueSubjects = useMemo(() => Array.from(new Set(globalGrades.map(g => g.subject))), [globalGrades]);
  const uniqueExams = useMemo(() => Array.from(new Set(globalGrades.map(g => g.examName))), [globalGrades]);
  const uniqueDates = useMemo(() => Array.from(new Set(globalGrades.map(g => g.date))).sort().reverse(), [globalGrades]);
  const uniqueClasses = useMemo(() => Array.from(new Set(studentsData.map(s => s.classId))).sort(), [studentsData]);

  // Derived Data for Table
  const filteredGrades = useMemo(() => {
    let result = globalGrades.filter(grade => {
      const student = studentsData.find(s => s.id === grade.studentId);
      
      const matchesSubject = filterSubject === 'all' || grade.subject === filterSubject;
      const matchesExam = filterExam === 'all' || grade.examName === filterExam;
      const matchesDate = filterDate === 'all' || grade.date === filterDate;
      const matchesClass = filterClass === 'all' || (student?.classId === filterClass);
      const matchesName = filterStudentName === '' || (student?.name.includes(filterStudentName) || false);
      
      return matchesSubject && matchesName && matchesExam && matchesDate && matchesClass;
    }).map(grade => {
      const student = studentsData.find(s => s.id === grade.studentId);
      return {
        ...grade,
        studentName: student?.name || 'Unknown',
        classId: student?.classId || 'Unknown'
      };
    });

    // Apply Sorting
    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
      // Default Sort by Date Descending
      result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    return result;
  }, [globalGrades, filterSubject, filterExam, filterDate, filterClass, filterStudentName, studentsData, sortConfig]);

  // Derived Data for School-wide Radar Chart
  const schoolRadarData = useMemo(() => {
    // 1. Filter Students based on Grade/Class selection
    const relevantStudents = studentsData.filter(s => {
      if (radarFilterGrade !== 'all' && !s.classId.includes(radarFilterGrade)) return false;
      if (radarFilterClass !== 'all' && !s.classId.includes(radarFilterClass)) return false;
      return true;
    });
    
    const relevantStudentIds = relevantStudents.map(s => s.id);

    // 2. Filter Grades for these students
    let relevantGrades = globalGrades.filter(g => relevantStudentIds.includes(g.studentId));

    // 3. Apply Exam Filter
    if (radarFilterExam !== 'average') {
      relevantGrades = relevantGrades.filter(g => g.examName === radarFilterExam);
    }

    // 4. Group by subject and calculate average
    const subjectSums: {[key: string]: { sum: number, count: number }} = {};
    
    // Iterate over relevant grades to determine the subject dimensions dynamically
    relevantGrades.forEach(g => {
        if (!subjectSums[g.subject]) {
            subjectSums[g.subject] = { sum: 0, count: 0 };
        }
        subjectSums[g.subject].sum += g.score;
        subjectSums[g.subject].count += 1;
    });

    return Object.keys(subjectSums).map(subject => ({
        subject,
        average: subjectSums[subject].count > 0 ? Math.round(subjectSums[subject].sum / subjectSums[subject].count) : 0,
        fullMark: 100
    }));

  }, [studentsData, globalGrades, radarFilterGrade, radarFilterClass, radarFilterExam]);

  // Handlers
  const handleSort = (key: SortKey) => {
    let direction: SortDirection = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleExport = () => {
    // 1. Generate CSV Content
    const headers = ['学号', '学生姓名', '班级', '科目', '考试名称', '分数', '日期'];
    const rows = filteredGrades.map(g => [
      g.studentId, // Added Student ID to export
      g.studentName,
      g.classId,
      g.subject,
      g.examName,
      g.score,
      g.date
    ]);
    
    // Add BOM (\uFEFF) so Excel opens UTF-8 correctly
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    // 2. Create Blob
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // 3. Create Download Link
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    // Generate Filename
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const scope = filterStudentName ? `_${filterStudentName}` : filterSubject !== 'all' ? `_${filterSubject}` : '_全校';
    link.setAttribute('href', url);
    link.setAttribute('download', `KSTS_成绩导出${scope}_${timestamp}.csv`);
    
    // 4. Trigger Download
    document.body.appendChild(link);
    link.click();
    
    // 5. Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    // Simulate file input click
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv, .xlsx';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        // Simulate processing delay
        setTimeout(() => {
           window.alert(`成功导入文件 "${file.name}"。新增 128 条成绩记录。`);
           // In a real app, we would parse and update globalGrades here
        }, 800);
      }
    };
    input.click();
  };

  // Helper for Sort Icon
  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortConfig?.key !== columnKey) return <ArrowUpDown size={14} className="ml-1 text-slate-300 opacity-0 group-hover:opacity-100" />;
    return sortConfig.direction === 'asc' ? <ArrowUp size={14} className="ml-1 text-indigo-500" /> : <ArrowDown size={14} className="ml-1 text-indigo-500" />;
  };

  const SortableHeader = ({ label, columnKey }: { label: string, columnKey: SortKey }) => (
    <th 
      className="px-6 py-4 cursor-pointer group hover:bg-slate-100 transition-colors select-none"
      onClick={() => handleSort(columnKey)}
    >
      <div className="flex items-center whitespace-nowrap">
        {label}
        <SortIcon columnKey={columnKey} />
      </div>
    </th>
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto animate-fade-in space-y-8 pb-20">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <GraduationCap className="text-indigo-600" />
            教务分析大屏
          </h1>
          <p className="text-slate-500 mt-1">
            全校学科成绩概览、归因分析及数据管理。
          </p>
        </div>
        
        {/* Toggle & Actions */}
        <div className="flex items-center gap-3">
           <div className="bg-white border border-slate-200 rounded-lg p-1 flex">
              <button 
                onClick={() => setViewMode('chart')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'chart' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <BarChart3 size={16} /> 图表分析
              </button>
              <button 
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'table' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Table size={16} /> 成绩管理
              </button>
           </div>
           
           {/* Admin Actions */}
           <div className="flex gap-2">
             <button 
                onClick={handleImport}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium transition-colors shadow-sm"
             >
               <Upload size={16} /> 导入
             </button>
             <button 
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
             >
               <Download size={16} /> 导出
             </button>
           </div>
        </div>
      </div>

      {/* --- CHART VIEW MODE --- */}
      {viewMode === 'chart' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Top Row: Main Charts (Radar & Bar) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Chart 1: Radar Chart for Grade/Class Analysis */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
              <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                 <h3 className="font-bold text-slate-700 flex items-center gap-2">
                    <RadarIcon className="text-purple-500" size={18} />
                    学科均衡度分析
                 </h3>
                 <div className="flex flex-wrap gap-2">
                    <select 
                       className="text-xs border border-slate-200 rounded p-1 focus:ring-1 focus:ring-purple-200 outline-none"
                       value={radarFilterExam}
                       onChange={e => setRadarFilterExam(e.target.value)}
                    >
                       <option value="average">所有考试平均</option>
                       {uniqueExams.map(ex => <option key={ex} value={ex}>{ex}</option>)}
                    </select>
                    <select 
                       className="text-xs border border-slate-200 rounded p-1 focus:ring-1 focus:ring-purple-200 outline-none"
                       value={radarFilterGrade}
                       onChange={e => setRadarFilterGrade(e.target.value)}
                    >
                       <option value="all">全年级</option>
                       <option value="三年">三年级</option>
                    </select>
                    <select 
                       className="text-xs border border-slate-200 rounded p-1 focus:ring-1 focus:ring-purple-200 outline-none"
                       value={radarFilterClass}
                       onChange={e => setRadarFilterClass(e.target.value)}
                    >
                       <option value="all">所有班级</option>
                       <option value="一班">一班</option>
                       <option value="二班">二班</option>
                       <option value="三班">三班</option>
                    </select>
                 </div>
              </div>
              
              <div className="flex-1 w-full min-h-[250px]">
                  {schoolRadarData.length > 2 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={schoolRadarData}>
                        <PolarGrid gridType="polygon" />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#64748b' }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar
                          name={radarFilterExam === 'average' ? '平均分' : radarFilterExam}
                          dataKey="average"
                          stroke="#8b5cf6"
                          strokeWidth={2}
                          fill="#a78bfa"
                          fillOpacity={0.5}
                        />
                         <Tooltip 
                             contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                             itemStyle={{ color: '#6d28d9', fontWeight: 'bold' }}
                           />
                      </RadarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                        <RadarIcon size={32} className="mb-2 opacity-20" />
                        当前筛选条件下数据不足以生成维度图
                    </div>
                  )}
              </div>
              <div className="text-center text-xs text-slate-400 mt-2">
                 显示选定范围内的学科平均分维度
              </div>
            </div>

            {/* Chart 2: Grade Distribution Trend */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
              <h3 className="font-bold text-slate-700 mb-4">学期优良率趋势</h3>
              <div className="flex-1 w-full min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[
                    { month: '9月', rate: 45 }, { month: '10月', rate: 48 }, { month: '11月', rate: 42 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip contentStyle={{ borderRadius: '8px' }}/>
                    <Line type="monotone" dataKey="rate" name="优秀率(%)" stroke="#10b981" strokeWidth={3} dot={{r:4}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Bottom Section: Anomaly Detection */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <TrendingDown className="text-red-500" size={20} />
                成绩异常波动名单 (需重点关注)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                系统自动检测单科成绩下滑超过 15 分或排名下降超过 20 名的学生。
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="px-6 py-4 font-semibold">学生</th>
                    <th className="px-6 py-4 font-semibold">异常科目</th>
                    <th className="px-6 py-4 font-semibold">波动幅度</th>
                    <th className="px-6 py-4 font-semibold w-1/3">
                      {isLeader ? '智能归因 (隐私关联)' : '建议操作'}
                    </th>
                    <th className="px-6 py-4 font-semibold text-right">档案</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {studentsWithDrops.map(student => (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={student.avatar} className="w-8 h-8 rounded-full" alt="" />
                          <span className="font-medium text-slate-700">{student.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">数学</td>
                      <td className="px-6 py-4">
                        <span className="text-red-600 font-bold bg-red-50 px-2 py-1 rounded text-xs flex w-fit items-center gap-1">
                          <TrendingDown size={12} /> -18分
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {isLeader ? (
                          <div className="flex items-start gap-2 text-sm text-amber-900 bg-amber-50 p-2 rounded-lg border border-amber-100">
                            <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-600" />
                            <span>检测到高风险家庭变故（父母离异），时间点与成绩下滑高度重合。</span>
                          </div>
                        ) : (
                          <div className="text-sm text-slate-500">
                            建议安排课后辅导，并询问近期课堂状态。
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => onSelectStudent(student.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          查看详情
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TABLE VIEW MODE --- */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-slide-up">
           {/* Filter Bar */}
           <div className="p-4 border-b border-slate-50 bg-slate-50/30 flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto flex-wrap">
                 {/* Filter Group */}
                 <div className="flex items-center gap-2 bg-white px-3 py-2 border border-slate-200 rounded-lg shadow-sm">
                    <School size={16} className="text-slate-400 shrink-0" />
                    <select 
                      value={filterClass}
                      onChange={(e) => setFilterClass(e.target.value)}
                      className="bg-transparent border-none text-sm text-slate-700 focus:ring-0 outline-none cursor-pointer w-full sm:w-auto"
                    >
                       <option value="all">所有班级</option>
                       {uniqueClasses.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                    </select>
                 </div>

                 <div className="flex items-center gap-2 bg-white px-3 py-2 border border-slate-200 rounded-lg shadow-sm">
                    <Filter size={16} className="text-slate-400 shrink-0" />
                    <select 
                      value={filterSubject}
                      onChange={(e) => setFilterSubject(e.target.value)}
                      className="bg-transparent border-none text-sm text-slate-700 focus:ring-0 outline-none cursor-pointer w-full sm:w-auto"
                    >
                       <option value="all">所有科目</option>
                       {uniqueSubjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                    </select>
                 </div>

                 <div className="flex items-center gap-2 bg-white px-3 py-2 border border-slate-200 rounded-lg shadow-sm">
                    <FileText size={16} className="text-slate-400 shrink-0" />
                    <select 
                      value={filterExam}
                      onChange={(e) => setFilterExam(e.target.value)}
                      className="bg-transparent border-none text-sm text-slate-700 focus:ring-0 outline-none cursor-pointer w-full sm:w-auto"
                    >
                       <option value="all">所有考试</option>
                       {uniqueExams.map(ex => <option key={ex} value={ex}>{ex}</option>)}
                    </select>
                 </div>

                 <div className="flex items-center gap-2 bg-white px-3 py-2 border border-slate-200 rounded-lg shadow-sm">
                    <Calendar size={16} className="text-slate-400 shrink-0" />
                    <select 
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      className="bg-transparent border-none text-sm text-slate-700 focus:ring-0 outline-none cursor-pointer w-full sm:w-auto"
                    >
                       <option value="all">所有日期</option>
                       {uniqueDates.map(date => <option key={date} value={date}>{date}</option>)}
                    </select>
                 </div>

                 <div className="relative w-full sm:w-48">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text"
                      value={filterStudentName}
                      onChange={(e) => setFilterStudentName(e.target.value)}
                      placeholder="搜索学生姓名..."
                      className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all shadow-sm"
                    />
                 </div>
              </div>
              
              <div className="text-xs text-slate-400 whitespace-nowrap self-end xl:self-center">
                 共 {filteredGrades.length} 条记录
              </div>
           </div>

           {/* Data Table */}
           <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase font-semibold">
                   <SortableHeader label="学号" columnKey="studentId" />
                   <SortableHeader label="学生姓名" columnKey="studentName" />
                   <SortableHeader label="班级" columnKey="classId" />
                   <SortableHeader label="科目" columnKey="subject" />
                   <SortableHeader label="考试名称" columnKey="examName" />
                   <SortableHeader label="分数" columnKey="score" />
                   <SortableHeader label="考试日期" columnKey="date" />
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                 {filteredGrades.map((grade) => (
                   <tr key={grade.id} className="hover:bg-slate-50/50 transition-colors">
                     <td className="px-6 py-3 text-sm text-slate-500 font-mono">{grade.studentId}</td>
                     <td className="px-6 py-3 font-medium text-slate-700">{grade.studentName}</td>
                     <td className="px-6 py-3 text-sm text-slate-500">{grade.classId}</td>
                     <td className="px-6 py-3 text-sm text-slate-600">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-xs">{grade.subject}</span>
                     </td>
                     <td className="px-6 py-3 text-sm text-slate-600">{grade.examName}</td>
                     <td className="px-6 py-3">
                        <span className={`font-bold ${grade.score < 60 ? 'text-red-500' : grade.score >= 90 ? 'text-green-600' : 'text-slate-700'}`}>
                           {grade.score}
                        </span>
                     </td>
                     <td className="px-6 py-3 text-sm text-slate-400 font-mono">{grade.date}</td>
                   </tr>
                 ))}
                 
                 {filteredGrades.length === 0 && (
                    <tr>
                       <td colSpan={7} className="px-6 py-12 text-center text-slate-400 flex flex-col items-center justify-center">
                          <FileSpreadsheet className="mb-2 opacity-30" size={40} />
                          没有找到符合条件的成绩记录
                       </td>
                    </tr>
                 )}
               </tbody>
             </table>
           </div>
        </div>
      )}

    </div>
  );
};

export default AcademicsView;