import { Student, LogEntry, GradeRecord, SecurityLevel, AlertItem, ClassAcademicStat } from './types';

export const STUDENTS: Student[] = [
  {
    id: 's1',
    name: '陈小明',
    gender: 'Male',
    classId: '三年二班',
    avatar: 'https://picsum.photos/200/200',
    isBoarder: true,
    publicTags: [
      { label: '数学薄弱', color: 'red' },
      { label: '篮球队', color: 'blue' }
    ],
    familyBackground: {
      economicStatus: 'Difficult',
      guardianContact: '138-0000-0001',
      notes: '父母近期离异，目前与祖母共同居住，家庭支持系统较弱。',
    },
    psychProfile: {
      status: 'At Risk',
      lastAssessment: '2023-10-15',
      notes: '表现出社交退缩迹象，需关注情绪波动。',
    },
  },
  {
    id: 's2',
    name: '林莎莎',
    gender: 'Female',
    classId: '三年二班',
    avatar: 'https://picsum.photos/201/201',
    isBoarder: false,
    publicTags: [
      { label: '物理课代表', color: 'purple' },
      { label: '班长', color: 'amber' }
    ],
    familyBackground: {
      economicStatus: 'Average',
      guardianContact: '139-0000-0002',
      notes: '家庭环境稳定，父母由于工作繁忙，偶尔由保姆接送。',
    },
    psychProfile: {
      status: 'Healthy',
      lastAssessment: '2023-09-10',
      notes: '心理状况良好，抗压能力较强。',
    },
  },
  {
    id: 's3',
    name: '王迈克',
    gender: 'Male',
    classId: '三年三班',
    avatar: 'https://picsum.photos/202/202',
    isBoarder: true,
    publicTags: [
      { label: '历史迷', color: 'green' },
      { label: '经常迟到', color: 'red' }
    ],
    familyBackground: {
      economicStatus: 'Affluent',
      guardianContact: '137-0000-0003',
      notes: '父亲常年在海外经商，母亲全职陪读，物质条件优越。',
    },
    psychProfile: {
      status: 'Healthy',
      lastAssessment: '2023-11-01',
      notes: '性格开朗，但表达出对父亲的思念。',
    },
  },
];

export const MOCK_LOGS: LogEntry[] = [
  {
    id: 'l1',
    studentId: 's1',
    date: '2023-10-25',
    type: 'Behavior',
    content: '在第二节数学课上睡觉，叫醒后精神状态仍不佳。',
    tags: ['#上课睡觉', '#数学课'],
    securityLevel: SecurityLevel.PUBLIC,
    author: '王老师 (数学)',
  },
  {
    id: 'l2',
    studentId: 's1',
    date: '2023-10-26',
    type: 'Intervention',
    content: '因成绩大幅下滑进行私密谈话。学生透露祖母生病住院，无人照顾，心情低落。',
    tags: ['#家庭变故', '#心理疏导'],
    securityLevel: SecurityLevel.CONFIDENTIAL,
    author: '李校长',
  },
  {
    id: 'l3',
    studentId: 's1',
    date: '2023-10-27',
    type: 'Homework',
    content: '作业迟交，但完成质量尚可。',
    tags: ['#作业迟交', '#补交'],
    securityLevel: SecurityLevel.PUBLIC,
    author: '张老师 (英语)',
  },
  {
    id: 'l4',
    studentId: 's1',
    date: '2023-11-02',
    type: 'Psych',
    content: '心理测评结果显示有轻度焦虑症状，建议持续关注。',
    tags: ['#焦虑倾向', '#健康'],
    securityLevel: SecurityLevel.CONFIDENTIAL,
    author: '赵医生 (心理)',
  },
];

export const MOCK_GRADES: GradeRecord[] = [
  // Chen Xiaoming (s1) - Low Math, High English, Avg Others
  { id: 'g1', studentId: 's1', subject: '数学', score: 85, date: '2023-09-15', examName: '9月中测' },
  { id: 'g2', studentId: 's1', subject: '数学', score: 82, date: '2023-10-10', examName: '10月月考' },
  { id: 'g3', studentId: 's1', subject: '数学', score: 60, date: '2023-10-30', examName: '10月末突击' }, 
  { id: 'g4', studentId: 's1', subject: '英语', score: 88, date: '2023-09-15', examName: '9月中测' },
  { id: 'g5', studentId: 's1', subject: '英语', score: 90, date: '2023-10-10', examName: '10月月考' },
  { id: 'g6', studentId: 's1', subject: '语文', score: 75, date: '2023-10-10', examName: '10月月考' },
  { id: 'g7', studentId: 's1', subject: '物理', score: 65, date: '2023-10-10', examName: '10月月考' },
  { id: 'g7b', studentId: 's1', subject: '化学', score: 70, date: '2023-10-10', examName: '10月月考' },
  
  // Lin Shasha (s2) - High Everything
  { id: 'g8', studentId: 's2', subject: '数学', score: 92, date: '2023-09-15', examName: '9月中测' },
  { id: 'g9', studentId: 's2', subject: '数学', score: 95, date: '2023-10-10', examName: '10月月考' },
  { id: 'g10', studentId: 's2', subject: '语文', score: 88, date: '2023-10-10', examName: '10月月考' },
  { id: 'g11', studentId: 's2', subject: '物理', score: 98, date: '2023-10-10', examName: '10月月考' },
  { id: 'g11b', studentId: 's2', subject: '英语', score: 95, date: '2023-10-10', examName: '10月月考' },
  { id: 'g11c', studentId: 's2', subject: '化学', score: 92, date: '2023-10-10', examName: '10月月考' },

  // Wang Mike (s3) - Good History/English, Avg Math
  { id: 'g12', studentId: 's3', subject: '数学', score: 70, date: '2023-09-15', examName: '9月中测' },
  { id: 'g13', studentId: 's3', subject: '数学', score: 75, date: '2023-10-10', examName: '10月月考' },
  { id: 'g14', studentId: 's3', subject: '历史', score: 95, date: '2023-10-10', examName: '10月月考' },
  { id: 'g15', studentId: 's3', subject: '英语', score: 85, date: '2023-10-10', examName: '10月月考' },
  { id: 'g16', studentId: 's3', subject: '语文', score: 80, date: '2023-10-10', examName: '10月月考' },
  { id: 'g17', studentId: 's3', subject: '物理', score: 60, date: '2023-10-10', examName: '10月月考' },
];

export const MOCK_ALERTS: AlertItem[] = [
  {
    id: 'a1',
    studentId: 's1',
    studentName: '陈小明',
    type: 'Family',
    level: 'High',
    date: '2023-11-02',
    contentPublic: '近期行为异常，课堂注意力严重不集中，建议关注。',
    contentConfidential: '家庭变故（父母离异诉讼期），学生情绪极不稳定，存在逃学风险。',
  },
  {
    id: 'a2',
    studentId: 's1',
    studentName: '陈小明',
    type: 'Academic',
    level: 'Medium',
    date: '2023-10-16',
    contentPublic: '数学期中考试成绩下滑超过 20%。',
    contentConfidential: '数学成绩下滑 20%，关联到心理档案中的“焦虑倾向”。',
  },
  {
    id: 'a3',
    studentId: 's3',
    studentName: '王迈克',
    type: 'Behavior',
    level: 'Low',
    date: '2023-11-01',
    contentPublic: '本周累计迟到 3 次。',
    contentConfidential: '本周累计迟到 3 次，学生自述父亲长期不在家，无人督促起床。',
  },
];

export const MOCK_CLASS_STATS: ClassAcademicStat[] = [
  { subject: '数学', average: 78.5, max: 98, min: 45 },
  { subject: '语文', average: 82.1, max: 96, min: 60 },
  { subject: '英语', average: 75.3, max: 99, min: 30 },
  { subject: '物理', average: 68.9, max: 95, min: 40 },
  { subject: '化学', average: 72.4, max: 92, min: 55 },
];