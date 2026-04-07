import type { Doctor, InsurancePlan, ContactInfo } from '@/types/medical-agent';

const MOCK_DOCTORS: Doctor[] = [
  {
    id: 'doc-001',
    name: '张伟',
    department: '内科',
    title: '主任医师',
    hospital: '北京协和医院',
    location: '北京',
    rating: 4.9,
    availableSlots: ['2026-04-05 09:00', '2026-04-06 14:00', '2026-04-07 10:30'],
    distance: '2.3km',
    specialties: ['消化系统疾病', '呼吸系统疾病', '内分泌失调'],
  },
  {
    id: 'doc-002',
    name: '李芳',
    department: '心血管科',
    title: '副主任医师',
    hospital: '北京阜外医院',
    location: '北京',
    rating: 4.8,
    availableSlots: ['2026-04-05 11:00', '2026-04-06 09:30'],
    distance: '3.5km',
    specialties: ['高血压', '冠心病', '心律失常'],
  },
  {
    id: 'doc-003',
    name: '王强',
    department: '骨科',
    title: '主任医师',
    hospital: '北京积水潭医院',
    location: '北京',
    rating: 4.7,
    availableSlots: ['2026-04-05 15:00', '2026-04-07 08:30'],
    distance: '5.1km',
    specialties: ['关节疾病', '脊柱疾病', '运动损伤'],
  },
  {
    id: 'doc-004',
    name: '陈静',
    department: '皮肤科',
    title: '主治医师',
    hospital: '北京大学第一医院',
    location: '北京',
    rating: 4.6,
    availableSlots: ['2026-04-05 10:00', '2026-04-06 16:00'],
    distance: '4.2km',
    specialties: ['过敏性皮炎', '痤疮', '湿疹'],
  },
  {
    id: 'doc-005',
    name: '刘洋',
    department: '心理科',
    title: '副主任医师',
    hospital: '北京安定医院',
    location: '北京',
    rating: 4.9,
    availableSlots: ['2026-04-05 13:00', '2026-04-06 11:00', '2026-04-07 15:30'],
    distance: '6.0km',
    specialties: ['焦虑症', '抑郁症', '失眠'],
  },
  {
    id: 'doc-006',
    name: '赵敏',
    department: '妇科',
    title: '主任医师',
    hospital: '北京妇产医院',
    location: '北京',
    rating: 4.8,
    availableSlots: ['2026-04-05 08:30', '2026-04-06 10:00'],
    distance: '3.8km',
    specialties: ['月经不调', '不孕不育', '孕期管理'],
  },
  {
    id: 'doc-007',
    name: '孙磊',
    department: '呼吸科',
    title: '副主任医师',
    hospital: '北京朝阳医院',
    location: '北京',
    rating: 4.7,
    availableSlots: ['2026-04-05 14:30', '2026-04-07 09:00'],
    distance: '4.5km',
    specialties: ['哮喘', '慢性阻塞性肺病', '肺炎'],
  },
  {
    id: 'doc-008',
    name: '周婷',
    department: '儿科',
    title: '主任医师',
    hospital: '北京儿童医院',
    location: '北京',
    rating: 4.9,
    availableSlots: ['2026-04-05 09:30', '2026-04-06 08:00', '2026-04-07 11:00'],
    distance: '5.5km',
    specialties: ['小儿感冒', '小儿消化不良', '儿童过敏'],
  },
];

const MOCK_INSURANCE: InsurancePlan[] = [
  {
    id: 'ins-001',
    name: '健康无忧计划',
    provider: '平安保险',
    coverage: ['门诊', '住院', '手术', '药品', '体检'],
    monthlyPrice: 299,
    deductible: 500,
    rating: 4.7,
    matchReason: '覆盖常见疾病门诊和住院，适合日常医疗保障',
  },
  {
    id: 'ins-002',
    name: '尊享医疗计划',
    provider: '中国人寿',
    coverage: ['门诊', '住院', '手术', '特药', '重疾', '海外就医'],
    monthlyPrice: 899,
    deductible: 0,
    rating: 4.9,
    matchReason: '高端医疗保障，零免赔额，覆盖重大疾病',
  },
  {
    id: 'ins-003',
    name: '家庭守护计划',
    provider: '太平洋保险',
    coverage: ['门诊', '住院', '儿童医疗', '孕产', '疫苗'],
    monthlyPrice: 599,
    deductible: 300,
    rating: 4.6,
    matchReason: '适合家庭全员保障，含儿童和孕产专项保障',
  },
  {
    id: 'ins-004',
    name: '基础医保补充',
    provider: '新华保险',
    coverage: ['住院', '手术', '门诊大病'],
    monthlyPrice: 129,
    deductible: 1000,
    rating: 4.3,
    matchReason: '经济实惠，作为基本医保的有效补充',
  },
];

const MOCK_CONTACTS: ContactInfo[] = [
  {
    type: 'emergency',
    label: '急救电话',
    value: '120',
    description: '24小时急救热线',
    available: '24/7',
  },
  {
    type: 'hotline',
    label: '客服热线',
    value: '400-888-8888',
    description: '医疗咨询与预约挂号服务',
    available: '周一至周日 8:00-22:00',
  },
  {
    type: 'online',
    label: '在线咨询',
    value: 'https://medical.example.com/chat',
    description: '在线与医生实时沟通',
    available: '24/7',
  },
  {
    type: 'appointment',
    label: '预约挂号',
    value: '400-666-6666',
    description: '专家号源预约服务',
    available: '周一至周六 8:00-18:00',
  },
];

function matchDepartment(symptoms: string): string {
  const lower = symptoms.toLowerCase();
  if (lower.includes('头痛') || lower.includes('头晕') || lower.includes('失眠') || lower.includes('焦虑') || lower.includes('抑郁')) return '心理科';
  if (lower.includes('胸闷') || lower.includes('心悸') || lower.includes('血压') || lower.includes('心脏')) return '心血管科';
  if (lower.includes('咳嗽') || lower.includes('气喘') || lower.includes('呼吸') || lower.includes('肺炎')) return '呼吸科';
  if (lower.includes('胃痛') || lower.includes('腹泻') || lower.includes('消化') || lower.includes('呕吐')) return '内科';
  if (lower.includes('皮肤') || lower.includes('过敏') || lower.includes('皮疹') || lower.includes('瘙痒')) return '皮肤科';
  if (lower.includes('骨折') || lower.includes('关节') || lower.includes('腰') || lower.includes('颈')) return '骨科';
  if (lower.includes('月经') || lower.includes('怀孕') || lower.includes('妇科')) return '妇科';
  if (lower.includes('儿童') || lower.includes('小孩') || lower.includes('宝宝') || lower.includes('发烧')) return '儿科';
  if (lower.includes('眼') || lower.includes('视力') || lower.includes('红眼')) return '眼科';
  if (lower.includes('耳') || lower.includes('鼻') || lower.includes('喉') || lower.includes('嗓子')) return '耳鼻喉科';
  if (lower.includes('牙') || lower.includes('口腔') || lower.includes('牙龈')) return '口腔科';
  return '内科';
}

async function simulateDelay(ms = 500) {
  const delay = ms + Math.random() * 500;
  await new Promise((resolve) => setTimeout(resolve, delay));
}

export async function searchDoctors(location: string, symptoms: string, token: string): Promise<Doctor[]> {
  await simulateDelay(500);

  if (!token || !token.startsWith('mock-user-token-')) {
    throw new Error('Invalid authentication token');
  }

  const department = matchDepartment(symptoms);
  return MOCK_DOCTORS
    .filter((d) => d.department === department || department === '内科')
    .slice(0, 3)
    .map((d) => ({
      ...d,
      location: location || d.location,
    }));
}

export async function suggestInsurance(symptoms: string, insuranceStatus: string, token: string): Promise<InsurancePlan[]> {
  await simulateDelay(400);

  if (!token || !token.startsWith('mock-user-token-')) {
    throw new Error('Invalid authentication token');
  }

  if (insuranceStatus === 'basic') {
    return MOCK_INSURANCE.filter((i) => i.id === 'ins-004' || i.id === 'ins-001').slice(0, 2);
  }
  if (insuranceStatus === 'commercial') {
    return MOCK_INSURANCE.filter((i) => i.id === 'ins-002' || i.id === 'ins-003').slice(0, 2);
  }
  return MOCK_INSURANCE.slice(0, 3);
}

export async function getContactInfo(type?: string): Promise<ContactInfo[]> {
  await simulateDelay(300);

  if (type === 'emergency') {
    return MOCK_CONTACTS.filter((c) => c.type === 'emergency');
  }
  return MOCK_CONTACTS;
}

export function getDepartmentBySymptoms(symptoms: string): string {
  return matchDepartment(symptoms);
}
