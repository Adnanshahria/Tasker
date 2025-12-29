// AssignmentTracker Types
export interface AssignmentFormState {
    title: string;
    description: string;
    subject: string;
    date: string;
    type: string;
    priority: string;
    status: string;
    startTime: string;
    endTime: string;
}

export interface AssignmentFilters {
    subject: string;
    status: string;
}

export const createInitialFormState = (): AssignmentFormState => ({
    title: '',
    description: '',
    subject: '',
    date: '',
    type: '',
    priority: '',
    status: '',
    startTime: '',
    endTime: '',
});
