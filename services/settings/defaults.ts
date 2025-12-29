import { UserSettings } from './types';

// Default settings for Bangla
export const DEFAULT_SETTINGS_BN: UserSettings = {
    subjects: ['গণিত', 'পদার্থবিজ্ঞান', 'রসায়ন', 'জীববিজ্ঞান', 'ইংরেজি', 'বাংলা', 'ইতিহাস', 'ভূগোল', 'ICT'],
    types: ['অ্যাসাইনমেন্ট', 'পরীক্ষা', 'কুইজ', 'প্রজেক্ট', 'ল্যাব', 'প্রেজেন্টেশন'],
    statuses: ['শুরু হয়নি', 'চলছে', 'সম্পন্ন'],
    priorities: ['কম', 'মাঝারি', 'জরুরি'],
    language: 'bn'
};

// Default settings for English
export const DEFAULT_SETTINGS_EN: UserSettings = {
    subjects: ['Math', 'Physics', 'Chemistry', 'Biology', 'English', 'History', 'Computer Science'],
    types: ['Assignment', 'Exam', 'Quiz', 'Project', 'Lab', 'Presentation'],
    statuses: ['Not Started', 'In Progress', 'Completed'],
    priorities: ['Low', 'Medium', 'Urgent'],
    language: 'en'
};
