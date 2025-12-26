import React, { useState, useMemo } from 'react';
import { 
  User, MapPin, Shield, AlertTriangle, BookOpen, 
  Activity, Lock, Unlock, Plus, Send, X, Tag, FileText, AlertCircle, Save, TrendingDown, Edit2, Sparkles, Radar as RadarIcon
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ReferenceLine, Label, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { Student, Role, SecurityLevel, LogEntry, GradeRecord, StudentTag } from '../types';
import { MOCK_LOGS, MOCK_GRADES } from '../constants';

interface StudentProfileProps {
  student: Student;
  currentRole: Role;
  onBack: () => void;
  onUpdateStudent: (s: Student) => void;
}

// Preset Tags Constants
const QUICK_TAGS_PUBLIC = ['#上课走神', '#作业缺交', '#课堂活跃', '#作业优秀', '#进步明显', '#迟到早退', '#未带课本'];
const QUICK_TAGS_CONFIDENTIAL = ['#家庭变故', '#谈心谈话', '#情绪低落', '#家校沟通', '#心理危机', '#打架违纪', '#早恋倾向'];

const StudentProfile: React.FC<StudentProfileProps> = ({ student, currentRole, onBack, onUpdateStudent }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'confidential'>('general');
  const [logs, setLogs] = useState<LogEntry[]>(MOCK_LOGS);
  
  // Confidential Profile Edit State
  const [isEditingConfidential, setIsEditingConfidential] = useState(false);
  const [editFormData, setEditFormData] = useState({
    economicStatus: student.familyBackground?.economicStatus || 'Average',
    guardianContact: student.familyBackground?.guardianContact || '',
    familyNotes: student.familyBackground?.notes || '',
    psychStatus: student.psychProfile?.status || 'Healthy',
    psychNotes: student.psychProfile?.notes || ''
  });

  // Academic State
  const [grades, setGrades] = useState<GradeRecord[]>(
    MOCK_GRADES.filter(g => g.studentId === student.id)
  );
  
  const [selectedSubject, setSelectedSubject] = useState<string>('数学');
  const [isAddingGrade, setIsAddingGrade] = useState(false);
  const [newGradeData, setNewGradeData] = useState({ examName: '', score: '', date: '' });

  // Radar Chart Filter State
  const [radarExamFilter, setRadarExamFilter] = useState<string>('average');

  // Log Input State
  const [isWritingLog, setIsWritingLog] = useState(false);
  const [newLogContent, setNewLogContent] = useState('');
  const [newLogType, setNewLogType] = useState<'Behavior' | 'Homework' | 'Intervention' | 'Psych'>('Behavior');
  const [isConfidentialInput, setIsConfidentialInput] = useState(false);
  
  // Tagging System State
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');

  // Student Tags Edit State
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [newTagLabel, setNewTagLabel] = useState('');
  const [newTagColor, setNewTagColor] = useState<StudentTag['color']>('blue');

  // Privacy Logic
  const canAccessConfidential = currentRole === 'HEADMASTER' || currentRole === 'LEADER';
  
  // 1. Visible Logs Filtering
  const visibleLogs = useMemo(() => logs.filter(log => 
    log.studentId === student.id && 
    (log.securityLevel === SecurityLevel.PUBLIC || canAccessConfidential)
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [logs, student.id, canAccessConfidential]);

  // 2. Chart Data Preparation
  const availableSubjects = useMemo(() => Array.from(new Set(grades.map(g => g.subject))), [grades]);
  const availableExams = useMemo(() => Array.from(new Set(grades.map(g => g.examName))), [grades]);
  
  const chartData = useMemo(() => {
    return grades
      .filter(g => g.subject === selectedSubject)
      .map(g => ({
        ...g,
        timestamp: new Date(g.date).getTime(),
        formattedDate: g.date.substring(5) // MM-DD
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [grades, selectedSubject]);

  // Radar Data Logic: Dynamic dimensions based on filtered grades
  const radarData = useMemo(() => {
    // 1. Determine which grades to use based on filter
    let filteredGrades = grades;
    if (radarExamFilter !== 'average') {
      filteredGrades = grades.filter(g => g.examName === radarExamFilter);
    }

    // 2. Calculate scores
    const subjectScores: {[key: string]: { sum: number, count: number }} = {};
    
    // Iterate over filtered grades to determine the subject dimensions dynamically
    filteredGrades.forEach(g => {
      if (!subjectScores[g.subject]) {
        subjectScores[g.subject] = { sum: 0, count: 0 };
      }
      subjectScores[g.subject].sum += g.score;
      subjectScores[g.subject].count += 1;
    });

    return Object.keys(subjectScores).map(subject => {
      const { sum, count } = subjectScores[subject];
      const score = count > 0 ? Math.round(sum / count) : 0;
      return {
        subject,
        A: score,
        fullMark: 100,
      };
    });
  }, [grades, radarExamFilter]);

  // 3. Intelligent Correlation Logic
  const correlationInsights = useMemo(() => {
    const insights: { date: string, timestamp: number, drop: number, relatedLogs: LogEntry[] }[] = [];
    
    for (let i = 1; i < chartData.length; i++) {
      const prev = chartData[i-1];
      const curr = chartData[i];
      const drop = prev.score - curr.score;
      
      if (drop >= 10) {
        const examDate = curr.timestamp;
        const related = visibleLogs.filter(log => {
          const logDate = new Date(log.date).getTime();
          const diffDays = (examDate - logDate) / (1000 * 3600 * 24);
          return diffDays >= 0 && diffDays <= 20; 
        });

        if (related.length > 0) {
          insights.push({
            date: curr.date,
            timestamp: curr.timestamp,
            drop,
            relatedLogs: related
          });
        }
      }
    }
    return insights;
  }, [chartData, visibleLogs]);

  // --- Handlers ---

  const handleSaveConfidential = () => {
    const updatedStudent: Student = {
      ...student,
      familyBackground: {
        economicStatus: editFormData.economicStatus as any,
        guardianContact: editFormData.guardianContact,
        notes: editFormData.familyNotes
      },
      psychProfile: {
        ...student.psychProfile,
        status: editFormData.psychStatus as any,
        notes: editFormData.psychNotes,
        lastAssessment: student.psychProfile?.lastAssessment || ''
      }
    };
    onUpdateStudent(updatedStudent);
    setIsEditingConfidential(false);
  };

  const handleAddStudentTag = () => {
    if(!newTagLabel) return;
    const newTag: StudentTag = { label: newTagLabel, color: newTagColor };
    const updatedStudent = {
       ...student,
       publicTags: [...student.publicTags, newTag]
    };
    onUpdateStudent(updatedStudent);
    setNewTagLabel('');
  };

  const handleRemoveStudentTag = (idx: number) => {
    const updatedTags = [...student.publicTags];
    updatedTags.splice(idx, 1);
    const updatedStudent = { ...student, publicTags: updatedTags };
    onUpdateStudent(updatedStudent);
  };

  const handleAddGrade = () => {
    if (!newGradeData.examName || !newGradeData.score || !newGradeData.date) return;
    const newGrade: GradeRecord = {
      id: `g${Date.now()}`,
      studentId: student.id,
      subject: selectedSubject,
      score: Number(newGradeData.score),
      date: newGradeData.date,
      examName: newGradeData.examName
    };
    setGrades([...grades, newGrade]);
    setIsAddingGrade(false);
    setNewGradeData({ examName: '', score: '', date: '' });
  };

  const handleAddLogTag = (tag: string) => {
    if (!tag) return;
    const formattedTag = tag.startsWith('#') ? tag : `#${tag}`;
    if (!activeTags.includes(formattedTag)) {
      setActiveTags([...activeTags, formattedTag]);
    }
    setCustomTagInput('');
  };

  const removeLogTag = (tagToRemove: string) => {
    setActiveTags(activeTags.filter(t => t !== tagToRemove));
  };

  const handleAddLog = () => {
    if (!newLogContent.trim()) return;

    // Requirement: Do NOT automatically add system tags like #深度干预 or #日常记录
    const finalTags = Array.from(new Set([...activeTags]));

    const newLog: LogEntry = {
      id: `l${Date.now()}`,
      studentId: student.id,
      date: new Date().toISOString().split('T')[0],
      type: newLogType,
      content: newLogContent,
      tags: finalTags,
      securityLevel: isConfidentialInput ? SecurityLevel.CONFIDENTIAL : SecurityLevel.PUBLIC,
      author: currentRole === 'TEACHER' ? '王老师' : '李校长',
    };

    setLogs([newLog, ...logs]);
    // Reset Form
    setNewLogContent('');
    setActiveTags([]);
    setIsWritingLog(false);
  };

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

  // --- Helpers for Display ---
  const getPsychStatusDisplay = (status: string | undefined) => {
     if (status === 'Critical') return { label: '高危', class: 'bg-red-100 text-red-700 font-bold' };
     if (status === 'At Risk') return { label: '需关注', class: 'bg-orange-100 text-orange-700' };
     return { label: '健康', class: 'bg-green-100 text-green-700' };
  };

  // --- Custom Tooltip Component ---
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const currentTimestamp = label;
      const score = payload[0].value;
      const dataPoint = chartData.find(d => d.timestamp === currentTimestamp);
      const dateStr = dataPoint ? dataPoint.date : new Date(currentTimestamp).toLocaleDateString();
      const examName = dataPoint ? dataPoint.examName : '未知考试';

      const insight = correlationInsights.find(i => i.timestamp === currentTimestamp);

      return (
        <div className="bg-white p-4 border border-slate-100 shadow-xl rounded-xl text-sm z-50 max-w-xs animate-fade-in">
          <p className="font-bold text-slate-800 mb-0.5">{examName}</p>
          <p className="text-xs text-slate-400 mb-2">{dateStr}</p>
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-500">分数:</span>
            <span className={`font-bold text-lg ${score < 60 ? 'text-red-500' : 'text-blue-600'}`}>{score}分</span>
          </div>
          
          {insight ? (
             <div className="border-t border-slate-100 pt-2 mt-2 bg-amber-50/50 -mx-4 px-4 pb-2 -mb-4 rounded-b-xl">
               <div className="flex items-center gap-1 text-amber-700 font-bold mb-1.5 text-xs">
                  <AlertCircle size={12} />
                  <span>智能归因: 关联记录 ({insight.relatedLogs.length})</span>
               </div>
               <div className="space-y-1.5">
                 {insight.relatedLogs.map(l => (
                   <div key={l.id} className="text-xs text-slate-600 flex items-start gap-1">
                      <span className="mt-0.5">•</span>
                      <span className="line-clamp-2">{l.content}</span>
                   </div>
                 ))}
               </div>
             </div>
          ) : (
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
               <Shield size={10} /> 无关联异常记录
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const psychDisplay = getPsychStatusDisplay(student.psychProfile?.status);

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto animate-fade-in pb-10">
      {/* Header / Nav */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2 cursor-pointer text-slate-500 hover:text-slate-800 transition-colors" onClick={onBack}>
          <span className="text-sm font-medium">← 返回仪表盘</span>
        </div>
        <div className="text-xs text-slate-400">
           当前查看权限: <span className="font-bold">{currentRole === 'TEACHER' ? '普通 (表层数据)' : '高级 (全维数据)'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Identity & Access */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Basic Info Card (Layer 1 - Public) */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-blue-50 to-indigo-50 z-0"></div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-24 h-24 rounded-full border-4 border-white shadow-md overflow-hidden mb-4">
                <img src={student.avatar} alt={student.name} className="w-full h-full object-cover" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">{student.name}</h2>
              <p className="text-slate-500 text-sm mb-4">{student.classId}</p>
              
              <div className="flex flex-wrap gap-2 justify-center mb-6 relative">
                 {/* Student Tags Display */}
                {student.publicTags.map((tag, idx) => (
                  <span key={idx} className={`px-3 py-1 text-xs rounded-full font-medium border flex items-center gap-1 ${getTagColorClass(tag.color)}`}>
                    {tag.label}
                    {isEditingTags && <button onClick={() => handleRemoveStudentTag(idx)} className="ml-1 hover:text-red-700 font-bold">×</button>}
                  </span>
                ))}
                
                {/* Add/Edit Tags Trigger */}
                <button 
                  onClick={() => setIsEditingTags(!isEditingTags)} 
                  className="px-2 py-1 bg-slate-50 text-slate-400 rounded-full hover:bg-slate-100 transition-colors text-xs"
                >
                   {isEditingTags ? '完成' : '+ 标签'}
                </button>
              </div>

              {/* Tag Editor Panel */}
              {isEditingTags && (
                 <div className="mb-4 w-full bg-slate-50 p-3 rounded-lg border border-slate-200 animate-slide-down">
                    <div className="flex gap-2 mb-2">
                       <input 
                         type="text" 
                         value={newTagLabel}
                         onChange={e => setNewTagLabel(e.target.value)}
                         placeholder="标签名称"
                         className="flex-1 p-1 text-xs border rounded"
                       />
                       <select 
                         value={newTagColor}
                         onChange={e => setNewTagColor(e.target.value as any)}
                         className="text-xs border rounded p-1"
                       >
                          <option value="blue">蓝</option>
                          <option value="green">绿</option>
                          <option value="red">红</option>
                          <option value="amber">黄</option>
                          <option value="purple">紫</option>
                       </select>
                    </div>
                    <button onClick={handleAddStudentTag} className="w-full bg-indigo-600 text-white text-xs py-1 rounded">添加标签</button>
                 </div>
              )}

              {student.isBoarder && (
                   <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs rounded-full font-medium flex items-center gap-1">
                     <MapPin size={10} /> 住宿生
                   </span>
              )}

              <div className="w-full grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 mt-2">
                <div className="text-center">
                  <div className="text-xs text-slate-400 uppercase tracking-wider">平均成绩</div>
                  <div className="text-lg font-bold text-slate-700">78分</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-slate-400 uppercase tracking-wider">出勤率</div>
                  <div className="text-lg font-bold text-green-600">92%</div>
                </div>
              </div>
            </div>
          </div>

          {/* Confidential Access Card (Layer 2 - Restricted) */}
          <div className={`rounded-2xl p-6 shadow-sm border transition-all duration-300 ${activeTab === 'confidential' ? 'bg-amber-50 border-amber-200 ring-2 ring-amber-100' : 'bg-white border-slate-100'}`}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${activeTab === 'confidential' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                  <Shield size={20} />
                </div>
                <div>
                  <h3 className={`font-semibold ${activeTab === 'confidential' ? 'text-amber-900' : 'text-slate-700'}`}>绝密档案袋 (里层)</h3>
                  <p className="text-xs text-slate-400">权限等级: 高级</p>
                </div>
              </div>
              {activeTab === 'confidential' && <Lock size={16} className="text-amber-600" />}
            </div>

            {canAccessConfidential ? (
              <button 
                onClick={() => setActiveTab(activeTab === 'confidential' ? 'general' : 'confidential')}
                className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  activeTab === 'confidential' 
                    ? 'bg-amber-200 text-amber-900 hover:bg-amber-300' 
                    : 'bg-slate-800 text-white hover:bg-slate-700'
                }`}
              >
                {activeTab === 'confidential' ? '关闭绝密档案' : '查阅绝密档案'}
                {activeTab === 'confidential' ? <Unlock size={14} /> : <Lock size={14} />}
              </button>
            ) : (
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                 <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
                   <Lock size={12} />
                   仅限班主任/校领导查看
                 </p>
              </div>
            )}
          </div>

          {/* Confidential Details Panel */}
          {activeTab === 'confidential' && canAccessConfidential && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 animate-slide-up relative">
              <div className="flex justify-between items-center mb-4">
                 <h4 className="text-amber-900 font-bold flex items-center gap-2">
                   <AlertTriangle size={16} />
                   敏感信息
                 </h4>
                 {/* EDIT BUTTON for Headmaster/Leader */}
                 {!isEditingConfidential && (
                    <button 
                      onClick={() => setIsEditingConfidential(true)} 
                      className="text-amber-700 hover:text-amber-900 bg-amber-200/50 p-1.5 rounded-lg"
                    >
                       <Edit2 size={14} />
                    </button>
                 )}
              </div>
              
              <div className="space-y-4">
                {/* Family Section */}
                <div className="bg-white/60 p-3 rounded-lg">
                  <span className="text-xs font-bold text-amber-800 uppercase block mb-1">家庭背景画像</span>
                  
                  {isEditingConfidential ? (
                    <div className="space-y-2">
                       <select 
                         value={editFormData.economicStatus} 
                         onChange={e => setEditFormData({...editFormData, economicStatus: e.target.value as 'Difficult' | 'Average' | 'Affluent'})}
                         className="w-full text-sm p-1 border border-amber-200 rounded"
                       >
                          <option value="Difficult">困难</option>
                          <option value="Average">一般</option>
                          <option value="Affluent">优渥</option>
                       </select>
                       <input 
                         type="text"
                         value={editFormData.guardianContact}
                         onChange={e => setEditFormData({...editFormData, guardianContact: e.target.value})}
                         className="w-full text-sm p-1 border border-amber-200 rounded"
                         placeholder="监护人电话"
                       />
                       <textarea 
                          value={editFormData.familyNotes}
                          onChange={e => setEditFormData({...editFormData, familyNotes: e.target.value})}
                          className="w-full text-sm p-1 border border-amber-200 rounded h-16"
                          placeholder="家庭备注"
                       />
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-slate-600">经济状况:</span>
                        <span className="text-sm font-medium text-slate-800 bg-amber-100 px-2 rounded">
                          {student.familyBackground?.economicStatus === 'Difficult' ? '困难' : student.familyBackground?.economicStatus === 'Affluent' ? '优渥' : '一般'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-slate-600">监护人电话:</span>
                        <span className="text-sm font-medium text-slate-800">{student.familyBackground?.guardianContact}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed italic border-t border-amber-100 pt-2">
                        备注: "{student.familyBackground?.notes}"
                      </p>
                    </>
                  )}
                </div>

                {/* Psych Section */}
                <div className="bg-white/60 p-3 rounded-lg">
                  <span className="text-xs font-bold text-amber-800 uppercase block mb-1">心理健康档案</span>
                  
                  {isEditingConfidential ? (
                     <div className="space-y-2">
                        <select 
                          value={editFormData.psychStatus} 
                          onChange={e => setEditFormData({...editFormData, psychStatus: e.target.value as 'Healthy' | 'At Risk' | 'Critical'})}
                          className="w-full text-sm p-1 border border-amber-200 rounded"
                        >
                            <option value="Healthy">健康</option>
                            <option value="At Risk">需关注</option>
                            <option value="Critical">高危</option>
                        </select>
                         <textarea 
                          value={editFormData.psychNotes}
                          onChange={e => setEditFormData({...editFormData, psychNotes: e.target.value})}
                          className="w-full text-sm p-1 border border-amber-200 rounded h-16"
                          placeholder="心理评估备注"
                       />
                     </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-slate-600">当前状态:</span>
                        <span className={`text-sm font-medium px-2 rounded ${psychDisplay.class}`}>
                          {psychDisplay.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed italic border-t border-amber-100 pt-2">
                        评估记录: "{student.psychProfile?.notes}"
                      </p>
                    </>
                  )}
                </div>

                {/* Save Button for Edit Mode */}
                {isEditingConfidential && (
                  <div className="flex gap-2 justify-end">
                     <button onClick={() => setIsEditingConfidential(false)} className="text-xs text-slate-500 hover:underline">取消</button>
                     <button onClick={handleSaveConfidential} className="bg-amber-600 text-white text-xs px-3 py-1 rounded shadow hover:bg-amber-700">保存档案</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Academic & Logs */}
        <div className="lg:col-span-8 space-y-6">

           {/* Module 3 & Radar Chart Combined */}
           <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {/* Radar Chart (New Feature) */}
              <div className="md:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                     <h3 className="font-bold text-slate-800 flex items-center gap-2">
                       <RadarIcon className="text-purple-500" size={20} />
                       学科能力维度
                     </h3>
                     {/* Exam Selector */}
                     <select 
                        value={radarExamFilter}
                        onChange={(e) => setRadarExamFilter(e.target.value)}
                        className="text-xs border border-slate-200 rounded p-1 max-w-[100px] outline-none focus:ring-1 focus:ring-purple-200"
                     >
                        <option value="average">所有考试平均</option>
                        {availableExams.map(ex => <option key={ex} value={ex}>{ex}</option>)}
                     </select>
                  </div>
                  <p className="text-xs text-slate-400 mb-4">
                     {radarExamFilter === 'average' ? '基于所有历史考试的平均表现' : `基于 "${radarExamFilter}" 的单次表现`}
                  </p>
                  
                  <div className="flex-1 min-h-[240px] w-full">
                     {radarData.length > 2 ? (
                       <ResponsiveContainer width="100%" height="100%">
                         <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                           <PolarGrid gridType="polygon" />
                           <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#64748b' }} />
                           <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                           <Radar
                             name={radarExamFilter === 'average' ? '平均分' : radarExamFilter}
                             dataKey="A"
                             stroke="#8b5cf6"
                             strokeWidth={2}
                             fill="#a78bfa"
                             fillOpacity={0.4}
                           />
                           <Tooltip 
                             contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                             itemStyle={{ color: '#6d28d9', fontWeight: 'bold' }}
                           />
                         </RadarChart>
                       </ResponsiveContainer>
                     ) : (
                       <div className="h-full flex items-center justify-center text-slate-400 text-xs text-center px-4">
                          数据不足，需要至少3个科目的成绩才能生成维度图
                       </div>
                     )}
                  </div>
              </div>

              {/* Module 3: Intelligent Correlation Chart */}
              <div className="md:col-span-3 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <Activity className="text-blue-500" size={20} />
                      单科趋势与归因
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                       鼠标悬停查看智能归因
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                     <select 
                        value={selectedSubject} 
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        className="bg-slate-50 border-none text-sm text-slate-600 rounded-lg p-2 focus:ring-2 focus:ring-blue-100 font-medium"
                     >
                        {availableSubjects.map(sub => (
                           <option key={sub} value={sub}>{sub}</option>
                        ))}
                     </select>
                     {!isAddingGrade && (
                        <button 
                           onClick={() => setIsAddingGrade(true)}
                           className="bg-slate-900 text-white p-2 rounded-lg hover:bg-slate-700 transition-colors"
                           title="录入成绩"
                        >
                           <Plus size={16} />
                        </button>
                     )}
                  </div>
                </div>

                {/* Grade Entry Form */}
                {isAddingGrade && (
                   <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200 animate-slide-down">
                      <div className="flex justify-between items-center mb-3">
                         <span className="text-sm font-bold text-slate-700">录入单科成绩 ({selectedSubject})</span>
                         <button onClick={() => setIsAddingGrade(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                         <input 
                            type="text" 
                            placeholder="考试名称" 
                            value={newGradeData.examName}
                            onChange={e => setNewGradeData({...newGradeData, examName: e.target.value})}
                            className="p-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400 col-span-1"
                         />
                         <input 
                            type="date" 
                            value={newGradeData.date}
                            onChange={e => setNewGradeData({...newGradeData, date: e.target.value})}
                            className="p-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400 col-span-1"
                         />
                         <div className="flex gap-2 col-span-1">
                            <input 
                               type="number" 
                               placeholder="分数" 
                               value={newGradeData.score}
                               onChange={e => setNewGradeData({...newGradeData, score: e.target.value})}
                               className="p-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400 w-full"
                            />
                            <button 
                               onClick={handleAddGrade}
                               className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                               <Save size={16} />
                            </button>
                         </div>
                      </div>
                   </div>
                )}
                
                <div className="h-64 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      
                      {/* Numeric X Axis for Time Scale */}
                      <XAxis 
                        dataKey="timestamp" 
                        type="number" 
                        domain={['dataMin - 864000000', 'dataMax + 864000000']} // Add padding (10 days)
                        tickFormatter={(unixTime) => new Date(unixTime).toLocaleDateString(undefined, {month:'numeric', day:'numeric'})}
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#94a3b8', fontSize: 12}} 
                      />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} domain={[0, 100]} />
                      
                      {/* Using Custom Tooltip */}
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }} />
                      
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        name="分数"
                        stroke="#3b82f6" 
                        strokeWidth={3} 
                        dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6 }}
                      />
                      
                      {/* Intelligent Markers: Plot Logs on Time Scale */}
                      {visibleLogs.map((log) => {
                        const logTimestamp = new Date(log.date).getTime();
                        // Check if this log is "relevant" (e.g., associated with a drop)
                        const isRelevant = correlationInsights.some(insight => insight.relatedLogs.some(r => r.id === log.id));
                        
                        return (
                          <ReferenceLine 
                            key={log.id} 
                            x={logTimestamp} 
                            stroke={isRelevant ? (log.securityLevel === SecurityLevel.CONFIDENTIAL ? '#f59e0b' : '#3b82f6') : '#cbd5e1'} 
                            strokeDasharray={isRelevant ? "3 3" : "2 2"}
                            strokeWidth={isRelevant ? 2 : 1}
                          >
                             <Label 
                                position="top" 
                                offset={10}
                                content={(props: any) => {
                                  const { viewBox } = props;
                                  const x = viewBox?.x || 0;
                                  const y = viewBox?.y || 0;
                                  return (
                                    <g transform={`translate(${x}, ${y})`}>
                                       {/* Icon based on Type */}
                                       <rect x={-10} y={-24} width={20} height={20} rx={4} fill="white" stroke={log.securityLevel === SecurityLevel.CONFIDENTIAL ? '#fcd34d' : '#e2e8f0'} />
                                       <text x={0} y={-10} textAnchor="middle" fontSize={10}>
                                          {log.securityLevel === SecurityLevel.CONFIDENTIAL ? '⚠️' : '📝'}
                                       </text>
                                    </g>
                                  );
                                }}
                             />
                          </ReferenceLine>
                        );
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
           </div>

          {/* Module 2: Dual-Track Logging Input */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
             <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <BookOpen className="text-indigo-500" size={20} />
                双轨成长日志
              </h3>
              
              {!isWritingLog && (
                <button 
                  onClick={() => setIsWritingLog(true)}
                  className="flex items-center gap-1 bg-slate-900 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-slate-700 transition-colors"
                >
                  <Plus size={16} /> 记一条
                </button>
              )}
            </div>

            {/* Input Panel with Enhanced Privacy UI */}
            {isWritingLog && (
              <div className={`mb-8 p-5 rounded-xl border-2 animate-slide-down transition-colors duration-300 relative overflow-hidden
                ${isConfidentialInput ? 'bg-amber-50 border-amber-300' : 'bg-slate-50 border-slate-200'}`}>
                
                {/* Background Pattern for Confidential */}
                {isConfidentialInput && (
                   <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                      <Shield size={120} className="text-amber-600" />
                   </div>
                )}

                <div className="flex justify-between items-center mb-4 relative z-10">
                  <div className="flex items-center gap-2">
                    {isConfidentialInput ? <Lock size={16} className="text-amber-700" /> : <FileText size={16} className="text-slate-500" />}
                    <span className={`text-sm font-bold ${isConfidentialInput ? 'text-amber-800' : 'text-slate-700'}`}>
                      {isConfidentialInput ? '绝密干预记录 (Confidential)' : '日常行为记录 (General)'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {/* Role-Based Toggle */}
                    {canAccessConfidential && (
                      <label className="flex items-center gap-2 cursor-pointer select-none group">
                        <span className={`text-xs font-medium transition-colors ${isConfidentialInput ? 'text-amber-700' : 'text-slate-400 group-hover:text-slate-600'}`}>
                          {isConfidentialInput ? '已开启加密' : '开启绝密模式'}
                        </span>
                        <div className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 flex items-center ${isConfidentialInput ? 'bg-amber-500' : 'bg-slate-300'}`} onClick={() => {
                           setIsConfidentialInput(!isConfidentialInput);
                           setNewLogType(isConfidentialInput ? 'Behavior' : 'Intervention');
                           setActiveTags([]); // Clear tags when switching modes
                        }}>
                          <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${isConfidentialInput ? 'translate-x-5' : 'translate-x-0'}`}></div>
                        </div>
                      </label>
                    )}
                    <button onClick={() => setIsWritingLog(false)} className="text-slate-400 hover:text-slate-600 bg-white/50 rounded-full p-1">
                      <X size={18} />
                    </button>
                  </div>
                </div>

                <textarea 
                  value={newLogContent}
                  onChange={(e) => setNewLogContent(e.target.value)}
                  placeholder={isConfidentialInput ? "此处记录将严格加密。请记录谈话详情、家庭背景变动或心理危机干预内容..." : "请输入学生日常表现..."}
                  className={`w-full h-28 p-4 rounded-lg border text-sm focus:ring-2 focus:outline-none resize-none mb-4 relative z-10
                    ${isConfidentialInput 
                      ? 'bg-white border-amber-200 focus:ring-amber-200 text-amber-900 placeholder-amber-300/70' 
                      : 'bg-white border-slate-200 focus:ring-blue-100'}`}
                />

                {/* Tag Selection Area */}
                <div className="mb-4 relative z-10">
                   {/* Selected Active Tags */}
                   <div className="flex flex-wrap gap-2 mb-2">
                      {activeTags.map(tag => (
                        <span key={tag} className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs border ${isConfidentialInput ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                           {tag}
                           <button onClick={() => removeLogTag(tag)} className="hover:text-red-500"><X size={10} /></button>
                        </span>
                      ))}
                   </div>
                   
                   {/* Suggested Quick Tags (New Feature) */}
                   <div className="flex flex-wrap gap-2 mb-3 items-center">
                      <span className="text-xs text-slate-400 flex items-center gap-1"><Sparkles size={10} /> 快速选择:</span>
                      {(isConfidentialInput ? QUICK_TAGS_CONFIDENTIAL : QUICK_TAGS_PUBLIC).map(tag => (
                        <button 
                          key={tag}
                          onClick={() => handleAddLogTag(tag)}
                          disabled={activeTags.includes(tag)}
                          className={`text-xs px-2 py-0.5 rounded border border-dashed transition-colors
                            ${activeTags.includes(tag) 
                               ? 'opacity-40 cursor-not-allowed border-slate-200 text-slate-400' 
                               : isConfidentialInput 
                                  ? 'border-amber-300 text-amber-700 hover:bg-amber-100 bg-white/50' 
                                  : 'border-slate-300 text-slate-600 hover:bg-slate-100 bg-white/50'}`}
                        >
                          {tag}
                        </button>
                      ))}
                   </div>

                   {/* Custom Tag Input */}
                   <div className="flex items-center gap-2">
                      <div className="relative flex-1 max-w-xs">
                         <input 
                           type="text" 
                           value={customTagInput}
                           onChange={(e) => setCustomTagInput(e.target.value)}
                           onKeyDown={(e) => {
                             if (e.key === 'Enter') {
                               e.preventDefault();
                               handleAddLogTag(customTagInput);
                             }
                           }}
                           placeholder="输入自定义标签按回车..."
                           className="w-full pl-8 pr-3 py-1.5 text-xs rounded border border-slate-300 focus:outline-none focus:border-blue-400"
                         />
                         <Tag size={12} className="absolute left-2.5 top-2 text-slate-400" />
                      </div>
                   </div>
                </div>

                <div className="flex justify-end relative z-10 border-t border-slate-100/50 pt-4 mt-2">
                  <button 
                    onClick={handleAddLog}
                    className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold text-white transition-all shadow-md transform active:scale-95
                      ${isConfidentialInput ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-200' : 'bg-slate-800 hover:bg-slate-700 shadow-slate-200'}`}
                  >
                    <Send size={14} /> 
                    {isConfidentialInput ? '加密归档' : '提交记录'}
                  </button>
                </div>
              </div>
            )}

            {/* Log History Timeline */}
            <div className="relative border-l-2 border-slate-100 ml-3 space-y-8 pl-8 py-2">
              {visibleLogs.map((log) => (
                <div key={log.id} className="relative group animate-fade-in">
                  {/* Timeline Dot */}
                  <div className={`absolute -left-[41px] top-0 w-5 h-5 rounded-full border-2 border-white shadow-sm flex items-center justify-center z-10
                    ${log.securityLevel === SecurityLevel.CONFIDENTIAL 
                      ? 'bg-amber-100 ring-2 ring-amber-50' 
                      : 'bg-blue-50 ring-2 ring-blue-50'}`}
                  >
                     {log.securityLevel === SecurityLevel.CONFIDENTIAL ? <Lock size={10} className="text-amber-600" /> : <div className="w-2 h-2 bg-blue-400 rounded-full"></div>}
                  </div>

                  {/* Content Card */}
                  <div className={`p-4 rounded-xl border transition-all hover:shadow-md
                    ${log.securityLevel === SecurityLevel.CONFIDENTIAL 
                      ? 'bg-amber-50/40 border-amber-100 hover:border-amber-200' 
                      : 'bg-white border-slate-100 hover:border-blue-100'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold uppercase tracking-wider
                           ${log.securityLevel === SecurityLevel.CONFIDENTIAL ? 'text-amber-700' : 'text-slate-500'}`}
                        >
                          {log.type === 'Intervention' ? '深度干预' : '日常记录'}
                        </span>
                        {log.securityLevel === SecurityLevel.CONFIDENTIAL && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-700 border border-amber-200">
                            绝密
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 whitespace-nowrap font-mono">{log.date}</span>
                    </div>

                    <p className={`text-sm my-2 leading-relaxed ${log.securityLevel === SecurityLevel.CONFIDENTIAL ? 'text-amber-900 font-medium' : 'text-slate-700'}`}>
                      {log.content}
                    </p>

                    <div className="flex flex-wrap gap-2 mt-3 items-center justify-between pt-2 border-t border-slate-50/50">
                      <div className="flex gap-2">
                        {log.tags.map(tag => (
                          <span key={tag} className="text-xs bg-white border border-slate-100 text-slate-500 px-2 py-0.5 rounded shadow-sm">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <User size={12} /> {log.author}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Masked Content Hint for Teachers (Simulated) */}
              {!canAccessConfidential && (
                <div className="relative group opacity-60">
                   <div className="absolute -left-[41px] top-0 w-5 h-5 rounded-full bg-slate-100 border-2 border-white z-10 flex items-center justify-center">
                      <Lock size={10} className="text-slate-300" />
                   </div>
                   <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 border-dashed flex items-center justify-center gap-2 text-slate-400 text-sm">
                      <span>******* 1条绝密记录已隐藏 *******</span>
                   </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default StudentProfile;