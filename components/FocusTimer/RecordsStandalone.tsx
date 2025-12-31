import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useFocusDashboard } from '../../hooks/useFocusDashboard';
import RecordsPageContent from './Records';

/**
 * Standalone Records page component for /records route
 */
const RecordsStandalone: React.FC = () => {
    const navigate = useNavigate();
    const { todayStats, allTimeStats } = useFocusDashboard();

    return (
        <RecordsPageContent
            isOpen={true}
            onClose={() => navigate('/focus')}
            onOpenSettings={() => navigate('/settings')}
            onOpenDeepFocus={() => navigate('/deepfocus')}
            todayStats={todayStats}
            allTimeStats={allTimeStats}
        />
    );
};

export default RecordsStandalone;
