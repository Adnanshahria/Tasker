import { useCallback, useRef } from 'react';
import * as Tone from 'tone';

export const useAudioAlert = () => {
    const synthRef = useRef<Tone.Synth | null>(null);
    const isInitializedRef = useRef(false);

    // Initialize audio on first user interaction
    const initAudio = useCallback(async () => {
        if (isInitializedRef.current) return;

        try {
            await Tone.start();
            isInitializedRef.current = true;
        } catch (error) {
            console.warn('Failed to initialize audio:', error);
        }
    }, []);

    // Play completion sound
    const playAlert = useCallback(async () => {
        // Ensure audio context is started
        if (!isInitializedRef.current) {
            await initAudio();
        }

        try {
            // Create synth if not exists
            if (!synthRef.current) {
                synthRef.current = new Tone.Synth({
                    oscillator: { type: 'sine' },
                    envelope: {
                        attack: 0.01,
                        decay: 0.1,
                        sustain: 0.5,
                        release: 3, // 3-second fade out
                    },
                }).toDestination();
            }

            // Play C5 note (523.25 Hz) - clean, non-intrusive sound
            synthRef.current.triggerAttackRelease('C5', '1n');
        } catch (error) {
            console.warn('Failed to play audio alert:', error);
        }
    }, [initAudio]);

    // Cleanup
    const dispose = useCallback(() => {
        if (synthRef.current) {
            synthRef.current.dispose();
            synthRef.current = null;
        }
    }, []);

    return {
        playAlert,
        initAudio,
        dispose,
    };
};
