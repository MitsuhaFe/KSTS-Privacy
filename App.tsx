import React, { useState } from 'react';
import { LayoutDashboard, Users, Bell, Settings, LogOut, GraduationCap, Hammer } from 'lucide-react';
import Dashboard from './components/Dashboard';
import StudentProfile from './components/StudentProfile';
import AlertsView from './components/AlertsView';
import AcademicsView from './components/AcademicsView';
import { Role, Student } from './types';
import { STUDENTS } from './constants';

const App: React.FC = () => {
  // Global State
  const [currentRole, setCurrentRole] = useState<Role>('TEACHER'); // Default role
  const [activeView, setActiveView] = useState<'dashboard' | 'students' | 'profile' | 'alerts' | 'academics'>('dashboard');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  
  // Move Students to State to allow modifications
  const [studentsData, setStudentsData] = useState<Student[]>(STUDENTS);

  // Computed
  const selectedStudent = studentsData.find(s => s.id === selectedStudentId);

  // Handlers
  const handleSelectStudent = (id: string) => {
    setSelectedStudentId(id);
    setActiveView('profile');
  };

  const handleNavClick = (view: 'dashboard' | 'students' | 'alerts' | 'academics') => {
    setActiveView(view);
    setSelectedStudentId(null);
  };

  const handleUpdateStudent = (updatedStudent: Student) => {
    setStudentsData(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
  };

  const handleAddStudent = (newStudent: Student) => {
    setStudentsData(prev => [...prev, newStudent]);
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* Sidebar Navigation */}
      <aside className="w-20 lg:w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex shrink-0 transition-all">
        <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-slate-100">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold mr-0 lg:mr-3 shadow-lg shadow-blue-200">
            K
          </div>
          <span className="font-bold text-lg hidden lg:block tracking-tight">KSTS <span className="text-slate-400 font-normal text-sm">Privacy</span></span>
        </div>

        <nav className="flex-1 py-6 space-y-2 px-3">
          <NavItem 
            icon={<LayoutDashboard size={20} />} 
            label="仪表盘" 
            active={activeView === 'dashboard'} 
            onClick={() => handleNavClick('dashboard')} 
          />
          <NavItem 
            icon={<Users size={20} />} 
            label="学生列表" 
            active={activeView === 'students'} 
            onClick={() => handleNavClick('students')} 
          />
          <NavItem 
            icon={<Bell size={20} />} 
            label="预警通知" 
            active={activeView === 'alerts'} 
            onClick={() => handleNavClick('alerts')} 
          />
          <NavItem 
            icon={<GraduationCap size={20} />} 
            label="教务分析" 
            active={activeView === 'academics'} 
            onClick={() => handleNavClick('academics')} 
          />
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button className="flex items-center text-slate-400 hover:text-slate-600 transition-colors w-full justify-center lg:justify-start p-2">
            <Settings size={20} />
            <span className="ml-3 text-sm hidden lg:block">系统设置</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Top Header - Role Switcher */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shadow-sm z-10">
          <div className="md:hidden text-lg font-bold">KSTS 跟踪系统</div>
          
          <div className="flex items-center gap-4 ml-auto">
            {/* Role Simulation Toggle (Crucial for Demo) */}
            <div className="bg-slate-100 rounded-lg p-1 flex text-xs font-medium">
              <button 
                onClick={() => setCurrentRole('TEACHER')}
                className={`px-3 py-1.5 rounded-md transition-all ${currentRole === 'TEACHER' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
              >
                教师视图
              </button>
              <button 
                onClick={() => setCurrentRole('HEADMASTER')}
                className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1 ${currentRole === 'HEADMASTER' ? 'bg-amber-100 text-amber-900 shadow-sm ring-1 ring-amber-200' : 'text-slate-500 hover:text-slate-700'}`}
              >
                 校长视图
              </button>
            </div>

            <div className="h-8 w-px bg-slate-200 mx-2"></div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-800">
                  {currentRole === 'TEACHER' ? '王老师' : '张校长'}
                </p>
                <p className="text-xs text-slate-500">
                  {currentRole === 'TEACHER' ? '数学教研组' : '教务处'}
                </p>
              </div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm
                ${currentRole === 'TEACHER' ? 'bg-gradient-to-br from-blue-400 to-blue-600' : 'bg-gradient-to-br from-amber-400 to-orange-600'}`}
              >
                {currentRole === 'TEACHER' ? '师' : '校'}
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic View Content */}
        <main className="flex-1 overflow-auto bg-slate-50 relative">
          {activeView === 'dashboard' && (
            <Dashboard 
              currentRole={currentRole} 
              onSelectStudent={handleSelectStudent} 
              showStats={true} 
              students={studentsData}
              onAddStudent={handleAddStudent}
            />
          )}

          {activeView === 'students' && (
            <Dashboard 
              currentRole={currentRole} 
              onSelectStudent={handleSelectStudent} 
              showStats={false} 
              students={studentsData}
              onAddStudent={handleAddStudent}
            />
          )}

          {activeView === 'alerts' && (
            <AlertsView currentRole={currentRole} onSelectStudent={handleSelectStudent} />
          )}

          {activeView === 'academics' && (
            <AcademicsView 
              currentRole={currentRole} 
              onSelectStudent={handleSelectStudent} 
              studentsData={studentsData} // Pass dynamic students
            />
          )}
          
          {activeView === 'profile' && selectedStudent && (
            <div className="h-full p-4 md:p-8">
               <StudentProfile 
                 student={selectedStudent} 
                 currentRole={currentRole} 
                 onBack={() => handleNavClick('dashboard')}
                 onUpdateStudent={handleUpdateStudent}
               />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

// Helper Component for Sidebar
const NavItem = ({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 group
      ${active ? 'bg-slate-100 text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
    `}
  >
    <span className={`lg:mr-3 ${active ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`}>{icon}</span>
    <span className="font-medium text-sm hidden lg:block">{label}</span>
  </button>
);

export default App;