import React from 'react';
import { useNavigate } from 'react-router-dom';
import DeepFocusTimer from './DeepFocus';

/**
 * Standalone DeepFocus page component for /deepfocus route
 */
const DeepFocusStandalone: React.FC = () => {
    const navigate = useNavigate();

    return (
        <DeepFocusTimer
            isOpen={true}
            onClose={() => navigate('/focus')}
        />
    );
};

export default DeepFocusStandalone;
