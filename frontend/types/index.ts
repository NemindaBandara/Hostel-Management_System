export interface Asset {
    name: string;
    total: number;
    working: number;
    _id?: string;
}

export interface AssetRecord {
    working: number;
    total?: number; // legacy room assets fallback mapping
    notWorking?: number; // newer precise mapping
}

export interface FacultyRef {
    _id: string;
    name: string;
    facultyCode?: string;
    color?: string;
}

export interface Room {
    _id: string;
    roomNumber: string;
    floor: number;
    isGeneral: boolean;
    hostel?: string | { officialName: string, alias?: string };
    allocation?: {
        faculty?: FacultyRef | string;
        year?: string | number;
        capacity?: number;
    };
    genderType: 'Male' | 'Female' | 'Neutral';
    students: string[]; // Can be populated or just IDs
    assets?: Record<string, AssetRecord>;
    pendingTickets?: any[];
}

export interface CommonAreaAssetRecord {
    working: number;
    notWorking: number;
}

export interface CommonArea {
    _id: string;
    name: string;
    type: 'Washroom' | 'Study Room' | 'Common Room';
    floor: number;
    assets?: Record<string, CommonAreaAssetRecord>;
    pendingTickets?: any[];
}

export interface FloorData {
    floor: number;
    rooms: Room[];
    commonAreas: CommonArea[];
}
